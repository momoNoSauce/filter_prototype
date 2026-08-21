"use client";

import { MaskIcon } from "@/components/ui/MaskIcon";

/** The pill's own box, and the gap it keeps from whatever sits below it. */
export const PILL_W = 240;
export const PILL_H = 52;
export const PILL_GAP = 12;

/**
 * Figma **`697:2658`** — Sort and Filters as a **floating dark pill**, not a
 * full-width bar (2026-08-21, on request).
 *
 * This is the design that brings A and C back. They were parked because a
 * pinned white bar across the foot of the listing fought the basket bar for that
 * edge; the frame answers it by floating a 240px pill *above* the basket bar,
 * with the listing scrolling under both. Nothing competes for the edge any more.
 *
 * Measured off the frame: 240 × 52, `#323232`, a 1px `#d1d1d1` border, 16px
 * radius, `0 0 5.05px rgba(0,0,0,0.3)`, two halves either side of a 32px rule,
 * each `pt-[4px] pb-[8px]` with a 24px glyph over its label. It sits 12px above
 * the basket bar, exactly as the frame stacks them.
 *
 * Two departures, both this repo's standing rules rather than new decisions:
 *
 * - **The labels are 15px, not the frame's 14.** Every 14px control label went
 *   to 15 in the type pass of 2026-08-20; this is one, and the pill has the room.
 * - **The dot and the count stay.** The frame gives no way to tell a filtered
 *   list from an unfiltered one. Sort holds at most one value, so it gets a dot;
 *   Filters holds many, so it gets a count — the same cue the chip variants use.
 *
 * The glyphs are the exports A and C already had — `sort.svg` is the frame's own
 * `SortAscending`, and the frame's `Funnel` is `funnel.svg`, which B and D's
 * chip carries. Both ship black, for light surfaces, so they render through
 * `MaskIcon` in white here rather than being re-exported.
 */
export function BottomActionBar({
  sortActive,
  filterCount,
  onSort,
  onFilters,
}: {
  sortActive: boolean;
  filterCount: number;
  onSort: () => void;
  onFilters: () => void;
}) {
  return (
    <div
      style={{ width: PILL_W, height: PILL_H }}
      className="flex items-center justify-center rounded-[16px] border border-[#d1d1d1] bg-[#323232] drop-shadow-[0px_0px_5.05px_rgba(0,0,0,0.3)]"
    >
      <PillItem label="Sort" icon="/figma/icons/sort.svg" dot={sortActive} onClick={onSort} />
      {/* The frame's 32px rule. White at 40% rather than a flat grey: it has to
          read on `#323232` without becoming a third element. */}
      <span className="h-[32px] w-px shrink-0 bg-white/40" />
      <PillItem
        label="Filters"
        icon="/figma/icons/funnel.svg"
        badge={filterCount}
        onClick={onFilters}
      />
    </div>
  );
}

function PillItem({
  label,
  icon,
  badge,
  dot,
  onClick,
}: {
  label: string;
  icon: string;
  badge?: number;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center pt-[4px] pb-[8px]"
    >
      <span className="relative size-[24px] shrink-0">
        <MaskIcon src={icon} className="size-full" color="#ffffff" />
        {!!badge && (
          <span className="absolute -top-[4px] -right-[8px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-[4px] text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
        {dot && (
          // Ringed in the pill's own fill, not white, so it reads as sitting on
          // the pill rather than punched through it.
          <span className="absolute -top-[1px] -right-[3px] size-[8px] rounded-full bg-primary ring-2 ring-[#323232]" />
        )}
      </span>
      <span className="text-[15px] font-medium whitespace-nowrap text-white">{label}</span>
    </button>
  );
}
