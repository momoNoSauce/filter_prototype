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
 * Toggle one option on a facet. Every facet in the Filters screen is
 * multi-select; Variant A's Gender sheet does its own single-select in the
 * component, since that's a property of the control, not of the facet.
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

/** Rail entries that currently constrain the result set, for the applied dot. */
export function activeFacetIds(selections: Selections): Set<string> {
  return new Set(
    FACETS.filter((f) => (selections[f.id] ?? []).length > 0).map((f) => f.id),
  );
}
