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
  singleValuedFacets,
  settledVertical,
  type PlpVariant,
  type RailPreset,
  type VerticalMode,
} from "@/lib/filters/facets";
import { buildQuery, parseSelections, parseSort } from "@/lib/filters/urlState";
import { AppBar } from "./AppBar";
import { SIZE_FACET_ID } from "@/lib/filters/activeVariant";
import { ProductCard } from "./ProductCard";
import { BottomActionBar, PILL_GAP, PILL_H } from "./BottomActionBar";
import { TopChipBar } from "./TopChipBar";
import { GetItRight } from "./GetItRight";
import { CHIP_H_SHORT, CHIP_H_TALL, ChipStrip, ContextChips } from "./ContextChips";
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
 * A price range typed with its ends the wrong way round (2026-08-28).
 *
 * A *warning*, like `DISCARDED` and unlike `CLEARED`: something the buyer
 * asked for was refused, and the listing behind gives no sign of it — the
 * draft never took the value, so nothing moved. Before this, an inverted range
 * filtered honestly and returned `Show 0 results`, which is accurate and says
 * nothing about why.
 *
 * Names the rule rather than the field, because the app can't know which of
 * the two boxes the buyer meant to change: both carry the invalid border, and
 * either one fixes it.
 *
 * **It names the facet too, since 2026-09-03**: three panels carry these boxes
 * now, and a Margin panel saying `Min price...` is a message about a control
 * that isn't on screen. `FilterScreen` passes the noun — the same map that
 * decides the box's unit owns it, so a fourth range facet brings its own word.
 */
const invalidRange = (noun: string) => `Min ${noun} can't be higher than max`;

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
 * The toast's clearance over whatever sits at the foot, and its inset from the
 * frame when nothing does.
 *
 * 8px is the gap the pill and the toast already stood at once A's full-width
 * bar became a 52px pill — measured, not overlapping, but tight, and it earns
 * more scrutiny since 2026-08-25 made a toast something a buyer sees on every
 * clear rather than only on a discard. Two dark pills 8px apart; open it up if
 * it reads as one stack. 24 is the frame inset the chip variants already used
 * with nothing below them.
 */
const TOAST_GAP = 8;
const TOAST_INSET = 24;

/** `ActionFooter` — `h-[60px]` plus its 1px top border. Also in `panelFit`. */
const ACTION_FOOTER_H = 61;

/**
 * Material 3's **level 2** elevation, its own value for a top app bar with
 * content scrolled under it: a tight key shadow for the edge and a wider ambient
 * one for the lift. Two layers rather than one blurred grey, which is what makes
 * it read as a raised surface instead of a drawn line.
 *
 * **Taken down a second time on 2026-08-28**, on the report that it read as too
 * much. The alphas have now been halved twice from the spec — M3's 0.30/0.15
 * went to 0.18/0.10 on 08-21 and to **0.09/0.05** here — and the ambient
 * layer's 2px spread is gone, which is what was casting the visible grey band
 * under the strip rather than a lift.
 *
 * It can go this light because **it is not the only thing marking the edge**:
 * `ChipStrip` carries a 1px `hairline` border along its foot, added the same
 * day as the elevation. M3 would use one or the other; this app was asked for
 * both, and with the rule doing the work of saying *where the band stops*, the
 * shadow only has to say *that it is above the listing*.
 *
 * It sits on the **slot**, not on `ChipStrip`: the slot's `overflow-hidden` —
 * there to clip the strip as it slides away — would crop a shadow cast by
 * anything inside it.
 */
const STRIP_ELEVATION =
  "shadow-[0_1px_2px_rgba(0,0,0,0.09),0_2px_5px_rgba(0,0,0,0.05)]";

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

/**
 * Per-route departures from the documented control layout — see `controls` on
 * `PlpScreen`. Every field is optional and every default is the documented
 * behaviour, so a route opts out and never in.
 */
