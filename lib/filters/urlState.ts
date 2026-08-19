import { FACETS, dropOrphanedAttributes } from "./facets";
import { DEFAULT_SORT, SORT_OPTIONS, type Selections, type SortId } from "./engine";

/**
 * Filter state lives in the query string — `?gender=men,boys&seller=grasim&sort=margin_desc`.
 * That gives the demo a working back button and shareable links to any
 * particular combination.
 */
export function parseSelections(params: URLSearchParams, locked?: string): Selections {
  const selections: Selections = {};
  for (const facet of FACETS) {
    const raw = params.get(facet.id);
    if (!raw) continue;
    const valid = new Set(facet.options.map((o) => o.id));
    const chosen = raw.split(",").filter((id) => valid.has(id));
    if (chosen.length) selections[facet.id] = chosen;
  }
  // `?fit=slim-fit` with no single vertical would filter the list with no row
  // on the rail to show or undo it. `locked` is variants C and D, where the
  // page supplies the vertical instead of the query string — without it the
  // guard would strip every attribute the moment the page loaded.
  return dropOrphanedAttributes(selections, locked);
}

export function parseSort(params: URLSearchParams): SortId {
  const raw = params.get("sort");
  return SORT_OPTIONS.some((o) => o.id === raw) ? (raw as SortId) : DEFAULT_SORT;
}

export function buildQuery(selections: Selections, sort: SortId): string {
  const params = new URLSearchParams();
  // Iterate FACETS rather than the object so the query string order is stable.
  for (const facet of FACETS) {
    const chosen = selections[facet.id];
    if (chosen?.length) params.set(facet.id, chosen.join(","));
  }
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}
