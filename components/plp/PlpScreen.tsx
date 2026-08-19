"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  dropOrphanedAttributes,
  getRailFacetIds,
  type PlpVariant,
  type VerticalMode,
} from "@/lib/filters/facets";
import { buildQuery, parseSelections, parseSort } from "@/lib/filters/urlState";
import { AppBar } from "./AppBar";
import { GoldStrip } from "./GoldStrip";
import { SIZE_FACET_ID } from "@/lib/filters/activeVariant";
import { ProductCard } from "./ProductCard";
import { BottomActionBar } from "./BottomActionBar";
import { TopChipBar } from "./TopChipBar";
import { ChipStrip, ContextChips, PriceMenu } from "./ContextChips";
import { contextChips } from "@/lib/filters/contextChips";
import type { CountedOption } from "@/lib/filters/engine";
import { SortSheet } from "@/components/sheets/SortSheet";
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

/** Kept in step with `PriceMenu`'s own width, so the clamp can't be wrong. */
const MENU_WIDTH = 180;

type Overlay = "sort" | "filters" | null;

/**
 * Two interaction models over the same screen, so they can be compared:
 *
 * - `bottom-bar` — Sort and Filters pinned to the bottom (Figma 638:2836).
 * - `top-chips`  — the same two as chips under the GOLD strip (Figma
 *                  644:4011), and no bottom bar.
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
  verticalBasePath,
  homeHref,
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
   * Where a vertical chip leads, minus the vertical: `/c/seller/grasim`, to
   * which the category id is appended. Supplied by C and D's seller page,
   * where a vertical is browsed into rather than ticked; absent in A and B,
   * where the chip toggles a filter instead.
   *
   * A prefix rather than a function, because these screens are rendered from
   * Server Components and a function can't cross that boundary.
   */
  verticalBasePath?: string;
  /**
   * `null` on C and D: they have no home of their own, and any href would
   * land the session in a different variant. See `AppBar`.
   */
  homeHref?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // The query string is the shareable record of state, but local state is the
  // source of truth — that keeps filtering instant instead of round-tripping
  // through the router on every tick.
  const [selections, setSelections] = useState<Selections>({});
  const [sort, setSort] = useState<SortId>("popularity");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [priceMenu, setPriceMenu] = useState<{
    options: CountedOption[];
    left: number;
    top: number;
  } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
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
      // Neither C nor D has a Category control at either level — one browses
      // into a vertical, the other is one — so `?category=` in a hand-edited
      // URL would filter with nothing to show or undo it. On the vertical page
      // `?gender=` goes too, for the same reason its row does.
      if (verticalMode.kind !== "filter") params.delete("category");
      if (verticalMode.kind === "locked") params.delete("gender");
      setSelections(parseSelections(params, verticalMode));
      setSort(parseSort(params));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [verticalMode]);

  const commit = useCallback(
    (raw: Selections, nextSort: SortId) => {
      // A chip tap can leave a single vertical, which takes the attribute rows
      // off the rail with it — their selections must not outlive their
      // controls. See `dropOrphanedAttributes`.
      const nextSelections = dropOrphanedAttributes(raw, verticalMode);
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
    [pathname, verticalMode],
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

  const toggleChip = (facetId: string, optionId: string) => {
    // In C and D a vertical chip is a way *into* the vertical, not a filter to
    // tick — tapping it leaves this page for that vertical's own.
    if (facetId === "category" && verticalBasePath) {
      router.push(`${verticalBasePath}/${optionId}`);
      return;
    }
    commit(toggleSelection(selections, facetId, optionId), sort);
  };

  /**
   * The Price menu is anchored under its chip but rendered at the root, since
   * the chip strip scrolls under `overflow-x-auto` and would clip it. Measured
   * against the root on open, and clamped so a chip scrolled to the right edge
   * can't push the menu off the frame.
   */
  const openPriceMenu = (anchor: HTMLElement, options: CountedOption[]) => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return;
    const chip = anchor.getBoundingClientRect();
    setPriceMenu({
      options,
      left: Math.max(8, Math.min(chip.left - root.left, root.width - MENU_WIDTH - 8)),
      top: chip.bottom - root.top + 4,
    });
  };

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
  // once a single vertical is settled.
  const railFacetIds = getRailFacetIds(selections.category, verticalMode);

  const sortActive = sort !== DEFAULT_SORT;
  // Counts exactly what the Filters screen owns — which, since Category
  // rejoined the rail, is every facet in both variants. Nothing is reported
  // twice, because nothing else carries a badge any more.
  const filterCount = Object.entries(selections).reduce(
    (sum, [facetId, chosen]) => sum + (railFacetIds.has(facetId) ? chosen.length : 0),
    0,
  );

  return (
    // `relative` so the Price menu can be positioned against this frame rather
    // than the page, which is what makes the measured offsets meaningful.
    <div ref={rootRef} className="relative flex h-full flex-col bg-page">
      <div className="shrink-0">
        <AppBar
          title={title}
          // `??` would be wrong: C and D pass an explicit `null` to mean "no
          // home button", and nullish-coalescing would swallow it back into
          // the default and put them one tap from another variant's home.
          homeHref={homeHref === undefined ? (variant === "top-chips" ? "/b" : "/") : homeHref}
        />
        <GoldStrip />
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
              onOpenPrice={openPriceMenu}
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
              onOpenPrice={openPriceMenu}
            />
            </ChipStrip>
          )
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
            .map((product) => (
              <ProductCard
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

      {priceMenu && (
        <PriceMenu
          options={priceMenu.options}
          chosen={selections.price ?? []}
          left={priceMenu.left}
          top={priceMenu.top}
          // Applies live, like the chips beside it. The menu stays open so
          // several bands can be ticked without reopening it.
          onToggle={(optionId) => toggleChip("price", optionId)}
          onClose={() => setPriceMenu(null)}
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