export type PlpControls = {
  /**
   * Whether the strip may carry product-vertical chips at all. `false` on
   * `/userjourney`: a buyer already inside a storefront hasn't come to choose a
   * garment type, so the strip leads with the chips that would otherwise wait
   * behind a vertical being settled. The *picked* chip goes with the offered
   * ones, so the strip carries none in any state — the cost being that nothing
   * on the listing then names the cut.
   */
  verticalChips?: boolean;
  /**
   * Whether the strip carries the Price chip and its sheet. `false` on
   * `/userjourney`; Price Range is a rail facet either way, so the filter stays
   * reachable and nothing is orphaned by turning the chip off.
   */
  priceChip?: boolean;
  /**
   * Whether Sort lives inside the Filters screen instead of beside it: the Sort
   * chip leaves the strip and *Sort By* becomes the first row of the Filters
   * rail, joining the draft — so a sort applies on `Show N results`, the ✕
   * discards it, and Clear Filters returns it to Popularity.
   *
   * **Nothing passes it today.** `/userjourney` did between 2026-08-28 and
   * 2026-09-03, when Sort was asked back onto the chip strip beside Filter,
   * where the live app's own bar has it. Kept rather than deleted because this
   * route has now moved Sort three times and the draft behaviour above is the
   * only version of it that can be discarded — see the page's own comment.
   *
   * **Honoured on `top-chips` only.** In `bottom-bar` the pill is a designed
   * 240px surface with two halves either side of a 32px rule (Figma
   * `697:2658`), and a one-control pill is a shape no frame draws. A and C are
   * unaffected because neither passes this; a route that wants both wants a
   * pill design first.
   */
  sortInFilters?: boolean;
  /**
   * Which Filters rail this listing shows. `"journey"` is the 2026-09-07 order
   * — Price · Margin · MOQ · Category · Brands · Seller · Seller City · Size ·
   * Colour · Offers, then Fabric and the garment attributes — where the three
   * offer magnitudes are one *Offers* panel, Size is global rather than
   * vertical-only, and Brands, Seller and Seller City hide themselves on a
   * storefront that carries one of each. Gender, Delivery Time and More Filters
   * stay dropped. A–D say nothing and keep `"default"`, which follows the
   * reference apparel PLP. See `RailPreset`.
   */
  rail?: RailPreset;
  /**
   * Render the Filters screen as a **bottom sheet over the listing** rather
   * than a full-bleed panel. `true` on `/userjourney` (2026-08-28): a
   * full-bleed panel takes the buyer off the page they were filtering, so what
   * changed is reported only by a count in the footer. At 80% of the frame the
   * app bar, the chip strip and the top of the first card stay visible.
   */
  filterSheet?: boolean;
  /**
   * Add a typed **min and max** above the bands of all three range facets —
   * Price Range, Margin on MRP and MOQ. `true` on `/userjourney`: Price from
   * 2026-08-28, Margin and MOQ from 2026-09-03 on the same argument — the bands
   * are the fast path and carry the counts, and the boxes cover a range nobody
   * predicted. Per facet the two are exclusive; see `FilterScreen`. A–D show
   * the bands alone.
   */
  rangeInputs?: boolean;
  /**
   * The guided *Get It Right* block at the head of the listing — choose a
   * gender, then choose a size. `true` on `/pvfilters` (2026-09-09), built from
   * two screengrabs of a competitor's search results. See `GetItRight`.
   *
   * **The one field here that is opt-*in***, where the rest are opt-outs. The
   * others switch off a behaviour every route documents; this adds a surface no
   * other route has, so the documented default is `false` and the route that
   * wants it says so. Turning it on where the vertical block is switched off
   * would draw a size step nothing can unfold — `/userjourney` is exactly that
   * route since this morning, which is why it does not pass this.
   */
  guidedPv?: boolean;
};

