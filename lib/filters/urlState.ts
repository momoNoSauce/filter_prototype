import {
  FACETS,
  FILTER_VERTICALS,
  dropOrphanedSelections,
  settledVertical,
  type VerticalMode,
} from "./facets";
import { DEFAULT_SORT, SORT_OPTIONS, type Selections, type SortId } from "./engine";

/**
 * Filter state lives in the query string — `?gender=men,boys&seller=grasim&sort=margin_desc`.
 * That gives the demo a working back button and shareable links to any
 * particular combination.
 */
export function parseSelections(
  params: URLSearchParams,
  mode: VerticalMode = FILTER_VERTICALS,
  /**
   * The page's in-scope products, so a vertical settled by a Gender cut is
   * recognised on load and not just after a click. Without it, a shared link
   * like `?gender=women&size=s,m,l` on a storefront with one women's vertical
   * would have its Size stripped as orphaned — the rail shows Size on that page,
   * so stripping it is the bug, not the guard.
   *
   * Optional because most callers have no scope to offer and the old behaviour
   * is the right default: no products means nothing can settle a vertical except
   * an explicit category or `locked`.
   */
  products: { category: string; gender: string }[] = [],
): Selections {
  const selections: Selections = {};
  for (const facet of FACETS) {
    const raw = params.get(facet.id);
    if (!raw) continue;
    const valid = new Set(facet.options.map((o) => o.id));
    // `accepts` widens this for a facet whose selections aren't all in its
    // option list — Price, for typed ranges. The guard itself stays: an id
    // that is neither an option nor accepted is still dropped, so a
    // hand-written query can't filter a listing on nonsense.
    const chosen = raw.split(",").filter((id) => valid.has(id) || facet.accepts?.(id));
    if (chosen.length) selections[facet.id] = chosen;
  }
  // `?fit=slim-fit` with no single vertical would filter the list with no row
  // on the rail to show or undo it. Under `locked` the page supplies the
  // vertical instead of the query string — without knowing that, the guard
  // would strip every attribute the moment the page loaded.
  return dropOrphanedSelections(
    selections,
    mode,
    settledVertical(products, selections, mode),
  );
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
