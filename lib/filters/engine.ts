import { defaultVariant, type Product } from "@/lib/catalog/types";
import { FACETS, FACET_BY_ID, type FacetOption } from "./facets";

/** facetId -> selected option ids. Absent or empty means "no constraint". */
export type Selections = Record<string, string[]>;

export type SortId = "popularity" | "recent" | "price_asc" | "margin_desc";

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "popularity", label: "Popularity" },
  { id: "recent", label: "Recently Added" },
  { id: "price_asc", label: "Price/pc (low → high)" },
  { id: "margin_desc", label: "Highest Margin" },
];

export const DEFAULT_SORT: SortId = "popularity";

function matchesFacet(product: Product, facetId: string, chosen: string[]): boolean {
  const facet = FACET_BY_ID.get(facetId);
  if (!facet) return true;
  const values = facet.valuesOf(product);
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

  return products.filter((product) =>
    active.every(([facetId, chosen]) => matchesFacet(product, facetId, chosen)),
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

  const scope = applyFilters(products, selections, facetId);
  const tally = new Map<string, number>();
  for (const product of scope) {
    for (const value of facet.valuesOf(product)) {
      tally.set(value, (tally.get(value) ?? 0) + 1);
    }
  }

  const selected = selections[facetId] ?? [];
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

export function sortProducts(products: Product[], sort: SortId): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "recent":
      return sorted.sort((a, b) => a.listedDaysAgo - b.listedDaysAgo);
    case "price_asc":
      return sorted.sort(
        (a, b) => defaultVariant(a).pricePerPc - defaultVariant(b).pricePerPc,
      );
    case "margin_desc":
      return sorted.sort(
        (a, b) => defaultVariant(b).marginPct - defaultVariant(a).marginPct,
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
