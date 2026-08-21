"use client";

import type { ReactNode } from "react";
import { CHIP_H, ChipStrip } from "./ContextChips";

/**
 * Figma 644:4011 — the Sort / Filter chip bar, used by Variant B.
 *
 * Chip: 1px #4d4d4d border, 20px icon, 14px Roboto Bold at 74% opacity.
 * Container: pl-8 pr-16 py-12, gap-8.
 *
 * Height comes from `CHIP_H` rather than the frame's 32, and is imported rather
 * than repeated: these two sit in the same scrolling row as the contextual
 * chips, which grew to 44 on 2026-08-14 to carry a legible thumbnail. Two
 * heights in one row is the thing that would look broken, so there is one
 * number and it lives with the chips that forced it.
 *
 * The corner is **8px, not the frame's rounded-100 pill** (2026-08-14). These
 * two share one row with the contextual chips, which are Material 3 filter and
 * input chips at 8dp, and a pill beside a rounded rectangle one gap away reads
 * as an inconsistency rather than a distinction. This was the open question the
 * chip work left for the designer — settled towards M3, since it is the shape
 * the majority of the row already carries. Reversing it is this one value.
 *
 * It is pinned below the app bar rather than scrolling with the list: in
 * this variant it is the *only* way to reach Sort and Filters, so it must not
 * simply scroll away.
 *
 * **It does now leave, deliberately** (2026-08-21): `PlpScreen` hides the strip
 * once the buyer is 1.5 folds down and scrolling away from it, and brings it
 * back on the first upward flick — Amazon's behaviour, asked for. That is not
 * the same thing as scrolling out of reach: it costs a fold and a half to lose
 * and one gesture to recover, where a strip that merely scrolled would be gone
 * until you had scrolled all the way back.
 *
 * The trailing divider is the design's own — the boundary it draws before the
 * contextual chips, which arrive as `children` and share the row and its
 * horizontal scroll. Variant A puts those same chips in a bare `ChipStrip`,
 * with no Sort or Filter chip ahead of them and so no divider.
 *
 * **Everything in this row scrolls together**, Sort and Filter included — the
 * convention other commerce apps follow. Sort and Filter were briefly held at
 * the head of the row with `position: sticky` while the chips scrolled beneath
 * them; that was reversed on 2026-08-14 by choice, not because it misbehaved.
 *
 * Note what it costs, since it is the reason the pin was tried: scroll the row
 * right and B's only route to Sort and Filters leaves the screen. The strip
 * stays pinned *vertically*, so they are always one horizontal scroll away
 * rather than lost — but they are no longer always visible.
 *
 * If it is ever pinned again, the trap is worth knowing: a sticky box is held
 * against the scrollport by its **margin** box, so `left-0` on a cluster inside
 * a padded scroll container leaves the padding exposed, and passing chips show
 * through it as a sliver. A negative margin does not fix it — `-ml` moves the
 * margin edge that sticky is pinning, so the background stays put. The inset
 * has to leave the scroll container and move onto the pinned cluster itself.
 */
export function TopChipBar({
  sortActive,
  filterCount,
  onSort,
  onFilters,
  children,
}: {
  sortActive: boolean;
  filterCount: number;
  onSort: () => void;
  onFilters: () => void;
  /** Contextual chips, placed after the frame's divider. */
  children?: ReactNode;
}) {
  return (
    <ChipStrip>
      {/* `sort.svg`, not the frame's caret (2026-08-20, on request). A caret
          says "this opens" and nothing about what it opens, where the glyph
          beside `Filter` names its control; this is also the same
          `SortAscending` the bottom bar has always carried, so the two
          placements now differ in placement alone. */}
      <Chip icon="/figma/icons/sort.svg" label="Sort" dot={sortActive} onClick={onSort} />
      <Chip
        icon="/figma/icons/funnel.svg"
        label="Filter"
        badge={filterCount}
        onClick={onFilters}
      />
      {/* The frame's divider, grown with the chips it separates — it read as
          22 of 32, so it keeps that proportion against the taller row. */}
      <span className="h-[30px] w-px shrink-0 bg-[#4d4d4d]" />
      {children}
    </ChipStrip>
  );
}

function Chip({
  icon,
  label,
  dot,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  dot?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  // Active state carries over from the bottom bar so both variants report
  // themselves the same way: a dot for one value, a count for many.
  const active = dot || !!badge;

  return (
    <button
      onClick={onClick}
      // `gap-[8px]`, up from 4 (2026-08-21): the badge sits on the glyph and a
      // two-digit count reaches 2px past it either side, so 4px was too tight to
      // read as a gap. 8 is constant whether the badge is there or not, so the
      // chip doesn't change width as filters are applied — which was half the
      // point of moving the badge onto the glyph in the first place.
      className={`flex ${CHIP_H} shrink-0 cursor-pointer items-center justify-center gap-[8px] rounded-[8px] border px-[12px] ${
        active ? "border-primary bg-primary-subtle" : "border-[#4d4d4d] bg-white"
      }`}
    >
      {/*
        The count and the dot sit **on** the glyph, not after the label
        (2026-08-21) — the treatment the bottom pill already used, and the reason
        is the row: a badge as a sibling cost the chip 21px of a horizontally
        scrolling strip (measured: `Filter` 85px → 106px the moment a count
        appeared), where a badge over the icon costs 3. It also stops the chip
        changing width as filters are applied, so nothing to its right shuffles.
      */}
      <span className="relative size-[20px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="size-full" src={icon} />
        {!!badge && (
          // **Centred on the glyph's top edge**, not hung off its right corner.
          // The count is every selected option, so it reaches two digits easily
          // — at 13 a right-anchored badge grew into the label and touched it,
          // where a centred one grows 2px each way and never can. The box stays
          // 17px at 11px: this is a number the buyer reads, and the type pass
          // raised these counters to 11 for that reason.
          //
          // It does cover most of the funnel, which is the trade: the chip says
          // `Filter` beside it, so the glyph is not the thing carrying the
          // meaning, and the count is.
          <span className="absolute -top-[7px] left-1/2 flex h-[17px] min-w-[17px] -translate-x-1/2 items-center justify-center rounded-full bg-primary px-[4px] text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
        {dot && (
          // Ringed in the chip's own active fill, so it reads as sitting on the
          // chip rather than punched through it.
          <span className="absolute -top-[1px] -right-[2px] size-[8px] rounded-full bg-primary ring-2 ring-primary-subtle" />
        )}
      </span>
      <span
        className={`text-[15px] leading-[16px] font-bold whitespace-nowrap ${
          active ? "text-primary" : "text-black/90 opacity-74"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
