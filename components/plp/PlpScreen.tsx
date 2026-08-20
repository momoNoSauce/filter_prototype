"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog/types";
import {
  applyFilters,
  sortProducts,
  toggleSelection,
  DEFAULT_SORT,
  type Selections,
  type SortId,
} from "@/lib/filters/engine";
import {
  FILTER_VERTICALS,
  dropOrphanedSelections,
  getRailFacetIds,
  settledVertical,
  type PlpVariant,
  type VerticalMode,
} from "@/lib/filters/facets";
import { buildQuery, parseSelections, parseSort } from "@/lib/filters/urlState";
import { AppBar } from "./AppBar";
import { SIZE_FACET_ID } from "@/lib/filters/activeVariant";
import { ProductCard } from "./ProductCard";
import { BottomActionBar } from "./BottomActionBar";
import { TopChipBar } from "./TopChipBar";
import { ChipStrip, ContextChips } from "./ContextChips";
import { contextChips } from "@/lib/filters/contextChips";
import type { CountedOption } from "@/lib/filters/engine";
import { SortSheet } from "@/components/sheets/SortSheet";
import { PriceSheet } from "@/components/sheets/PriceSheet";
import { MicFab } from "@/components/ui/MicFab";
import { FilterScreen } from "@/components/filters/FilterScreen";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 8;

/**
 * The Filters screen is now the only draft surface — the Category sheet went
 * with the bottom-bar slot that opened it (2026-08-19). Kept as a named
 * constant rather than inlined, because the moment a second draft surface
 * appears it must say the same thing: one event, one wording.
 */
const DISCARDED = "Selection discarded";

type Overlay = "sort" | "filters" | null;

/**
 * Two interaction models over the same screen, so they can be compared:
 *
 * - `bottom-bar` — Sort and Filters pinned to the bottom (Figma 638:2836).
 * - `top-chips`  — the same two as chips under the app bar (Figma 644:4011),
 *                  and no bottom bar.
 *
 * Since Category left the bar on 2026-08-19 the two are **identical in every
 * other respect** — same rail, same facets, same card, same catalog, same
 * engine. Where those two controls sit is now the entire variable, which is
 * the cleanest the A/B has been.
 */
export type { PlpVariant };

