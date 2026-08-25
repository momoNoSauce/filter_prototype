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
import { BottomActionBar, PILL_GAP, PILL_H } from "./BottomActionBar";
import { TopChipBar } from "./TopChipBar";
import { ChipStrip, ContextChips } from "./ContextChips";
import { contextChips } from "@/lib/filters/contextChips";
import type { CountedOption } from "@/lib/filters/engine";
import { SortSheet } from "@/components/sheets/SortSheet";
import { PriceSheet } from "@/components/sheets/PriceSheet";
import { MicFab } from "@/components/ui/MicFab";
import { CART_BAR_H, CartBar } from "@/components/journey/StorefrontChrome";
import { useCart } from "@/components/cart/CartProvider";
import { useHideOnScroll } from "@/components/ui/useHideOnScroll";
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

/**
 * Clear Filters (2026-08-25). Two controls carry that label — the Filters
 * screen's footer and the zero-results state's recovery button — and they do
 * the same thing, so by the rule above they say the same thing, from one
 * constant.
 *
 * It is a **confirmation**, where `DISCARDED` is a warning: that one exists
 * because edits vanished unseen, this one because a buyer who has just cleared
 * wants telling that the full list is the *result* and not a reset. Same
 * component, opposite jobs, which is why the wording is flat rather than
 * apologetic.
 */
const CLEARED = "All filters cleared";

/**
 * How far down the listing the controls start hiding — the chip strip and, in A
 * and C, the floating pill. Measured against the scroller's own height rather
 * than a fixed pixel count, so it means the same thing on any frame. Above it
 * they stay up: a buyer who has barely started scrolling hasn't asked for the
 * room.
 *
 * **1.5 folds since 2026-08-21**, down a quarter from the two it launched at, on
 * the report that the pill "isn't disappearing" — it was, at 1,350px on a 675px
 * fold, which is further than anyone scrolls before deciding a thing is broken.
 * One constant covers every variant; the basket bar's own threshold is zero and
 * a quarter off zero is still zero.
 */
const FOLDS_BEFORE_HIDE = 1.5;

/**
 * The gap between the floating pill and the mic above it.
 *
 * Not chosen — **recovered**. The mic's measured resting place is 78px up and
 * the pill occupies 12–64, so the clearance the screengrab shows is 14. Writing
 * it down is what lets the mic follow the pill when the basket bar pushes it up,
 * instead of a fixed 78 that lands inside it.
 */
const MIC_GAP = 14;

/**
 * Material 3's **level 2** elevation, its own value for a top app bar with
 * content scrolled under it: a tight key shadow for the edge and a wider ambient
 * one for the lift. Two layers rather than one blurred grey, which is what makes
 * it read as a raised surface instead of a drawn line.
 *
 * It sits on the **slot**, not on `ChipStrip`: the slot's `overflow-hidden` —
 * there to clip the strip as it slides away — would crop a shadow cast by
 * anything inside it.
 */
