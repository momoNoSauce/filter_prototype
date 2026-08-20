import type { Product } from "@/lib/catalog/types";
import { SIZE_FACET_ID, activeVariant } from "./activeVariant";
import { FACETS, FACET_BY_ID, type FacetOption } from "./facets";

/** facetId -> selected option ids. Absent or empty means "no constraint". */
export type Selections = Record<string, string[]>;

export type SortId = "popularity" | "recent" | "price_asc" | "price_desc" | "margin_desc";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "popularity", label: "Popularity" },
  { id: "recent", label: "Recently Added" },
  { id: "price_asc", label: "Price/pc (low → high)" },
  { id: "price_desc", label: "Price/pc (high → low)" },
  { id: "margin_desc", label: "Highest Margin" },
];

export const DEFAULT_SORT: SortId = "popularity";

function matchesFacet(
  product: Product,
  facetId: string,
  chosen: string[],
  sizes?: string[],
): boolean {
  const facet = FACET_BY_ID.get(facetId);
  if (!facet) return true;
  const values = facet.valuesOf(product, sizes);
  // OR within a facet.
  return values.some((value) => chosen.includes(value));
}

/**
 * AND across facets, OR within a facet — the standard faceted-search contract.
 *
 * `skipFacetId` exists for count computation: when tallying the options of
 * facet F we must ignore F's own selections, otherwise every unselected option
 * in F would read zero and the panel would collapse the moment you ticked
 * anything.
 *
 * Size is the one selection that reaches beyond its own facet, because it
 * moves which pack Price and Margin read. Skipping Size therefore also drops
 * that influence and puts both back on pack #1 — which is what "ignore this
 * facet's selections" has to mean if the answer is to stay consistent. The
 * visible consequence is narrow: with Size *and* a price or margin filter both
 * active, an option count inside the Size panel can differ slightly from the
 * total you get after ticking it. The footer total is always exact, because
 * nothing is skipped there.
 */
export function applyFilters(
  products: Product[],
  selections: Selections,
  skipFacetId?: string,
): Product[] {
  const active = Object.entries(selections).filter(
    ([facetId, chosen]) => chosen.length > 0 && facetId !== skipFacetId,
  );
  if (!active.length) return products;

  const sizes = skipFacetId === SIZE_FACET_ID ? undefined : selections[SIZE_FACET_ID];

  return products.filter((product) =>
    active.every(([facetId, chosen]) => matchesFacet(product, facetId, chosen, sizes)),
  );
}

export function countMatching(products: Product[], selections: Selections): number {
  return applyFilters(products, selections).length;
}

export interface CountedOption extends FacetOption {
  count: number;
}

/**
 * Options for one facet with live counts, computed against every *other*
 * facet's selections.
 *
 * Options that drop to zero are omitted — this is what makes a whole product
 * vertical disappear when you filter by gender. Anything currently selected is
 * always kept, so a selection can never become impossible to untick.
 */
export function facetOptionsWithCounts(
  products: Product[],
  selections: Selections,
  facetId: string,
): CountedOption[] {
  const facet = FACET_BY_ID.get(facetId);
  if (!facet) return [];

  const selected = selections[facetId] ?? [];

  /*
   * Size is counted by *applying* each option rather than tallying it.
   *
   * Every other facet can be tallied in one pass, because a product's value
   * for one facet doesn't depend on what's selected in another. Size breaks
   * that: it moves which pack the card is priced by, so ticking a size can
   * push a product out of the Price or Margin band it was in. Tallying with
   * size ignored counts that product anyway, and the panel then promises a
   * result the tap can't deliver — measured 2026-08-19, an option labelled
   * `(1)` handing back an empty page, because pack #1 was ₹610 and the pack
   * carrying the size was ₹575.
   *
   * Thirteen options, one filter pass each, a couple of milliseconds. The
   * count means what it says.
   */
  if (facetId === SIZE_FACET_ID) {
    return facet.options
      .map((option) => ({
        ...option,
        /*
         * The option **on its own**, with the rest of the selections applied —
         * the same own-facet-excluded question the tally below asks, just
         * answered by filtering instead of counting.
         *
         * It must not be `selected ∪ option`, the shape this carried until
         * 2026-08-20. Size is OR-within-a-facet, so a union can only ever
         * widen: once one size was ticked, every other option inherited at
         * least that selection's count, nothing could fall to zero, and the
         * hide-at-zero rule stopped firing. Pick Women's T-Shirts, tick S, and
         * the panel offered `2-3Y` — an age band no adult vertical carries —
         * showing S's own count back at you.
         *
         * Replacing rather than skipping is the part that matters: the size
         * filter has to actually run, or the active pack doesn't move and the
         * count goes back to promising results a tap can't deliver.
         */
        count: applyFilters(products, { ...selections, [facetId]: [option.id] })
          .length,
      }))
      .filter((option) => option.count > 0 || selected.includes(option.id));
  }

  const scope = applyFilters(products, selections, facetId);
  const sizes = selections[SIZE_FACET_ID];
  const tally = new Map<string, number>();
  for (const product of scope) {
    for (const value of facet.valuesOf(product, sizes)) {
      tally.set(value, (tally.get(value) ?? 0) + 1);
    }
  }

  return facet.options
    .map((option) => ({ ...option, count: tally.get(option.id) ?? 0 }))
    .filter((option) => option.count > 0 || selected.includes(option.id));
}

