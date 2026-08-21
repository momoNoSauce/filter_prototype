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
  settledVertical,
  type VerticalMode,
} from "@/lib/filters/facets";
import {
  countMatching,
  facetOptionsWithCounts,
  sameSelections,
  toggleSelection,
  type Selections,
} from "@/lib/filters/engine";
import { needsSearch } from "@/lib/filters/panelFit";
import { SearchField } from "./SearchField";
import { OptionRow, TileGrid } from "./OptionRows";

/**
 * Figma 638:3659 — the full-screen Filters sheet.
 *
 * Edits a draft copy of the selections; "Show N results" commits it, the close
 * button discards it. Every count in here is live: the footer total and each
 * option's own count both recompute on every tick, and options that become
 * impossible drop out of the list.
 */
export function FilterScreen({
  products,
  selections,
  onApply,
  onClose,
  onDiscard,
  verticalMode = FILTER_VERTICALS,
}: {
  products: Product[];
  selections: Selections;
  onApply: (next: Selections) => void;
  onClose: () => void;
  /**
   * Closed on the ✕ while holding edits that were never applied. This screen
   * can be carrying a dozen of them, and since the Category sheet went it is
   * the only draft surface left, so silence here is the only way a discard
   * could go unannounced. Fires only when something would actually be lost.
   */
  onDiscard: () => void;
  /** How this screen treats verticals — see `VerticalMode`. */
  verticalMode?: VerticalMode;
}) {
  const [draft, setDraft] = useState<Selections>(selections);

  // The rail follows the *draft*, not the applied selections: ticking a single
  // vertical grows the attribute block immediately, and ticking a second one
  // takes it away again, without waiting for "Show N results". A Gender cut
  // that leaves one vertical standing does the same — see `settledVertical`.
  const settled = settledVertical(products, draft, verticalMode);
  const RAIL = getRail(draft.category, verticalMode, settled);
  const RAIL_FACET_IDS = getRailFacetIds(draft.category, verticalMode, settled);

  const [activeRail, setActiveRail] = useState(RAIL[0].id);
  const [query, setQuery] = useState("");

  /** What the screen opened with, frozen, so the ✕ can tell edits from none. */
  const opened = useRef(selections);

  /*
   * Unlike the bottom sheets, this screen's two exits are separate handlers
   * rather than one animated `onClose`, so only the ✕ needs the check — "Show
   * N results" can't reach it and needs no `applied` guard.
   */
  const dismiss = () => {
    if (!sameSelections(draft, opened.current)) onDiscard();
    onClose();
  };

  // The block can vanish under the cursor — tick a second vertical while
  // standing on Neck Type and that row is gone. Falling back to the first row
  // beats rendering an empty panel.
  const rail = RAIL.find((r) => r.id === activeRail) ?? RAIL[0];
  const total = useMemo(() => countMatching(products, draft), [products, draft]);

  // Only selections this screen can actually show enable "Clear Filters".
  const ownedCount = Object.entries(draft).reduce(
    (sum, [facetId, chosen]) => sum + (RAIL_FACET_IDS.has(facetId) ? chosen.length : 0),
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
  );

  /*
   * A panel can stop overflowing while a query is still in the box — tick
   * enough options and the list prunes below the threshold, taking the field
   * with it. Dropping the query with the field keeps a hidden control from
   * going on filtering.
   */
  const activeQuery = searchable ? query : "";

  const toggle = (facetId: string, optionId: string) =>
    setDraft((current) => {
      const next = toggleSelection(current, facetId, optionId);
      // Recomputed from `next`, not from the render's `settled`: unticking the
      // Gender that settled the vertical has to orphan the attribute rows in
      // the same update that removes them from the rail.
      return dropOrphanedSelections(
        next,
        verticalMode,
        settledVertical(products, next, verticalMode),
      );
    });

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
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
            const applied = entry.facetIds.reduce(
              (sum, id) => sum + (draft[id]?.length ?? 0),
              0,
            );
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
                ) : facet.panel === "tile" ? (
                  <TileGrid
                    options={options}
                    selected={chosen}
                    onToggle={(id) => toggle(facetId, id)}
                  />
                ) : (
                  options.map((option) => (
                    <OptionRow
                      key={option.id}
                      option={option}
                      selected={chosen.includes(option.id)}
                      onToggle={() => toggle(facetId, option.id)}
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
        clearDisabled={ownedCount === 0}
        // Clears only what this screen owns — which is now everything, in
        // both variants, Category included. The rule stays expressed as a
        // filter over RAIL_FACET_IDS rather than a blanket reset: a facet the
        // screen doesn't display must never be wiped by a button whose effect
        // the user can't see.
        onClear={() =>
          setDraft((current) =>
            Object.fromEntries(
              Object.entries(current).filter(([facetId]) => !RAIL_FACET_IDS.has(facetId)),
            ),
          )
        }
        onPrimary={() => {
          onApply(draft);
          onClose();
        }}
      />
    </div>
  );
}
