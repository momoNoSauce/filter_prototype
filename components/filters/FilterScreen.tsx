"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { ActionFooter } from "@/components/ui/ActionFooter";
import {
  FACET_BY_ID,
  FILTER_VERTICALS,
  dropOrphanedSelections,
  getRail,
  getRailFacetIds,
  parseTypedRange,
  typedRangeId,
  singleValuedFacets,
  TYPED_RANGE_FACET_IDS,
  settledVertical,
  type RailPreset,
  type VerticalMode,
} from "@/lib/filters/facets";
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  clearSelections,
  countMatching,
  facetOptionsWithCounts,
  sameSelections,
  toggleSelection,
  type Selections,
  type SortId,
} from "@/lib/filters/engine";
import { SORT_ICONS } from "@/lib/filters/sortIcons";
import {
  RANGE_INPUTS_H,
  needsSearch,
  sheetHeightPct,
  sheetPanelViewport,
} from "@/lib/filters/panelFit";
import { SearchField } from "./SearchField";
import { OptionRow, RangeInputs, SortRow, ThumbRow } from "./OptionRows";

/**
 * The facet the locked panel offers, which is the same one the rail's own
 * Category row does. A constant rather than the string twice.
 */
const CATEGORY_FACET_ID = "category";

/**
 * The padlock after a locked rail row's label — `/pvfilters2`'s *More Filters*,
 * since 2026-09-24. It sat on the locked panel's heading before that, and on
 * the chips the heading replaced. **Inline, not a `public/figma/` export**: no
 * lock was ever drawn for this file, and the rule is never to redraw an asset
 * that *exists* — `FindItFast`'s selected-tile check is the same case and the
 * same answer. `currentColor`, so it takes the label's colour — grey closed,
 * primary open — rather than hard-coding a hex of its own.
 */
function Padlock() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="size-[14px] shrink-0">
      <path
        d="M3.6 5.2V3.9a2.4 2.4 0 0 1 4.8 0v1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <rect x="2.4" y="5.2" width="7.2" height="5.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * The rail id of the Sort By row — `/userjourney` only, and deliberately not a
 * facet id: Sort is one value where every facet is a set, it is not in
 * `FACETS`, and nothing may look it up in `FACET_BY_ID`. The `__` marks it as
 * synthetic so it can never collide with a real facet.
 */
const SORT_RAIL_ID = "__sort";

/**
 * What each range facet's boxes are measured in — see `RangeInputs`.
 *
 * A map here rather than a field on the facet registry, on the line this repo
 * already draws: `FACETS` says a facet's panel is a `range`, and how a rupee or
 * a percent is drawn beside a number is this screen's business. `ContextChips`
 * keeps its own icon map for the same reason.
 *
 * **The symbol's side is not a style choice.** ₹ leads its number and % and
 * `pc` follow theirs, which is how all three are written outside software; a
 * trailing ₹ or a leading % reads as a typo. `name` is what the screen reader
 * says — "Min price per piece", "Max margin on MRP" — so each box announces
 * which end of *what* it sets, the label alone being just "Min". `noun` is the
 * short form the refusal toast uses: `Min quantity can't be higher than max`,
 * where the full `name` would run to a sentence.
 */
const RANGE_UNITS: Record<
  string,
  { symbol: string; name: string; noun: string; after?: boolean }
> = {
  price: { symbol: "₹", name: "price per piece", noun: "price" },
  margin: { symbol: "%", name: "margin on MRP", noun: "margin", after: true },
  moq: { symbol: "pc", name: "order quantity in pieces", noun: "quantity", after: true },
  /*
   * The offer magnitudes (2026-09-03), each in the unit its offer is quoted in:
   * cashback and the scheme payout in rupees, the seller's own discount in
   * percent. Same rule as above — ₹ leads its number, `%` and `pc` follow
   * theirs, which is how all three are written outside software.
   *
   * They were removed on 2026-09-07 when the three rows merged into one panel
   * that had nowhere to put three pairs of boxes, and restored hours later with
   * the boxes when the rows split apart again.
   */
  cashback: { symbol: "₹", name: "cashback in rupees", noun: "cashback" },
  sellerOffer: { symbol: "%", name: "seller offer in percent", noun: "seller offer", after: true },
  targetScheme: { symbol: "₹", name: "target scheme payout in rupees", noun: "scheme payout" },
};

/**
 * Figma 638:3659 — the full-screen Filters sheet.
 *
 * Edits a draft copy of the selections. Two of its three exits commit —
 * "Show N results" applies the draft silently, "Clear Filters" applies an empty
 * one and says so — and the ✕ discards, which also says so. Only the plain
 * apply is wordless, being the one nobody needs told about.
 *
 * **It rises from the bottom and leaves the same way** (2026-08-25), which is
 * what `Sheet` already does for Sort and Price and what this screen was alone
 * in not doing: it used to appear and vanish between frames, so a panel that
 * covers everything arrived with no account of where it came from. It owns its
 * own dismissal for that reason — every exit flips `closing`, and `onClose`,
 * which unmounts it, only fires once the exit animation has finished. See
 * `exit`.
 *
 * Every count in here is live: the footer total and each
 * option's own count both recompute on every tick, and options that become
 * impossible drop out of the list.
 */