export function PlpScreen({
  title,
  products,
  variant = "bottom-bar",
  verticalMode = FILTER_VERTICALS,
  controls,
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
   * Where this screen's controls live, for routes that depart from the
   * documented layout. **`/userjourney` only** so far, from the 2026-08-28
   * stakeholder review; A–D pass nothing and get every default.
   *
   * One object rather than a boolean per note, because these are one idea —
   * which controls this listing surfaces and where — and a prop per stakeholder
   * remark is how a shared screen grows a dozen of them. Every field defaults
   * to the documented behaviour, so a new route opts *out*, never in.
   *
   * None of these is `VerticalMode.locked`, which answers a different question:
   * it makes the vertical page scope and takes Category and Gender off the
   * rail with it. The journey needs both — *Gender → Women* is its central cut
   * and what settles the vertical that puts Size on the rail.
   */
  controls?: PlpControls;
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

  const railPreset = controls?.rail ?? "default";
  /*
   * Facets the page's scope has at most one value of, so the badge counts
   * exactly the rows the Filters screen shows — a one-brand storefront hides
   * Brands (2026-09-07). Declared up here because the URL effect below reads
   * the preset, and both are pure functions of props.
   */
  const scopeSingles = useMemo(() => singleValuedFacets(products), [products]);

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
      // The preset goes too: Size is global on the journey's rail, so a shared
      // `?size=s,m` must survive a load with no category beside it.
      setSelections(parseSelections(params, verticalMode, products, railPreset));
      setSort(parseSort(params));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [verticalMode, products, railPreset]);

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
        railPreset,
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
    [pathname, verticalMode, products, railPreset],
  );

  const results = useMemo(
    () => sortProducts(applyFilters(products, selections), sort, selections[SIZE_FACET_ID]),
    [products, selections, sort],
  );

  // Product-vertical chips until a single vertical is settled, then price and
  // offer chips — less whatever this route has opted out of. On
  // `/userjourney` that is both verticals and price, leaving the strip to the
  // three offer chips.
  const chips = useMemo(
    () =>
      contextChips(products, selections, verticalMode, {
        verticals: controls?.verticalChips ?? true,
        price: controls?.priceChip ?? true,
      }),
    [products, selections, verticalMode, controls?.verticalChips, controls?.priceChip],
  );

  const toggleChip = (facetId: string, optionId: string) =>
    commit(toggleSelection(selections, facetId, optionId), sort);

  const guidedPv = controls?.guidedPv ?? false;

  /**
   * A gender tile in the guided block — **replaces** the category cut rather
   * than adding to it, and clears it when the tile already stood alone.
   *
   * Not `toggleSelection`, which is a multi-select union and is right for every
   * other control including the Filters panel's own Category rows. The block is
   * a guided single choice: its second step exists only while exactly one
   * vertical is settled, so a tap that could leave two ticked would let the
   * buyer close the step they are standing in. Picking a second gender in the
   * block means *that one instead*.
   *
   * **The Size cut goes with the vertical, both ways.** Tapping the tile *off*
   * is handled by `dropOrphanedSelections` inside `commit` — Size is in this
   * rail's vertical-only set for exactly that tap. Switching to a *different*
   * vertical has to be said here, because the vertical never un-settles and the
   * guard sees nothing to drop: M in menswear is not M in womenswear, which is
   * the whole reason Size is vertical-only, and Kartik's kids' tees don't carry
   * letters at all — so keeping `size=m` across a switch to Boys hands back an
   * empty listing whose cause is invisible.
   */
  const pickVertical = (categoryId: string) => {
    const current = selections.category ?? [];
    const alone = current.length === 1 && current[0] === categoryId;
    const rest = { ...selections };
    delete rest.category;
    delete rest[SIZE_FACET_ID];
    commit(alone ? rest : { ...rest, category: [categoryId] }, sort);
  };

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

  /*
   * One chip height for the whole strip (2026-08-28). 44 exists because the
   * vertical chip's thumbnail *is* its height; a strip that can't carry one
   * has no image to size around, so it takes 40.
   *
   * **40, not the frame's 32.** The thumbnail was only half the argument for
   * 44 — the other half is a kirana retailer tapping a chip on a mid-range
   * Android, and that survives the picture going. 32 would put every chip in
   * the row under the touch floor to save 8px once.
   *
   * Read off `verticalChips` rather than off the current chips, so the row
   * can't change height as the buyer filters. C and D carry no verticals
   * either, the vertical being page scope there; they keep 44 until someone
   * sets the same flag, which is a one-word change.
   */
  const chipH = (controls?.verticalChips ?? true) ? CHIP_H_TALL : CHIP_H_SHORT;
  const railFacetIds = getRailFacetIds(
    selections.category,
    verticalMode,
    settled,
    railPreset,
    scopeSingles,
  );

  const sortActive = sort !== DEFAULT_SORT;

  /*
   * Sort inside the Filters screen — `/userjourney` (2026-08-28). Honoured on
   * `top-chips` only: the `bottom-bar` pill is a designed 240px surface with
   * two halves either side of a rule, and a one-control pill is a shape no
   * frame draws. Nothing passes it on a pill route today, and this is what
   * keeps that from silently half-working if something does.
   */
  const sortInFilters = (controls?.sortInFilters ?? false) && variant === "top-chips";

  /**
   * Facets the strip can select but the rail no longer shows, handed to the
   * Filters screen so *Clear Filters* still reaches them.
   *
   * Derived from the chips actually on screen rather than hard-coded, so it
   * stays right as the strip changes: on `/userjourney` the Offers row left the
   * rail on 2026-08-28 while the three offer chips stayed, and without this
   * `All filters cleared` would close onto two lit chips.
   *
   * They are deliberately *not* added to `filterCount`. A lit chip already
   * reports itself, and counting it on the Filters badge as well is the
   * double-reporting that badge rule exists to prevent.
   */
  const clearsAlso = useMemo(
    () => [
      ...new Set(
        [
          ...chips.map((chip) => chip.facetId),
          /*
           * Size, when the guided block is drawing it. It is a control on the
           * listing exactly as a chip is, and it has no row on this rail — so
           * without this, *Clear Filters* would close the sheet on a lit size
           * tile and announce `All filters cleared` over it. Same reason as the
           * offer chips above, arriving from a different surface.
           */
          ...(guidedPv ? [SIZE_FACET_ID] : []),
        ].filter((id) => !railFacetIds.has(id)),
      ),
    ],
    [chips, railFacetIds, guidedPv],
  );
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
  const cartBottom = line && !cartHidden ? CART_BAR_H : 0;
  const pillBottom = cartBottom + PILL_GAP;

  /**
   * What the toast has to clear — **whatever is actually at the foot**, which
   * is the pill in A and C, the basket bar in B, D and the journey, or both,
   * or neither.
   *
   * It used to answer this with the variant alone: 72px in A to clear a
   * full-width bar, 24px in B, which had nothing down there. Both premises
   * expired on 2026-08-21, when A's bar became a floating pill that rides the
   * basket bar and *every* listing started carrying a basket. That left two
   * ways to hide a toast, and moving the journey onto top chips on 2026-08-28
   * would have shipped the second one:
   *
   * - **A and C with a line in the basket** — the pill climbs to 76–128 and
   *   the toast stayed at 72–104, so it came up *behind* the control.
   * - **B, D and the journey with a line** — the 64px basket bar covered a
   *   toast sitting at 24–56 outright, which is every clear on the one route
   *   whose whole flow is adding to a basket.
   *
   * Reading the foot rather than the variant lands on the same numbers in both
   * cases that were already right — 72 in A with an empty basket, 24 in B —
   * and moves only the two that were broken.
   */
  const toastFoot = variant === "bottom-bar" ? pillBottom + PILL_H : cartBottom;

  /*
   * **The Filters sheet is a foot of its own while it is up** (2026-08-28).
   * It covers the bottom 80% of the frame, so a toast at the listing's offset
   * lands over the sheet's own `Clear Filters` / `Show N results` footer. It
   * doesn't block anything — the toast wrapper is `pointer-events-none` — but
   * covering the control you are being told about is the wrong place to say
   * it. Above that footer it reads as belonging to the sheet, which it does.
   *
   * Only for the sheet presentation: the full-bleed screen in A–D has no
   * listing visible behind it, and nothing there fires a toast while it is
   * open anyway — both of its announcing exits close first.
   */
  const filterSheetUp = overlay === "filters" && (controls?.filterSheet ?? false);
  const toastBottom = filterSheetUp
    ? ACTION_FOOTER_H + TOAST_GAP
    : toastFoot
      ? toastFoot + TOAST_GAP
      : TOAST_INSET;

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
              showSort={!sortInFilters}
              chipH={chipH}
            >
              <ContextChips
                chips={chips}
                selections={selections}
                onToggle={toggleChip}
                onOpenPrice={setPriceSheet}
                chipH={chipH}
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
                  chipH={chipH}
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

        {/* First thing in the scroller, under the pinned chip strip and above
            the cards, as the reference has it — so it scrolls away with the
            listing rather than holding a third of the frame for good. */}
        {guidedPv && (
          <GetItRight
            products={products}
            selections={selections}
            settled={settled}
            onPickVertical={pickVertical}
            onToggleSize={(sizeId) => toggleChip(SIZE_FACET_ID, sizeId)}
          />
        )}

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
          // Supplying `sort` is what puts Sort By at the head of that screen's
          // rail; leaving it undefined is A–D, where Sort is its own control.
          // The commit takes the drafted sort back when there is one, and the
          // screen's own value otherwise.
          sort={sortInFilters ? sort : undefined}
          railPreset={railPreset}
          clearsAlso={clearsAlso}
          asSheet={controls?.filterSheet ?? false}
          rangeInputs={controls?.rangeInputs ?? false}
          onApply={(next, nextSort) => commit(next, nextSort ?? sort)}
          onDiscard={() => showToast(DISCARDED)}
          onCleared={() => showToast(CLEARED)}
          onInvalidRange={(noun) => showToast(invalidRange(noun))}
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
          bottom={toastBottom}
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
