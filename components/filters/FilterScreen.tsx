"use client";

import { useMemo, useRef, useState } from "react";
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
   * Add a typed **min and max** above the bands of every range facet —
   * `TYPED_RANGE_FACET_IDS`, which is Price Range, Margin on MRP and MOQ.
   * `/userjourney` only: Price from 2026-08-28, the other two from 2026-09-03,
   * on the same argument. The bands are the fast path and carry the counts; the
   * boxes are the escape hatch for a range nobody predicted.
   *
   * **One flag for the three**, not one per facet. They are the same control
   * answering the same objection, and a route that wants a typed price but
   * banded margins is a screen nobody has asked for — when someone does, this
   * becomes a set of facet ids and the panel already reads it that way.
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
  const FACET_RAIL = getRail(draft.category, verticalMode, settled, railPreset);
  const RAIL_FACET_IDS = getRailFacetIds(draft.category, verticalMode, settled, railPreset);

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

  const [activeRail, setActiveRail] = useState(RAIL[0].id);
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

  // The block can vanish under the cursor — tick a second vertical while
  // standing on Neck Type and that row is gone. Falling back to the first row
  // beats rendering an empty panel.
  const rail = RAIL.find((r) => r.id === activeRail) ?? RAIL[0];
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
  const panelFacets = rail.facetIds.map((facetId) => {
    const facet = FACET_BY_ID.get(facetId)!;
    return { facet, options: facetOptionsWithCounts(products, draft, facetId) };
  });

  /*
   * The field is earned, not declared. It replaced a static `searchable` flag
   * on 2026-08-20, which five facets set and none of them needed — Category,
   * Brands, Colour, Seller and Seller City all fit inside the panel whole, so
   * the field spent 56px of the fold searching a list you could already see.
   * Now it appears only when the options overflow, and goes away again when
   * pruning shortens them. See `lib/filters/panelFit.ts`.
   */
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
        <div className="no-scrollbar w-[120px] shrink-0 overflow-y-auto pb-[16px]">
          {RAIL.map((entry, index) => {
            const active = entry.id === activeRail;
            /*
             * The rail's applied cue. For a facet row it is the number of
             * ticked options; for Sort it is whether the value has left the
             * default — which is the app's standing rule, a dot for one value
             * and a count for many, and why `facetIds: []` needs no special
             * case beyond this line. The rail draws a dot either way; the
             * count is only ever a truthiness test here.
             */
            const applied =
              entry.id === SORT_RAIL_ID
                ? Number(draftSort !== DEFAULT_SORT)
                : entry.facetIds.reduce((sum, id) => sum + (draft[id]?.length ?? 0), 0);
            return (
              <button
                key={entry.id}
                onClick={() => {
                  setActiveRail(entry.id);
                  setQuery("");
                }}
                className={`flex h-[60px] w-full cursor-pointer items-center gap-[6px] pr-[8px] pl-[14px] text-left ${
                  active
                    ? "bg-white"
                    : "border-r border-[#dedede] bg-[#f4f4f4]"
                } ${index > 0 ? "border-t border-[#dedede]" : ""}`}
              >
                <span
                  className={`min-w-0 flex-1 text-[15px] ${
                    active ? "font-bold text-primary" : "font-medium text-[#323232]"
                  }`}
                >
                  {entry.label}
                </span>
                {applied > 0 && (
                  <span className="size-[6px] shrink-0 rounded-full bg-primary" />
                )}
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

          {panelFacets.map(({ facet, options: counted }) => {
            const facetId = facet.id;
            const options = activeQuery
              ? counted.filter((option) =>
                  option.label.toLowerCase().includes(activeQuery.toLowerCase()),
                )
              : counted;
            const chosen = draft[facetId] ?? [];

            return (
              <div key={facetId} className="flex w-full flex-col">
                {/* Only "More Filters" stacks several facets, so only it needs
                    headings to tell them apart. */}
                {panelFacets.length > 1 && (
                  <p className="px-[14px] pt-[12px] pb-[4px] text-[13px] font-bold text-[#767676]">
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