const STRIP_ELEVATION =
  "shadow-[0_1px_2px_rgba(0,0,0,0.18),0_2px_6px_2px_rgba(0,0,0,0.10)]";

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
  productBasePath,
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
   * The card to render, and `ProductCard` is now the only one — the journey's
   * card became the app's on 2026-08-21 and the Figma-derived one is deleted.
   * The prop stays: it is how the journey carried its own card for a day without
   * a second copy of this screen, and the next screengrab that disagrees with
   * this one will want the same door. Duplicating 400 lines of filter state is
   * exactly the drift the variants are supposed to be free of.
   */
  card?: (props: { product: Product; sizes?: string[]; href?: string }) => ReactNode;
  /**
   * The route a card opens under — `""` for A, `"/b"`, `"/c"`, `"/d"`,
   * `"/userjourney"`. The card's
   * link is `{base}/product/{id}`, which every variant with a detail route
   * follows. **A string, not a builder**: these pages are Server Components and
   * this screen is a Client one, so a function prop cannot cross the boundary —
   * the build fails outright on it, which is how this was found.
   *
   * **`undefined` and `""` are different answers.** A's base path *is* the empty
   * string — its home is `/`, the same convention `HomeScreen`'s `basePath`
   * follows — so the test is `!== undefined`, not truthiness. Left undefined the
   * cards don't navigate at all, which is what every variant did before it had a
   * detail route.
   */
  productBasePath?: string;
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

  // Amazon's pattern: the strip gets out of the way once the buyer is well into
  // the listing, and comes straight back the moment they scroll up. `stripH` is
  // measured rather than declared, so the collapse can be animated — a height
  // transition needs a number at both ends, and `auto` isn't one. It stays
  // `null` until after mount, which is also what keeps the server's markup and
  // the first client render identical.
  const [stripH, setStripH] = useState<number | null>(null);

  // Same rule, two thresholds: the strip waits 1.5 folds, the basket bar goes
  // as soon as the buyer scrolls away from it. See `useHideOnScroll`.
  const { hidden: stripHidden, track: trackStrip } = useHideOnScroll({
    foldsBeforeHide: FOLDS_BEFORE_HIDE,
  });
  const { hidden: cartHidden, track: trackCart } = useHideOnScroll();

  // The basket is held above the routes, so a line added on a detail screen is
  // still here when the buyer comes back to the listing.
  const { line } = useCart();

  const listRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  /** Last scroll offset, to read direction off. */
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

  // Re-measured whenever the strip's contents change — the chips rewrite
  // themselves as a buyer drills in, and a vertical chip's label can run to two
  // lines. `chips.length` and the variant are the only things that change its
  // height.
  useEffect(() => {
    setStripH(stripRef.current?.offsetHeight ?? null);
  }, [chips.length, variant]);

  // Cards are heavy, and there can be 1,070 of them. Render a page at a time
  // and extend as the list scrolls.
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
      setVisible((n) => Math.min(n + PAGE_SIZE, results.length));
    }

    trackStrip(el);
    trackCart(el);
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

  // No shadow with nothing to cast it: the slot collapses to 0 when the strip
  // hides, and in A it is empty whenever there are no contextual chips. Written
  // against `chips.length` rather than the measured height so the server and the
  // first client render agree.
  const stripElevated = !stripHidden && (variant === "top-chips" || chips.length > 0);

  // Where the floating pill sits: 12px above the basket bar when there is one,
  // above the frame's edge otherwise.
  const pillBottom = (line && !cartHidden ? CART_BAR_H : 0) + PILL_GAP;

  return (
    // `relative` so the sheets and the Filters screen cover this frame rather
    // than the page. It outlived the Price dropdown it was added for, which
    // measured its offsets against this box.
    <div className="relative flex h-full flex-col bg-page">
      {/* `relative z-20` so the strip's elevation lands **on** the listing. The
          scroller is a later sibling, so without this the cards paint over the
          shadow and it is invisible — which is how it was first shipped and
          spotted. Below the mic (`z-30`) and the sheets (`z-40`/`z-50`). */}
      <div className="relative z-20 shrink-0">
        <AppBar
          title={title}
          // `??` would be wrong: C and D pass an explicit `null` to mean "no
          // home button", and nullish-coalescing would swallow it back into
          // the default and put them one tap from another variant's home.
          homeHref={homeHref === undefined ? (variant === "top-chips" ? "/b" : "/") : homeHref}
          {...appBar}
        />
        {/*
          The strip hides on the way down and returns on the way up — Amazon's
          behaviour, asked for on 2026-08-21.

          Two things move together: the slot's height collapses so the listing
          takes the room, and the strip inside slides up so it reads as leaving
          rather than being squashed. The height is the measured `stripH`, since
          a transition needs a number at both ends; before it is measured the
          slot has no height style at all and the strip sits where it always did.

          **This is a departure for B and D**, where the strip is the only route
          to Sort and Filters — `TopChipBar` says so, and said it should never
          leave the screen. Amazon hides the same controls behind the same
          gesture, and scrolling up is how you get them back: one flick, against
          a fold and a half of scrolling to lose them.
        */}
        <div
          className={`overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none ${
            stripElevated ? STRIP_ELEVATION : ""
          }`}
          style={stripH !== null ? { height: stripHidden ? 0 : stripH } : undefined}
        >
          <div
            ref={stripRef}
            className={`transition-transform duration-200 ease-out motion-reduce:transition-none ${
              stripHidden ? "-translate-y-full" : "translate-y-0"
            }`}
          >
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
        </div>
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
          <EmptyState
            onClear={() => {
              commit({}, sort);
              showToast(CLEARED);
            }}
          />
        ) : (
          results
            .slice(0, visible)
            .map((product) => (
              <Card
                key={product.id}
                product={product}
                sizes={selections[SIZE_FACET_ID]}
                href={
                  productBasePath === undefined
                    ? undefined
                    : `${productBasePath}/product/${product.id}`
                }
              />
            ))
        )}

        {/* The pill floats over the listing, so the last card needs room to
            clear it — otherwise the foot of the list sits permanently under a
            control. A and C only; the chip variants have nothing down there. */}
        {variant === "bottom-bar" && results.length > 0 && (
          <div
            aria-hidden
            style={{ height: PILL_H + PILL_GAP * 2 }}
            className="w-full shrink-0"
          />
        )}
      </div>

      {variant === "bottom-bar" && (
        // **Floating, not in flow** (Figma `697:2658`, 2026-08-21): the pill
        // hovers over the listing rather than taking a band off it, which is
        // what stops it fighting the basket bar for the bottom edge. It rides
        // 12px above whatever is down there — the bar when the basket has a
        // line, the frame's edge otherwise — and the offset transitions, so it
        // travels with the bar as that slides away instead of jumping.
        //
        // **It hides with the chip strip**, on request (2026-08-21) — same flag,
        // not a second one: the strip's rule is the one the ask named ("like the
        // bar at the top"), and two controls answering one gesture at one moment
        // reads as the screen getting out of the way, where two thresholds would
        // read as a stutter. So it waits 1.5 folds, and comes back on the first
        // upward flick.
        <div
          style={{
            bottom: pillBottom,
            // Down and clear of the frame, by exactly its own height plus
            // whatever it was sitting above — `.device-screen` clips the rest.
            transform: `translateX(-50%) translateY(${
              stripHidden ? pillBottom + PILL_H : 0
            }px)`,
          }}
          className="absolute left-1/2 z-30 transition-[bottom,transform] duration-200 ease-out motion-reduce:transition-none"
        >
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

      {/*
        The basket bar, once there is a basket. It is **the same bar the detail
        screen shows**, reading the same line, which is the point: add from a
        product and the total follows you back to the listing.

        It slides out on the way down and returns on the way up, like the strip
        above — `translate-y-full` rather than a height collapse, because it sits
        at the foot of the frame with nothing below it to take the room, so there
        is no reflow to animate.
      */}
      {line && (
        // The slot **collapses as the bar slides**, exactly as the chip strip's
        // does. Translating alone left the 64px of layout behind it: the listing
        // stayed short and `bg-page` showed through where the bar had been, which
        // reads as a grey band clipping the last card rather than as a bar
        // leaving. Height and transform together, so the list takes the room
        // back.
        <div
          className="shrink-0 overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none"
          style={{ height: cartHidden ? 0 : CART_BAR_H }}
        >
          <div
            className={`transition-transform duration-200 ease-out motion-reduce:transition-none ${
              cartHidden ? "translate-y-full" : "translate-y-0"
            }`}
          >
            <CartBar total={line.total} count={1} />
          </div>
        </div>
      )}

      {/* Anchored to the frame rather than the list, so it stays put as the
          listing scrolls under it — which is what the screengrabs show, and the
          reason it can't live inside the scroller.

          **It sits above the pill, not at a fixed 78.** The measured 78 *is*
          `PILL_GAP + PILL_H + MIC_GAP`, which nobody noticed while the pill had
          one resting place; once it rides the basket bar the two occupy the
          same band and overlap by 7px. Reading the pill's own offset keeps 78
          wherever it was 78 and moves the mic only when the pill moves. The
          chip variants have no pill, so they keep the measured value. */}
      <MicFab
        bottom={variant === "bottom-bar" ? pillBottom + PILL_H + MIC_GAP : undefined}
      />

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
          onCleared={() => showToast(CLEARED)}
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