export function PlpScreen({
  title,
  products,
  variant = "bottom-bar",
  verticalMode = FILTER_VERTICALS,
  homeHref,
  card: Card = ProductCard,
  appBar,
  aboveList,
  belowList,
  listClassName = "gap-[12px] px-[16px] pt-[16px] pb-[16px]",
}: {
  title: string;
  products: Product[];
  variant?: PlpVariant;
  /**
   * How this screen treats verticals — see `VerticalMode`. Under `locked`,
   * `products` arrives already scoped and the vertical is **not** a selection:
   * it is page scope, the way the seller already is.
   */
  verticalMode?: VerticalMode;
  /**
   * `null` on C and D: they have no home of their own, and any href would
   * land the session in a different variant. See `AppBar`.
   */
  homeHref?: string | null;
  /**
   * The card to render. Defaults to the shared `ProductCard`, which A, B, C and
   * D all use; the user journey passes its own, rebuilt 1:1 from a newer
   * screengrab. A prop rather than a second copy of this screen — `PlpScreen` is
   * the only PLP, and duplicating 400 lines of filter state is exactly the drift
   * the variants are supposed to be free of.
   */
  card?: (props: { product: Product; sizes?: string[] }) => ReactNode;
  /** Extra app-bar props, for the journey's no-Share / cart-badge bar. */
  appBar?: { showShare?: boolean; cartBadge?: number };
  /** Storefront chrome above the list — the journey's seller header block. */
  aboveList?: ReactNode;
  /** Chrome below the list, above any bottom bar — the journey's cart bar. */
  belowList?: ReactNode;
  /**
   * The list container's spacing and surface. Defaults to the shared 16px
   * inset; the journey measured 9px against its screengrab, on `#f7f7f7`.
   */
  listClassName?: string;
}) {
  const pathname = usePathname();
  // The query string is the shareable record of state, but local state is the
  // source of truth — that keeps filtering instant instead of round-tripping
  // through the router on every tick.
  const [selections, setSelections] = useState<Selections>({});
  const [sort, setSort] = useState<SortId>("popularity");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  // The Price bands, or null when the sheet is closed. The options are carried
  // rather than recomputed, so the sheet shows the counts the chip was tapped
  // with.
  const [priceSheet, setPriceSheet] = useState<CountedOption[] | null>(null);

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
      // C and D have no Category control, so one in a hand-edited URL would
      // filter with nothing to show or undo it, and could empty the page
      // outright by naming a different vertical. `?gender=` is stripped too,
      // but by `dropOrphanedSelections` inside `parseSelections` — it is
      // orphaned wherever the block shows, not just here.
      if (verticalMode.kind === "locked") params.delete("category");
      // `products` is passed so a link whose Gender cut settles a vertical keeps
      // its Size and attributes on load — the rail shows those rows on such a
      // page, so stripping them would be the bug.
      setSelections(parseSelections(params, verticalMode, products));
      setSort(parseSort(params));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [verticalMode, products]);

  const commit = useCallback(
    (raw: Selections, nextSort: SortId) => {
      // A chip tap can leave a single vertical, which takes the attribute rows
      // off the rail with it — their selections must not outlive their
      // controls. See `dropOrphanedSelections`. The settled vertical is read
      // from `raw`, not from the applied state: this call decides what the next
      // state is allowed to contain.
      const nextSelections = dropOrphanedSelections(
        raw,
        verticalMode,
        settledVertical(products, raw, verticalMode),
      );
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
    [pathname, verticalMode, products],
  );

  const results = useMemo(
    () => sortProducts(applyFilters(products, selections), sort, selections[SIZE_FACET_ID]),
    [products, selections, sort],
  );

  // Product-vertical chips until a single vertical is settled, then price and
  // offer chips. Same strip and same rule in both variants.
  const chips = useMemo(
    () => contextChips(products, selections, verticalMode),
    [products, selections, verticalMode],
  );

  const toggleChip = (facetId: string, optionId: string) =>
    commit(toggleSelection(selections, facetId, optionId), sort);

  // Cards are heavy, and there can be 1,070 of them. Render a page at a time
  // and extend as the list scrolls.
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
      setVisible((n) => Math.min(n + PAGE_SIZE, results.length));
    }
  };

  // Follows the applied selections, so the badge counts exactly the rows the
  // Filters screen would show if opened right now — attribute rows included
  // once a single vertical is settled, whether a Category tick or a Gender cut
  // settled it.
  const settled = settledVertical(products, selections, verticalMode);
  const railFacetIds = getRailFacetIds(selections.category, verticalMode, settled);

  const sortActive = sort !== DEFAULT_SORT;
  // Counts exactly what the Filters screen owns — which, since Category
  // rejoined the rail, is every facet in both variants. Nothing is reported
  // twice, because nothing else carries a badge any more.
  const filterCount = Object.entries(selections).reduce(
    (sum, [facetId, chosen]) => sum + (railFacetIds.has(facetId) ? chosen.length : 0),
    0,
  );

  return (
    // `relative` so the sheets and the Filters screen cover this frame rather
    // than the page. It outlived the Price dropdown it was added for, which
    // measured its offsets against this box.
    <div className="relative flex h-full flex-col bg-page">
      <div className="shrink-0">
        <AppBar
          title={title}
          // `??` would be wrong: C and D pass an explicit `null` to mean "no
          // home button", and nullish-coalescing would swallow it back into
          // the default and put them one tap from another variant's home.
          homeHref={homeHref === undefined ? (variant === "top-chips" ? "/b" : "/") : homeHref}
          {...appBar}
        />
        {variant === "top-chips" ? (
          <TopChipBar
            sortActive={sortActive}
            filterCount={filterCount}
            onSort={() => setOverlay("sort")}
            onFilters={() => setOverlay("filters")}
          >
            <ContextChips
              chips={chips}
              selections={selections}
              onToggle={toggleChip}
              onOpenPrice={setPriceSheet}
            />
          </TopChipBar>
        ) : (
          // Variant A has no Sort or Filter chip, so the strip is the
          // contextual chips alone — and collapses entirely when there are
          // none, rather than leaving an empty white band.
          chips.length > 0 && (
            <ChipStrip>
              <ContextChips
              chips={chips}
              selections={selections}
              onToggle={toggleChip}
              onOpenPrice={setPriceSheet}
            />
            </ChipStrip>
          )
        )}
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className={`no-scrollbar flex min-h-0 flex-1 flex-col items-start overflow-y-auto ${listClassName}`}
      >
        {/* Inside the scroller, not above it, so storefront chrome scrolls away
            with the listing rather than staying pinned — the seller block is
            context you read once, and 66px of it is worth more as results. The
            app bar and the chip strip stay fixed; only this scrolls. */}
        {aboveList}

        {results.length === 0 ? (
          <EmptyState onClear={() => commit({}, sort)} />
        ) : (
          results
            .slice(0, visible)
            .map((product) => (
              <Card
                key={product.id}
                product={product}
                sizes={selections[SIZE_FACET_ID]}
              />
            ))
        )}
      </div>

      {variant === "bottom-bar" && (
        <div className="shrink-0">
          <BottomActionBar
            sortActive={sortActive}
            filterCount={filterCount}
            onSort={() => setOverlay("sort")}
            onFilters={() => setOverlay("filters")}
          />
        </div>
      )}

      {/* Below the Sort/Filters bar, not above it: the basket is the last thing
          on the screen and the filter controls stay put as the listing changes
          under them. */}
      {belowList}

      {/* Anchored to the frame rather than the list, so it stays put as the
          listing scrolls under it — which is what the screengrabs show, and the
          reason it can't live inside the scroller. */}
      <MicFab />

      {overlay === "sort" && (
        <SortSheet
          value={sort}
          onChange={(next) => commit(selections, next)}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === "filters" && (
        <FilterScreen
          products={products}
          selections={selections}
          verticalMode={verticalMode}
          onApply={(next) => commit(next, sort)}
          onDiscard={() => showToast(DISCARDED)}
          onClose={() => setOverlay(null)}
        />
      )}

      {priceSheet && (
        <PriceSheet
          options={priceSheet}
          chosen={selections.price ?? []}
          // Applies live, like the chips beside it. The sheet stays open so
          // several bands can be ticked without reopening it.
          onToggle={(optionId) => toggleChip("price", optionId)}
          onClose={() => setPriceSheet(null)}
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
      <p className="text-[14px] text-muted">
        Try removing a filter or two to widen the results.
      </p>
      <button
        onClick={onClear}
        className="mt-[4px] flex h-[40px] cursor-pointer items-center rounded-[24px] bg-primary px-[24px] font-ui text-[15px] font-medium text-white"
      >
        Clear Filters
      </button>
    </div>
  );
}