/**
 * Options that would actually change the result set: carried by some products
 * in scope but not all of them.
 *
 * `facetOptionsWithCounts` already drops options no product has. This drops
 * the opposite dead end — an option *every* product has, which filters nothing
 * out and so is a control that does nothing when tapped. Anything already
 * selected is kept regardless, so a selection never becomes impossible to
 * undo.
 */
export function discriminatingOptions(
  products: Product[],
  selections: Selections,
  facetId: string,
): CountedOption[] {
  const scope = applyFilters(products, selections, facetId).length;
  const selected = selections[facetId] ?? [];
  return facetOptionsWithCounts(products, selections, facetId).filter(
    (option) => selected.includes(option.id) || option.count < scope,
  );
}

/**
 * `sizes` is the current Size selection. Price and margin rank on the pack the
 * card is actually printing, which a size filter moves off pack #1 — rank it
 * anywhere else and a low-to-high sort lists visibly descending prices.
 */
export function sortProducts(products: Product[], sort: SortId, sizes?: string[]): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "recent":
      return sorted.sort((a, b) => a.listedDaysAgo - b.listedDaysAgo);
    case "price_asc":
      return sorted.sort(
        (a, b) => activeVariant(a, sizes).pricePerPc - activeVariant(b, sizes).pricePerPc,
      );
    case "price_desc":
      return sorted.sort(
        (a, b) => activeVariant(b, sizes).pricePerPc - activeVariant(a, sizes).pricePerPc,
      );
    case "margin_desc":
      return sorted.sort(
        (a, b) => activeVariant(b, sizes).marginPct - activeVariant(a, sizes).marginPct,
      );
    case "popularity":
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

/** Total number of individually selected options, for badges and Clear state. */
export function countSelections(selections: Selections): number {
  return Object.values(selections).reduce((sum, chosen) => sum + chosen.length, 0);
}

/**
 * Toggle one option on a facet. Every facet is multi-select — exclusivity was
 * only ever a property of a control, never of a facet, and no control claims
 * it any more.
 */
export function toggleSelection(
  selections: Selections,
  facetId: string,
  optionId: string,
): Selections {
  const current = selections[facetId] ?? [];
  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];

  const updated = { ...selections };
  if (next.length) updated[facetId] = next;
  else delete updated[facetId];
  return updated;
}

/**
 * Same options, ignoring order — order is only ever the sequence they were
 * tapped in, never anything the user chose.
 */
export function sameOptions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * Whether two selection sets would filter identically.
 *
 * Used by the draft surfaces to decide whether dismissing them actually loses
 * anything: a sheet opened and closed untouched, or one where an option was
 * ticked and unticked again, has nothing to announce. An absent key and an
 * empty array both mean "no constraint", so they must compare equal.
 */
export function sameSelections(a: Selections, b: Selections): boolean {
  const facetIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const facetId of facetIds) {
    if (!sameOptions(a[facetId] ?? [], b[facetId] ?? [])) return false;
  }
  return true;
}

/** Rail entries that currently constrain the result set, for the applied dot. */
export function activeFacetIds(selections: Selections): Set<string> {
  return new Set(
    FACETS.filter((f) => (selections[f.id] ?? []).length > 0).map((f) => f.id),
  );
}