export function FilterScreen({
  products,
  selections,
  onApply,
  onClose,
  onDiscard,
  onCleared,
  onInvalidRange,
  verticalMode = FILTER_VERTICALS,
  sort,
  railPreset = "default",
  initialRail,
  clearsAlso,
  asSheet = false,
  rangeInputs = false,
}: {
  products: Product[];
  selections: Selections;
  /**
   * Commit the draft. The second argument is the drafted sort, present only
   * where Sort lives inside this screen — callers that don't pass `sort` can
   * ignore it, and their handler's narrower signature still satisfies this one.
   */
  onApply: (next: Selections, sort?: SortId) => void;
  onClose: () => void;
  /**
   * Closed on the ✕ while holding edits that were never applied. This screen
   * can be carrying a dozen of them, and since the Category sheet went it is
   * the only draft surface left, so silence here is the only way a discard
   * could go unannounced. Fires only when something would actually be lost.
   */
  onDiscard: () => void;
  /**
   * Clear Filters was tapped. Separate from `onApply` because the two are
   * different events that happen to share a code path: applying a draft says
   * nothing, clearing announces itself. The screen is already closing when
   * this fires, so the toast belongs to the listing underneath.
   */
  onCleared: () => void;
  /**
   * A typed range was left with min above max. The draft never took it — this
   * is only so the listing's toast can say why nothing happened. The argument
   * is the facet's own noun (`price`, `margin`, `quantity`), so the message
   * names the control the buyer is actually looking at.
   *
   * Its own callback rather than a flag on `onApply`, for the reason
   * `onCleared` is: these are different events that happen to share a screen,
   * and one component owning every string is what stops two of them wording
   * the same event differently. See *Which events speak*.
   */
  onInvalidRange: (noun: string) => void;
  /** How this screen treats verticals — see `VerticalMode`. */
  verticalMode?: VerticalMode;
  /**
   * The current sort, which **moves Sort inside this screen when supplied**
   * (2026-08-28, on the stakeholder review, `/userjourney` only).
   *
   * Passing it adds a *Sort By* row at the head of the rail, whose panel is the
   * five options as single-select rows. Leaving it `undefined` is A–D, where
   * Sort is its own control — the chip in B and D, the pill's left half in A
   * and C — and this screen never mentions it.
   *
   * It joins the **draft** like everything else here, so a tap re-sorts nothing
   * until `Show N results`, the ✕ discards it, and *Clear Filters* returns it
   * to Popularity along with the filters. That last part is a deliberate
   * stretch of the button's label, taken on the call: one control resets the
   * screen completely, rather than leaving one row of it standing.
   */
  sort?: SortId;
  /** Which rail this screen shows — see `RailPreset`. */
  railPreset?: RailPreset;
  /**
   * The rail row to open on, or `null`/absent for the first — which is what the
   * Filter chip has always done.
   *
   * `/pvfilters`' guided block names one (2026-09-09): its style buttons *are*
   * a way into a specific panel, and landing on Price Range would make the
   * button a decoration. Read once, as the initial state, because this screen
   * unmounts when the sheet closes — a row that stayed pinned would fight the
   * buyer's own taps on the rail.
   *
   * An unknown id is harmless: the rail lookup already falls back, for the
   * separate case of a row vanishing under the cursor.
   */
  initialRail?: string | null;
  /**
   * Facets **Clear Filters must also reach**, though no rail row shows them.
   *
   * Normally empty, and deliberately so: wiping a filter from a screen that
   * never displayed it is a silent surprise, which is why clearing is a filter
   * over the rail rather than a blanket reset. The exception is a facet the
   * buyer *can* see and toggle — just on the listing rather than here. On
   * `/userjourney` the Offers row left the rail while the three offer chips
   * stayed on the strip (2026-08-28), and without this `All filters cleared`
   * would close onto two lit chips, which is the toast telling a lie.
   *
   * `PlpScreen` derives it from the chips actually on the strip, so a facet
   * that gains or loses a chip needs nothing changed here.
   */
  clearsAlso?: readonly string[];
  /**
   * Render as a **bottom sheet over the listing** rather than a full-bleed
   * screen. `/userjourney` only (2026-08-28); A–D are full-bleed still.
   *
   * The point is context: a full-bleed panel takes the buyer off the page they
   * were filtering, so four ticks later the only report of what changed is a
   * number in the footer. It also shortens the panel, which is why
   * `panelFit` has to be told — see `SHEET_PANEL_VIEWPORT`.
   */
  asSheet?: boolean;
  /**
   * Add a typed **min and max** above the bands of every facet in
   * `TYPED_RANGE_FACET_IDS` — Price Range, Margin on MRP and MOQ.
   * `/userjourney` only: Price from 2026-08-28, the other two from 2026-09-03,
   * on the same argument. The bands are the fast path and carry the counts; the
   * boxes are the escape hatch for a range nobody predicted.
   *
   * **One flag for the three**, not one per facet. They are the same control
   * answering the same objection, and a route that wants a typed price but
   * banded margins is a screen nobody has asked for. Which facets it reaches is
   * the registry's answer, not this flag's — the three offer magnitudes were in
   * that set from 2026-09-03 until 2026-09-07, when their rows merged into one
   * *Offers* panel and dropped the boxes (`typed: false` in `RANGE_FACETS`).
   *
   * The two controls are **exclusive**, per facet: typing replaces any ticked
   * band and ticking a band clears a typed range. Both are values on one facet,
   * where they OR, so leaving both standing would *widen* the result — a buyer
   * who typed 150–450 and then ticked *Under ₹200* would be shown ₹80 shirts.
   *
   * A–D show the bands alone. Nothing there can produce a range, so their Price
   * chip sheet is unaffected.
   */
  rangeInputs?: boolean;
}) {
  const [draft, setDraft] = useState<Selections>(selections);

  /**
   * Sort lives inside this screen exactly when a sort was handed to it. A
   * derived flag rather than a second prop, so the two can't disagree — there
   * is no "show the row but don't tell me the value".
   */
  const sortInside = sort !== undefined;
  const [draftSort, setDraftSort] = useState<SortId>(sort ?? DEFAULT_SORT);
  const openedSort = useRef(sort ?? DEFAULT_SORT);

  // The rail follows the *draft*, not the applied selections: ticking a single
  // vertical grows the attribute block immediately, and ticking a second one
  // takes it away again, without waiting for "Show N results". A Gender cut
  // that leaves one vertical standing does the same — see `settledVertical`.
  const settled = settledVertical(products, draft, verticalMode);
  /*
   * What the page's scope has at most one of — Brands, Seller and Seller City
   * on a one-brand, one-seller storefront (2026-09-07). Off `products`, so it
   * holds still while the buyer filters: a row that came and went as boxes were
   * ticked is what the 2026-08-19 reorder set out to stop. See `hideIfSingle`.
   */
  const scopeSingles = useMemo(() => singleValuedFacets(products), [products]);
  const FACET_RAIL = getRail(draft.category, verticalMode, settled, railPreset, scopeSingles);
  const RAIL_FACET_IDS = getRailFacetIds(
    draft.category,
    verticalMode,
    settled,
    railPreset,
    scopeSingles,
  );

  /**
   * What Clear Filters empties: the rail, plus anything the listing shows that
   * the rail doesn't. See `clearsAlso` — still a filter over a named set, never
   * a blanket reset.
   */
  const CLEARABLE = new Set([...RAIL_FACET_IDS, ...(clearsAlso ?? [])]);

  // Sort leads the rail when it lives here — it is the first question a buyer
  // answers about a list they can already see, where every row below it
  // narrows the list itself. `facetIds: []` keeps it out of every count and
  // clear path that walks the rail by facet, which is what makes the rest of
  // this screen need no special case for it.
  const RAIL = sortInside
    ? [{ id: SORT_RAIL_ID, label: "Sort By", facetIds: [] }, ...FACET_RAIL]
    : FACET_RAIL;

  /**
   * The sheet's height, from the rail it is showing — the ceiling above is only
   * reached once the rail asks for it. Read off `RAIL` rather than the preset,
   * so the Sort row counts when it is there and the six attribute rows count
   * the moment a *draft* category settles the vertical: the sheet grows with
   * the rows, in the same update that adds them.
   */
  const sheetPct = sheetHeightPct(RAIL.length);

  /*
   * **Unlocking scrolls the rail up towards Category** (2026-09-24,
   * `/pvfilters2`, on request: *the list scrolls up to show category as the
   * first and the items above it moving up the scroll*).
   *
   * Category sits second-last on the gated rail, just above *More Filters*, so
   * the six rows that unlock arrive below it — at the foot, and mostly below
   * the fold. The scroll brings them into view, and the rows above Category
   * travel up out of it rather than being pushed down.
   *
   * **As far as the rail goes, and no further** (the same day, on the render:
   * *there is space left at the bottom … that I don't want*). Category and the
   * six are seven rows, 420px, against a rail of ~530px at 360×800 and more on
   * bigger phones, so Category can't reach the very top without empty rail
   * under Closure Type — a spacer did that for an hour and came off. The target
   * is still Category's own offset, which the browser clamps to the end of the
   * rail: on a tall phone the rail lands on its last row with Category as high
   * as the rows under it allow, and on one too short for the seven, Category
   * goes to the top and no further.
   *
   * Fired by the **transition**, not the state — the render that loses the
   * placeholder — so a sheet that opens already unlocked starts at the top like
   * any other. Both ways into the unlock, the locked panel's picker and the
   * Category row's own panel, are the same transition, so both scroll.
   */
  const gatedOnRail = RAIL.some((r) => r.gated);
  const wasGated = useRef(gatedOnRail);
  const railRef = useRef<HTMLDivElement>(null);
  const categoryRowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const unlocked = wasGated.current && !gatedOnRail;
    wasGated.current = gatedOnRail;
    const railEl = railRef.current;
    const row = categoryRowRef.current;
    if (!unlocked || !railEl || !row) return;
    // Measured rather than counted in rows, so a row that ever wraps taller
    // can't leave the target short.
    const top =
      row.getBoundingClientRect().top - railEl.getBoundingClientRect().top + railEl.scrollTop;
    // The travel is the point — the rows above are seen to go up — so it is
    // smooth, except under reduced motion, where it simply lands.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    railEl.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [gatedOnRail]);

  const [activeRail, setActiveRail] = useState(initialRail ?? RAIL[0].id);
  const [query, setQuery] = useState("");

  /** What the screen opened with, frozen, so the ✕ can tell edits from none. */
  const opened = useRef(selections);

  const [closing, setClosing] = useState(false);

  /** Held for the animation's end — see `exit`. */
  const announcement = useRef<(() => void) | null>(null);

  /*
   * The one way out, animated. All three exits go through it, which is what
   * lets the panel slide away before unmounting rather than blinking off.
   *
   * The two callbacks are deliberately on different sides of the animation.
   * **`commit` runs at once**: the listing is hidden behind an opaque panel for
   * the whole 200ms, so it should already be showing the answer by the time it
   * is uncovered — apply after, and the buyer watches the old list for a frame
   * and then a jump. **`announce` waits**: a toast behind that panel is a toast
   * nobody sees, and its 2,600ms is no better for losing the first 200 of them.
   *
   * The `closing` guard matters because the footer stays live while the panel
   * travels — a second tap on Clear Filters, or a ✕ chased by a CTA, would
   * otherwise queue a second commit against a screen already leaving.
   */
  const exit = (opts: { commit?: () => void; announce?: () => void } = {}) => {
    if (closing) return;
    opts.commit?.();
    announcement.current = opts.announce ?? null;
    setClosing(true);
  };

  /*
   * The ✕. Only this exit can lose anything, so only this one checks — the
   * other two commit what they hold, and neither needs an `applied` guard.
   */
  const dismiss = () =>
    exit({
      announce:
        sameSelections(draft, opened.current) && draftSort === openedSort.current
          ? undefined
          : onDiscard,
    });

  /*
   * The row under the cursor can vanish — tick a second vertical while standing
   * on Neck Type and that row is gone. Falling back beats rendering an empty
   * panel, and *where* it falls back is worth a line:
   *
   * **A gated row that unlocks lands on Category** (2026-09-09, on the ask).
   * Ticking a category inside *More Filters* is what makes that row disappear
   * — the six filters it stood in for arrive as rows of their own — and landing
   * on Price Range, the first row, would read as the screen resetting under the
   * tap. Category is where the buyer just acted, with their pick ticked, so the
   * screen answers rather than restarts.
   *
   * Declarative rather than a `setActiveRail` in the toggle handler: the swap
   * and the landing then happen in the same render as the tap, and there is no
   * order to get wrong between two pieces of state.
   */
  const rail =
    RAIL.find((r) => r.id === activeRail) ??
    RAIL.find((r) => r.id === CATEGORY_FACET_ID) ??
    RAIL[0];
  /**
   * Whether the open panel is Sort's rather than a facet's. `facetIds: []`
   * means the facet path below produces an empty list on its own, so this
   * decides only what gets rendered *instead* — no branch anywhere else needs
   * to know.
   */
  const isSortPanel = rail.id === SORT_RAIL_ID;

  /**
   * Which facet on the open panel takes typed inputs, if any — see
   * `rangeInputs`. A facet id rather than a boolean, since the same panel logic
   * now serves Price Range, Margin on MRP and MOQ, and each needs to know
   * *whose* draft values the boxes are showing.
   *
   * `find` over the panel's facets rather than a lookup by rail id: More
   * Filters is the one row that stacks several facets, and a range facet
   * joining it later should light the boxes without a second branch here.
   */
  const rangeFacetId = rangeInputs
    ? rail.facetIds.find((id) => TYPED_RANGE_FACET_IDS.has(id))
    : undefined;
  const rangeChosen = rangeFacetId ? (draft[rangeFacetId] ?? []) : [];

  /**
   * Any *band* ticked on that facet, which disables the boxes (2026-08-28). The
   * two were already exclusive; disabling states the rule before it costs the
   * buyer their typing rather than after.
   *
   * Read off the draft rather than tracked separately, so a hand-written
   * `?moq=5-40,moq-4` — both at once, which no control can produce — still
   * shows a coherent screen: the band applies, the boxes are disabled, and
   * unticking the band hands them back.
   */
  const bandTicked = rangeChosen.some((id) => !parseTypedRange(id));

  /**
   * The mirror: a typed range disables the bands.
   *
   * Both directions, because the exclusivity is one rule and a rule that only
   * shows itself one way round reads as a quirk of whichever control you
   * happened to touch first. It also retires the last silent half of it —
   * typing used to clear a ticked band without saying so, and now it can't be
   * reached at all.
   */
  const rangeTyped = rangeChosen.some((id) => parseTypedRange(id));

  /**
   * The two boxes' values, read back out of the draft rather than held beside
   * it. One source of truth, so Clear Filters empties the fields through the
   * same path it empties everything else.
   */
  const typedRange = (() => {
    const chosen = rangeChosen[0];
    const range = chosen ? parseTypedRange(chosen) : null;
    if (!range) return { min: "", max: "" };
    return {
      min: range.min ? String(range.min) : "",
      max: Number.isFinite(range.max) ? String(range.max) : "",
    };
  })();
  const total = useMemo(() => countMatching(products, draft), [products, draft]);

  // Only selections this screen can actually show enable "Clear Filters".
  const ownedCount = Object.entries(draft).reduce(
    (sum, [facetId, chosen]) => sum + (CLEARABLE.has(facetId) ? chosen.length : 0),
    0,
  );

  /*
   * The open panel's options, computed once rather than inside the render
   * loop: the search field's visibility is decided from how many there are,
   * and then the very same lists are what get rendered.
   */
  /**
   * **A gated row with no vertical settled** — `/pvfilters2`'s *More
   * Filters* (2026-09-09). The row stays on the rail in both states; this is
   * what decides which panel it opens.
   *
   * Read off the *draft*, like everything else on this screen, so ticking a
   * category in the locked panel unlocks it in the same tap rather than on
   * `Show N results`.
   */
  const locked = Boolean(rail.gated) && settled === null;

  const panelFacets = locked
    ? []
    : rail.facetIds.map((facetId) => {
        const facet = FACET_BY_ID.get(facetId)!;
        return { facet, options: facetOptionsWithCounts(products, draft, facetId) };
      });

  /**
   * The categories offered *inside* the locked panel, so unlocking is a tap
   * rather than an instruction to go and find another row. Same facet, same
   * counts and same `toggle` as the Category row two columns to the left —
   * ticking here ticks there.
   */
  const unlockOptions = locked
    ? facetOptionsWithCounts(products, draft, CATEGORY_FACET_ID)
    : [];

  /**
   * What is behind the lock. Only its **length** is read — the panel counts
   * them — but it stays derived from the row rather than hard-coded, so adding
   * a seventh filter to the block changes the heading without anyone
   * remembering to.
   */
  const panelPreview = locked ? rail.facetIds : [];

  /*
   * The field is earned, not declared. It replaced a static `searchable` flag
   * on 2026-08-20, which five facets set and none of them needed — Category,
   * Brands, Colour, Seller and Seller City all fit inside the panel whole, so
   * the field spent 56px of the fold searching a list you could already see.
   * Now it appears only when the options overflow, and goes away again when
   * pruning shortens them. See `lib/filters/panelFit.ts`.
   */
  // A locked panel has no options to hunt through — it has a prompt and three
  // categories — so it never earns a field. `panelFacets` is empty there, which
  // says so already; this is the comment, not a second condition.
  const searchable = needsSearch(
    panelFacets.map(({ facet, options }) => ({
      panel: facet.panel,
      optionCount: options.length,
    })),
    // The sheet's panel is shorter, so lists earn a field sooner there — and
    // *how* much shorter now moves with the rail, so it is computed from the
    // height actually being rendered rather than from the 80% case.
    asSheet ? sheetPanelViewport(sheetPct) : undefined,
    // A range panel carries its min/max boxes above the bands.
    rangeFacetId ? RANGE_INPUTS_H : 0,
  );

  /*
   * A panel can stop overflowing while a query is still in the box — tick
   * enough options and the list prunes below the threshold, taking the field
   * with it. Dropping the query with the field keeps a hidden control from
   * going on filtering.
   */
  const activeQuery = searchable ? query : "";

  /*
   * **Clear Filters commits and closes** (2026-08-25), where it used to edit
   * the draft and stop there. A buyer who taps a button called *Clear Filters*
   * expects the filters gone and the listing back; what they got was a screen
   * that looked unchanged apart from a counter, still asking them to press
   * *Show N results* — the one control here whose effect they couldn't see, and
   * the reason clearing read as broken.
   *
   * Clearing is a complete instruction rather than a partial edit: there is no
   * half-cleared state left to keep refining, so holding someone here to
   * confirm it a second time is a step with nothing in it. The cost is that
   * re-picking from scratch means reopening the screen — one tap, against an
   * action that currently appears to do nothing.
   *
   * It goes out through the same `onApply` the primary CTA uses, so `commit`
   * drops orphaned selections, rewrites the URL and scrolls the listing to the
   * top exactly as it would otherwise. Draft edits made before the tap go with
   * it deliberately — that is what clearing means.
   *
   * **It announces itself** (added the same day). Landing on a full listing is
   * ambiguous on its own: a buyer who has just cleared four filters and one who
   * has just been dumped somewhere by a bug see the same screen. The toast is
   * the difference, and it is a *confirmation* rather than the ✕'s warning —
   * `onCleared` is its own callback for that reason, and not a flag on
   * `onApply`, which stays silent because a draft the buyer built and then
   * committed needs no narration.
   *
   * Still a filter over RAIL_FACET_IDS rather than a blanket reset: a facet
   * this screen doesn't display must never be wiped by a button whose effect
   * the user can't see.
   */
  const clearAll = () =>
    exit({
      // Sort goes back to Popularity with the filters (2026-08-28). It is a
      // stretch of the label, chosen on the call: the button resets this
      // screen completely rather than leaving one row of it standing. Harmless
      // in A–D, where `sortInside` is false and `DEFAULT_SORT` is what the
      // caller already holds.
      commit: () => onApply(clearSelections(draft, CLEARABLE), DEFAULT_SORT),
      announce: onCleared,
    });

  const toggle = (facetId: string, optionId: string) =>
    setDraft((current) => {
      /*
       * **A band and a typed range are exclusive** (2026-08-28; all three range
       * facets since 2026-09-03). Both are values on one facet, where they OR
       * — so leaving a range standing while a band is ticked would *widen* the
       * result, and a buyer who typed 150–450 and then ticked *Under ₹200*
       * would be shown ₹80 shirts. They are two ways of saying one thing, so
       * the last one used wins.
       *
       * Written here rather than in the input's handler because only this
       * direction needs saying: the boxes already replace the whole selection.
       */
      const base = TYPED_RANGE_FACET_IDS.has(facetId)
        ? {
            ...current,
            [facetId]: (current[facetId] ?? []).filter((id) => !parseTypedRange(id)),
          }
        : current;
      const next = toggleSelection(base, facetId, optionId);
      // Recomputed from `next`, not from the render's `settled`: unticking the
      // Gender that settled the vertical has to orphan the attribute rows in
      // the same update that removes them from the rail.
      return dropOrphanedSelections(
        next,
        verticalMode,
        settledVertical(products, next, verticalMode),
        // This rail's own vertical-only set: Size is global on the journey, so
        // unticking a category there must not take the ticked sizes with it.
        railPreset,
      );
    });

  const body = (
    <>
      <div className="flex w-full shrink-0 items-center justify-between border-b border-[#dedede] bg-white px-[14px] py-[12px]">
        <div className="flex min-w-0 items-center gap-[8px]">
          {/* The same glyph the Filters control carries, so the screen is
              visibly the one that button opened. Black in the export, which is
              the heading's colour, so it needs no `MaskIcon` tint.

              24px is the export's own size — it was being downscaled to 18 and
              read as an afterthought beside the heading. Native also means no
              resampling, which matters on a glyph this thin. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-[24px] shrink-0" src="/figma/icons/filter_alt.svg" />
          <p className="truncate text-[16px] font-medium text-black">Filters</p>
        </div>
        <button
          aria-label="Close filters"
          onClick={dismiss}
          className="block size-[15px] shrink-0 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full" src="/figma/icons/close.svg" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Rail */}
        {/*
          **140px, up from the frame's 120** (2026-09-03), because the rows now
          carry a count rather than a 6px dot and the number needs somewhere to
          be. Measured, not chosen: at 15px the widest label is `Margin on MRP`
          at 105 and the next is `Delivery Time` at 93, and 140 less the 14px
          inset, the 6px gap, an 18px badge and the 8px right pad leaves **94** —
          so every row but `Margin on MRP` sets on one line, that one wraps as it
          already did, and the label box is *wider* than the 86 a dotted row used
          to leave.

          The 20px comes off the panel, which is `flex-1` rather than the frame's
          fixed 240 (2026-08-21) and so absorbs it: 220 at the design width, and
          more on any phone wider than 360. That is enough for the longest
          thumbnail row — `Men's Casual T-Shirts (222)` is 181px and breaks over
          two lines at 111, where a rail past ~145 would push it to a third and
          bring back the truncation those rows were built to fix.
        */}
        <div ref={railRef} className="no-scrollbar w-[140px] shrink-0 overflow-y-auto pb-[16px]">
          {RAIL.map((entry, index) => {
            // `rail.id`, not `activeRail`: when a row vanishes the two differ
            // for a render, and the rail must light the panel that is open —
            // otherwise unlocking More Filters leaves nothing highlighted.
            const active = entry.id === rail.id;
            /*
             * The rail's applied cue. For a facet row it is the number of
             * ticked options; for Sort it is whether the value has left the
             * default — which is the app's standing rule, **a dot for one value
             * and a count for many**, and why `facetIds: []` needs no special
             * case beyond this line.
             *
             * **The rail used to draw a dot either way** and that was the rule's
             * one exception: six colours ticked looked exactly like one, and a
             * 6px mark was the whole report on a screen whose point is what you
             * have applied. Since 2026-09-03 a facet row carries the number in a
             * filled circle — the counter the Filters chip already uses, so
             * "how many are applied" is drawn one way across the app — and Sort
             * keeps the dot, holding exactly one value.
             */
            const applied =
              entry.id === SORT_RAIL_ID
                ? Number(draftSort !== DEFAULT_SORT)
                : entry.facetIds.reduce((sum, id) => sum + (draft[id]?.length ?? 0), 0);
            /*
             * **A gated row is drawn like any other** (2026-09-09, corrected on
             * the render). It shipped dimmed, on the reasoning that the rail
             * should say *unavailable* before the buyer opens it — and it read
             * as *disabled*, which is the one thing it is not: it is the row
             * you are meant to press, and the panel behind it is an invitation.
             * One thing distinguishes it, since 2026-09-24: **the padlock after
             * its label**, moved up from the locked panel's heading on request.
             */
            return (
              <button
                key={entry.id}
                ref={entry.id === CATEGORY_FACET_ID ? categoryRowRef : undefined}
                onClick={() => {
                  setActiveRail(entry.id);
                  setQuery("");
                }}
                /*
                 * **Every row takes the same fill**, the gated one included. It
                 * carried a `primary-subtle` tint for a day of 2026-09-09,
                 * asked for so it would not read as greyed out; reversed on
                 * 09-10 — a second colour in a column of eight identical rows
                 * made the rail look like two lists rather than one.
                 *
                 * **Its borders are the same too**, since 2026-09-10. It spent
                 * an afternoon outlined in `primary` — the fill's replacement,
                 * 1px instead of 60×140 of ground — and that went the same way.
                 * A box drawn round one row of eight is a heavier claim than
                 * the row needs, and it fought the rail's own grid of shared
                 * hairlines.
                 */
                className={`flex h-[60px] w-full cursor-pointer items-center gap-[6px] pr-[8px] pl-[14px] text-left ${
                  active
                    ? "bg-white"
                    : "border-r border-[#dedede] bg-[#f4f4f4]"
                } ${index > 0 ? "border-t border-[#dedede]" : ""}`}
              >
                {/*
                  **A gated row's label is coloured like every row's**
                  (2026-09-24, on request: its colour *is not like other
                  filters*). It was always primary from 2026-09-10, the one mark
                  left after the dim, the tint and the outline came off. **The
                  padlock after it is the mark now**, asked for in the same
                  note, and it takes the label's colour — so closed it is grey
                  like its neighbours, and open it goes bold primary exactly as
                  they do.

                  **And it holds still** (2026-09-24, on the go-ahead: *just say
                  More Filters*). It used to ticker through the six filters
                  behind it and end on a pulsing *Enable Style Filters*; now it
                  is the row's own name.

                  No count ever shares the line with the lock: the row shows
                  only outside a vertical, where its six facets are orphaned,
                  so `applied` is always 0 on it.
                */}
                <span
                  className={`min-w-0 flex-1 text-[15px] ${
                    active ? "font-bold text-primary" : "font-medium text-[#323232]"
                  }`}
                >
                  {entry.gated ? (
                    // A flex line, so the 14px lock centres on the text rather
                    // than sitting on its baseline. `More Filters` and the lock
                    // fit the 118px a badgeless label has, bold as well.
                    <span className="flex items-center gap-[6px]">
                      {entry.label}
                      <Padlock />
                    </span>
                  ) : (
                    entry.label
                  )}
                </span>
                {applied > 0 &&
                  (entry.id === SORT_RAIL_ID ? (
                    <span className="size-[6px] shrink-0 rounded-full bg-primary" />
                  ) : (
                    /*
                     * 18px, so it reads at arm's length where the 6px dot did
                     * not — this app's buyer is a kirana retailer on a
                     * mid-range Android. `min-w` with 4px of padding rather
                     * than a fixed square: Colour can reach twenty ticks, and a
                     * two-digit number turns the circle into a pill of the same
                     * height instead of overflowing it.
                     */
                    <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-[4px] text-[11px] font-medium text-white">
                      {applied}
                    </span>
                  ))}
              </button>
            );
          })}
        </div>

        {/*
          Panel. **The remaining width, not a fixed 240** (2026-08-21): the frame
          draws 120 + 240 = 360, and below 480px `DeviceFrame` renders the app
          edge to edge at `100vw`, so on a 390 or 430px phone those two fixed
          columns left 30–70px of dead white beside the tiles. The rail keeps its
          designed 120 — its labels are set to it — and the panel takes the rest,
          which is what a native layout does and what makes the two agree at
          exactly 360.

          Everything inside is width-agnostic (`w-full` rows, a grid whose
          columns stretch), so the only visible effect of a wider panel is bigger
          tiles. `panelFit.ts` still computes against the design width: it decides
          whether the *server* renders a search field, and the server has no
          viewport. Its answer is exact at 360 and slightly optimistic beyond it —
          the columns stay three and the square tiles grow, so rows are taller
          than the 105 it assumes and a long panel can overflow where it said it
          wouldn't. The cost is a missing search field on a wide phone, on a
          list you can still scroll; measuring instead would mean rendering no
          field on the server and adding one after hydration, which is the 56px
          shift that rule exists to avoid.
        */}
        <div className="no-scrollbar flex min-w-0 flex-1 flex-col overflow-y-auto">
          {searchable ? (
            <SearchField value={query} onChange={setQuery} />
          ) : (
            <div className="h-[10px] shrink-0" />
          )}

          {/*
            The Sort By panel — five single-select rows, no counts and no
            search field, a sort neither narrowing the list nor being long
            enough to hunt through. `role="radiogroup"` because these are one
            value where the rest of this screen is sets, which is also why they
            are `SortRow` and not `OptionRow`.
          */}
          {isSortPanel && (
            <div role="radiogroup" aria-label="Sort By" className="flex w-full flex-col">
              {SORT_OPTIONS.map((option) => (
                <SortRow
                  key={option.id}
                  label={option.label}
                  icon={SORT_ICONS[option.id]}
                  selected={option.id === draftSort}
                  onSelect={() => setDraftSort(option.id)}
                />
              ))}
            </div>
          )}

          {/*
            The typed range, above the bands it is an alternative to. The
            bands stay the fast path and keep their counts; these cover what
            the bands don't. Ticking a band clears whatever is typed here —
            see `toggle`.
          */}
          {rangeFacetId && (
            <RangeInputs
              min={typedRange.min}
              max={typedRange.max}
              unit={RANGE_UNITS[rangeFacetId]}
              onChange={(min, max) =>
                setDraft((current) => {
                  const id = typedRangeId(min, max);
                  const next = { ...current };
                  // Both boxes empty is no filter at all on this facet, not a
                  // range of nothing — so the key goes, and the badge stops
                  // counting it.
                  if (id) next[rangeFacetId] = [id];
                  else delete next[rangeFacetId];
                  return next;
                })
              }
              onInvalid={() => onInvalidRange(RANGE_UNITS[rangeFacetId].noun)}
              disabled={bandTicked}
            />
          )}

          {/*
            **The locked panel** — `/pvfilters2`'s *More Filters* before a
            vertical is settled (2026-09-09).

            Two lines and the picker, in that order: what you get and how many,
            then the one instruction, then the tap that carries it out. Naming
            the payoff first is what turns a dead row into an offer; a bare
            *select a category* states a rule and leaves the payoff to the
            imagination.

            **The six names are not here.** They spent an afternoon as
            padlocked chips, and the padlock outlived them on the heading until
            2026-09-24, when it moved to the rail row, after the label. The
            chips came off because the rail row's ticker read the names out, so
            spelling them again above the picker was the same information twice
            in one glance, and it cost the categories most of the fold. **The
            ticker came off too** (2026-09-24), so nothing names the six until a
            category is picked — known, and left for the designer to call.

            The categories are the real `ThumbRow`s with live counts and the
            same `toggle` as the Category row up the rail, so ticking here is
            ticking there — and because the whole screen runs off the draft, the
            row unlocks under the finger rather than on `Show N results`.
          */}
          {locked && (
            <div className="flex w-full flex-col">
              {/*
                **17 over 15, not 15 over 14** (2026-09-09, on the render: the
                heading read as small). This is the screen's own message, not a
                group heading inside a stacked panel — those are the 15px bold
                that `FACET_HEADING_H` measures, sized to sit *level* with the
                option rows they label. A line that is the only thing on the
                panel has to lead the 15px `ThumbRow`s below it, so it goes a
                step up and the second line meets the rows at 15.

                **No padlock here since 2026-09-24** — it moved to the rail row,
                after *More Filters*, on request. The word *locked* is now the
                panel's only mention of the lock.

                **Set tight, 22 over 20** (2026-09-24, on the render: the gap
                between the two lines *looks off*). Both inherited the body's
                1.5, which left 10.5px between their glyphs — two lines of
                one message set like two messages. Explicit leading takes it to
                4, the second line's 20 being `ThumbRow`'s own. `pt` 6 → 7 and
                `pb` 14 → 15 give back what the leading took from the outer
                edges, so the heading sits where it did and only the gap moved.
              */}
              <p className="px-[14px] pt-[7px] text-[17px] leading-[22px] font-bold text-heading">
                {panelPreview.length} style filters locked
              </p>
              <p className="px-[14px] pt-[2px] pb-[15px] text-[15px] leading-[20px] text-muted">
                Pick a category to see them
              </p>
              {unlockOptions.map((option) => (
                <ThumbRow
                  key={option.id}
                  option={option}
                  selected={(draft[CATEGORY_FACET_ID] ?? []).includes(option.id)}
                  onToggle={() => toggle(CATEGORY_FACET_ID, option.id)}
                />
              ))}
            </div>
          )}

          {panelFacets.map(({ facet, options: counted }, group) => {
            const facetId = facet.id;
            const options = activeQuery
              ? counted.filter((option) =>
                  option.label.toLowerCase().includes(activeQuery.toLowerCase()),
                )
              : counted;
            const chosen = draft[facetId] ?? [];

            /*
              **A headed, ruled group per facet, where a panel stacks more than
              one** — today only A–D's Offers row, which carries `hasOffer` and
              `offers`.

              The heading was 13px bold `#767676` and was reported as not
              prominent enough (2026-09-07), on the merged *All Offers* panel
              that existed for a few hours: three groups of near-identical band
              rows, with the only thing saying which offer you were ticking set
              two sizes below the rows themselves and in the palette's muted
              grey. It is now **15px on `heading`** — the app's control-label
              size, so a section title is not smaller than the options under
              it, and 16.6:1 against the 4.5:1 that grey was scraping past.

              **The rule above each group but the first** is that panel's own
              sketch, which drew three boxes. It sits on the wrapper rather
              than the heading so it spans the panel edge to edge, where a
              border on a `px-[14px]` heading would inset with the text.

              **A lone panel is never headed**, including an offer's. It had
              the offer's name and chip art for an hour of 2026-09-07, while
              the three magnitudes were merged and a heading was the only thing
              telling the groups apart; with a row each, the rail already names
              the panel in primary two columns to the left, and the heading was
              repeating it. `OFFER_FACET_ICONS` went with it — the art is still
              in `lib/filters/offerIcons.ts`, which is where a panel that wants
              it again should take it from.
            */
            const headed = panelFacets.length > 1;

            return (
              <div
                key={facetId}
                className={`flex w-full flex-col${
                  headed && group > 0 ? " mt-[8px] border-t border-hairline" : ""
                }`}
              >
                {headed && (
                  <p className="px-[14px] pt-[14px] pb-[6px] text-[15px] font-bold text-heading">
                    {facet.label}
                  </p>
                )}

                {options.length === 0 ? (
                  <p className="px-[14px] py-[16px] text-[14px] text-muted">
                    No options match.
                  </p>
                ) : facet.panel === "thumb" ? (
                  // Category and Brands since 2026-09-03 — a row per option
                  // with its picture, where both were a tile grid. See
                  // `ThumbRow`; `TileGrid` has no caller now.
                  options.map((option) => (
                    <ThumbRow
                      key={option.id}
                      option={option}
                      selected={chosen.includes(option.id)}
                      onToggle={() => toggle(facetId, option.id)}
                    />
                  ))
                ) : (
                  options.map((option) => (
                    <OptionRow
                      key={option.id}
                      option={option}
                      selected={chosen.includes(option.id)}
                      onToggle={() => toggle(facetId, option.id)}
                      // Only this facet's own bands, and only while the boxes
                      // above them hold the answer. A range typed into Margin
                      // must not grey out the MOQ bands beside it in a stacked
                      // panel.
                      disabled={facetId === rangeFacetId && rangeTyped}
                    />
                  ))
                )}
              </div>
            );
          })}

          <div className="h-[16px] shrink-0" />
        </div>
      </div>

      <ActionFooter
        primaryLabel={`Show ${total.toLocaleString("en-IN")} results`}
        // Live when there is anything on this screen to clear, which since
        // 2026-08-28 includes a non-default sort where Sort lives here.
        clearDisabled={ownedCount === 0 && draftSort === DEFAULT_SORT}
        onClear={clearAll}
        onPrimary={() => exit({ commit: () => onApply(draft, draftSort) })}
      />
    </>
  );

  /*
   * **A bottom sheet, so the listing stays visible behind it** (2026-08-28, on
   * the stakeholder review, `/userjourney` only).
   *
   * A full-bleed panel is the one surface in this app that takes the buyer off
   * the page they were on: they tick four things against a listing they can no
   * longer see, and the only report of what changed is a count in the footer.
   * At `SHEET_HEIGHT` the app bar, the chip strip and the top of the first card
   * stay on screen, so the filtering reads as happening *to* something.
   *
   * **The motion goes back to the sheets'.** `screen-in` exists because
   * `translateY(100%)` on a panel pinned to `inset-0` is the whole 800px frame,
   * and 800px of literal travel reads as an elevator ride — so that version
   * rises 32px and lets alpha carry the arrival. That argument is about the
   * distance, and the distance is now the sheet's own height, which is what
   * `sheet-in` was written for. A–D keep `screen-in`, being still full-bleed.
   *
   * The scrim is a real exit, so it goes through `dismiss` — the same
   * discard-checking path as the ✕, not a bare `onClose`. Escape does too.
   */
  if (!asSheet) {
    return (
      <div
        /*
         * **A fade with a 32px rise, not the sheets' full-height travel.**
         *
         * This shipped on `animate-sheet-in`/`-out` first, on the reasoning
         * that a panel pinned to `inset-0` makes their `translateY(100%)`
         * exactly the frame's height. It does, and that was the problem: 800px
         * of literal travel reads as an elevator ride where the same 260ms over
         * a 300px sheet reads as a sheet. Alpha should carry the arrival and
         * the distance should only hint at the direction — which is what
         * `dialog-in` already does one property over, scaling 8% rather than
         * growing from nothing. See `screen-in` in `globals.css`.
         *
         * It still *rises*, so it still answers the pill at the foot of A and
         * C, for a twenty-fifth of the movement.
         */
        className={`absolute inset-0 z-50 flex flex-col bg-white ${
          closing ? "animate-screen-out" : "animate-screen-in"
        }`}
        // Children animate too; only react to the panel's own animation. The
        // enter pass reaches here as well, which is what `closing` filters out.
        onAnimationEnd={(e) => {
          if (!closing || e.target !== e.currentTarget) return;
          announcement.current?.();
          onClose();
        }}
      >
        {body}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close filters"
        className={`absolute inset-0 bg-black/40 ${
          closing ? "animate-scrim-out" : "animate-scrim-in"
        }`}
        onClick={dismiss}
      />
      <div
        style={{ height: `${sheetPct}%` }}
        /*
         * The height **transitions**, because the one thing that changes it is
         * a tick: settling a vertical adds six rail rows and takes the sheet
         * from 530 to 640. Snapping 110px would read as a glitch beside the
         * rows sliding in above it. The enter and exit keyframes animate
         * `transform`, so they don't fight this.
         */
        className={`relative flex min-h-0 flex-col overflow-hidden rounded-t-[8px] bg-white drop-shadow-[0px_-4px_8px_rgba(0,0,0,0.25)] transition-[height] duration-200 ease-out motion-reduce:transition-none ${
          closing ? "animate-sheet-out" : "animate-sheet-in"
        }`}
        onAnimationEnd={(e) => {
          if (!closing || e.target !== e.currentTarget) return;
          announcement.current?.();
          onClose();
        }}
      >
        {body}
      </div>
    </div>
  );
}
