"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import {
  applyFilters,
  countSelections,
  sortProducts,
  type Selections,
  type SortId,
} from "@/lib/filters/engine";
import { buildQuery, parseSelections, parseSort } from "@/lib/filters/urlState";
import { AppBar } from "./AppBar";
import { GoldStrip } from "./GoldStrip";
import { ProductCard } from "./ProductCard";
import { BottomActionBar } from "./BottomActionBar";
import { SortSheet } from "@/components/sheets/SortSheet";
import { GenderSheet } from "@/components/sheets/GenderSheet";
import { FilterScreen } from "@/components/filters/FilterScreen";

const PAGE_SIZE = 8;

type Overlay = "sort" | "gender" | "filters" | null;

export function PlpScreen({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const pathname = usePathname();

  // The query string is the shareable record of state, but local state is the
  // source of truth — that keeps filtering instant instead of round-tripping
  // through the router on every tick.
  const [selections, setSelections] = useState<Selections>({});
  const [sort, setSort] = useState<SortId>("popularity");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const listRef = useRef<HTMLDivElement>(null);

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

  const filterCount = countSelections(selections);
  const genderCount = selections.gender?.length ?? 0;

  return (
    <div className="flex h-full flex-col bg-page">
      <div className="shrink-0">
        <AppBar title={title} />
        <GoldStrip />
        {/* The strip below the GOLD bar is reserved for contextual chips.
            Applied-filter chips used to live here and were removed; the
            bottom-bar count badges carry applied state for now. */}
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

      <div className="shrink-0">
        <BottomActionBar
          genderCount={genderCount}
          filterCount={filterCount}
          onGender={() => setOverlay("gender")}
          onSort={() => setOverlay("sort")}
          onFilters={() => setOverlay("filters")}
        />
      </div>

      {overlay === "sort" && (
        <SortSheet
          value={sort}
          onChange={(next) => commit(selections, next)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "gender" && (
        <GenderSheet
          value={selections.gender ?? []}
          onApply={(next) => {
            const updated = { ...selections };
            if (next.length) updated.gender = next;
            else delete updated.gender;
            commit(updated, sort);
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "filters" && (
        <FilterScreen
          products={products}
          selections={selections}
          onApply={(next) => commit(next, sort)}
          onClose={() => setOverlay(null)}
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
