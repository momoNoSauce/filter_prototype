"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import {
  applyFilters,
  sortProducts,
  DEFAULT_SORT,
  type Selections,
  type SortId,
} from "@/lib/filters/engine";
import { getRailFacetIds, type PlpVariant } from "@/lib/filters/facets";
import { buildQuery, parseSelections, parseSort } from "@/lib/filters/urlState";
import { AppBar } from "./AppBar";
import { GoldStrip } from "./GoldStrip";
import { ProductCard } from "./ProductCard";
import { BottomActionBar } from "./BottomActionBar";
import { TopChipBar } from "./TopChipBar";
import { SortSheet } from "@/components/sheets/SortSheet";
import { CategorySheet } from "@/components/sheets/CategorySheet";
import { FilterScreen } from "@/components/filters/FilterScreen";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 8;

/**
 * One string for both draft surfaces. The Category sheet and the Filters
 * screen lose a draft the same way, and giving the same event two wordings
 * would read as two different things happening.
 */
const DISCARDED = "Selection discarded";

type Overlay = "sort" | "category" | "filters" | null;

/**
 * Two interaction models over the same screen, so they can be compared:
 *
 * - `bottom-bar` — Category · Sort · Filters pinned to the bottom (Figma
 *                  638:2836). Category is a multi-select quick action in its
 *                  own sheet, and is therefore absent from the Filters rail.
 * - `top-chips`  — Sort and Filter as chips under the GOLD strip (Figma
 *                  644:4011), no bottom bar, so Category is an ordinary rail
 *                  facet instead.
 *
 * Gender is a rail facet in both, so the rails differ by exactly one row.
 *
 * The card, the catalog and the engine are shared, so the comparison stays
 * about how the controls are reached.
 */
export type { PlpVariant };

export function PlpScreen({
  title,
  products,
  variant = "bottom-bar",
}: {
  title: string;
  products: Product[];
  variant?: PlpVariant;
}) {
  const pathname = usePathname();
  // Variant A reaches Category through the bottom-bar sheet, so the Filters
  // rail there must not list it; B has no bottom bar and keeps it in the rail.
  const categoryInSheet = variant === "bottom-bar";
  const railFacetIds = getRailFacetIds(variant);

  // The query string is the shareable record of state, but local state is the
  // source of truth — that keeps filtering instant instead of round-tripping
  // through the router on every tick.
  const [selections, setSelections] = useState<Selections>({});
  const [sort, setSort] = useState<SortId>("popularity");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  // Ids rather than the text alone, so discarding twice in a row replays the
  // animation instead of React seeing an identical element and leaving the
  // finished one on screen.
  const toastSeq = useRef(0);

  // Plain function, not a useCallback: the React Compiler handles memoization
  // here, and a manual one with `[]` deps trips its preservation check.
  const showToast = (text: string) => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, text });
  };

  // Read the URL on mount, and again whenever the back button moves us.
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setSelections(parseSelections(params));
      setSort(parseSort(params));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const commit = useCallback(
    (nextSelections: Selections, nextSort: SortId) => {
      setSelections(nextSelections);
      setSort(nextSort);
      setVisible(PAGE_SIZE);
      listRef.current?.scrollTo({ top: 0 });
      window.history.pushState(
        null,
        "",
        `${pathname}${buildQuery(nextSelections, nextSort)}`,
      );
    },
    [pathname],
  );

  const results = useMemo(
    () => sortProducts(applyFilters(products, selections), sort),
    [products, selections, sort],
  );

  // Cards are heavy, and there can be 1,070 of them. Render a page at a time
  // and extend as the list scrolls.
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
      setVisible((n) => Math.min(n + PAGE_SIZE, results.length));
    }
  };

  const categoryCount = selections.category?.length ?? 0;
  const sortActive = sort !== DEFAULT_SORT;
  // Counts exactly what the Filters screen owns in this variant. In A that
  // excludes category (the bottom bar reports it with its own badge) but
  // includes gender; in B it includes both, because that screen shows both.
  const filterCount = Object.entries(selections).reduce(
    (sum, [facetId, chosen]) => sum + (railFacetIds.has(facetId) ? chosen.length : 0),
    0,
  );

  return (
    <div className="flex h-full flex-col bg-page">
      <div className="shrink-0">
        <AppBar title={title} homeHref={variant === "top-chips" ? "/b" : "/"} />
        <GoldStrip />
        {variant === "top-chips" ? (
          <TopChipBar
            sortActive={sortActive}
            filterCount={filterCount}
            onSort={() => setOverlay("sort")}
            onFilters={() => setOverlay("filters")}
          />
        ) : (
          // In the bottom-bar variant this strip stays empty — reserved for
          // contextual chips, still to be defined.
          null
        )}
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="no-scrollbar flex min-h-0 flex-1 flex-col items-start gap-[12px] overflow-y-auto px-[16px] pt-[16px] pb-[16px]"
      >
        {results.length === 0 ? (
          <EmptyState onClear={() => commit({}, sort)} />
        ) : (
          results
            .slice(0, visible)
            .map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>

      {variant === "bottom-bar" && (
        <div className="shrink-0">
          <BottomActionBar
            categoryCount={categoryCount}
            sortActive={sortActive}
            filterCount={filterCount}
            onCategory={() => setOverlay("category")}
            onSort={() => setOverlay("sort")}
            onFilters={() => setOverlay("filters")}
          />
        </div>
      )}

      {overlay === "sort" && (
        <SortSheet
          value={sort}
          onChange={(next) => commit(selections, next)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "category" && categoryInSheet && (
        <CategorySheet
          products={products}
          selections={selections}
          onApply={(next) => commit(next, sort)}
          onDiscard={() => showToast(DISCARDED)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "filters" && (
        <FilterScreen
          products={products}
          selections={selections}
          variant={variant}
          onApply={(next) => commit(next, sort)}
          onDiscard={() => showToast(DISCARDED)}
          onClose={() => setOverlay(null)}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          text={toast.text}
          clearsBottomBar={variant === "bottom-bar"}
          // Guarded by id so a stale instance can't clear a toast that
          // replaced it.
          onDone={() => setToast((current) => (current?.id === toast.id ? null : current))}
        />
      )}
    </div>
  );
}

/** Not in the designs — filters can produce nothing, and a blank page reads as a bug. */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-[12px] px-[24px] text-center">
      <p className="text-[16px] font-bold text-black">No products match</p>
      <p className="text-[13px] text-muted">
        Try removing a filter or two to widen the results.
      </p>
      <button
        onClick={onClear}
        className="mt-[4px] flex h-[40px] cursor-pointer items-center rounded-[24px] bg-primary px-[24px] font-ui text-[14px] font-medium text-white"
      >
        Clear Filters
      </button>
    </div>
  );
}
