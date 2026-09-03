"use client";

import type { ReactNode } from "react";
import { CHIP_H_TALL, ChipStrip } from "./ContextChips";

/**
 * Figma 644:4011 — the Filter / Sort chip bar, used by B, D and `/userjourney`.
 *
 * **Filter leads, Sort follows** (2026-09-03, on request). The frame draws Sort
 * first; this is a deliberate departure, and it is applied to the pill in
 * `BottomActionBar` too rather than to this bar alone — the 2×2 compares where
 * the controls *sit*, so a different order on the chips than on the pill would
 * put a second difference into a comparison built to hold one. Filter first is
 * also the order the two are used in: a buyer narrows a 540-product listing
 * before deciding how to rank what is left, and Filter is the control that
 * carries a count.
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
  showSort = true,
  chipH = CHIP_H_TALL,
  children,
}: {
  sortActive: boolean;
  filterCount: number;
  onSort: () => void;
  onFilters: () => void;
  /**
   * Whether the Sort chip is here at all. `false` on `/userjourney` since
   * 2026-08-28, where Sort moved inside the Filters screen as the first row of
   * its rail — the frame draws two chips, and one control in two places is the
   * thing this repo keeps removing. The divider stays: it separates the
   * screen's own controls from the contextual chips, and that boundary holds
   * whether there are two chips before it or one.
   */
  showSort?: boolean;
  /**
   * One height for the whole row, chosen by the screen — see `CHIP_H_TALL`.
   * Imported rather than declared here for the reason it always was: two
   * heights in one scrolling row is what looks broken.
   */
  chipH?: string;
  /** Contextual chips, placed after the frame's divider. */
  children?: ReactNode;
}) {
  return (
    <ChipStrip>
      {/* Filter first since 2026-09-03 — see the header. `sort.svg` on the
          chip below it, not the frame's caret (2026-08-20, on request): a caret
          says "this opens" and nothing about what it opens, where the glyph
          beside `Filter` names its control. It is also the same `SortAscending`
          the bottom bar has always carried, so the two placements differ in
          placement alone. */}
      <Chip
        icon="/figma/icons/funnel.svg"
        label="Filter"
        badge={filterCount}
        onClick={onFilters}
        chipH={chipH}
      />
      {showSort && (
        <Chip
          icon="/figma/icons/sort.svg"
          label="Sort"
          dot={sortActive}
          onClick={onSort}
          chipH={chipH}
        />
      )}
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
  chipH,
}: {
  icon: string;
  label: string;
  dot?: boolean;
  badge?: number;
  onClick: () => void;
  chipH: string;
}) {
  // Active state carries over from the bottom bar so both variants report
  // themselves the same way: a dot for one value, a count for many.
  const active = dot || !!badge;

  return (
    <button
      onClick={onClick}
      // `gap-[8px]`, up from the frame's 4 (2026-08-21): the leading element is
      // now sometimes a filled counter rather than a line glyph, and 4px left it
      // crowding the label. Constant in both states, so the chip's width doesn't
      // move as filters are applied.
      className={`flex ${chipH} shrink-0 cursor-pointer items-center justify-center gap-[8px] rounded-[8px] border px-[12px] ${
        active ? "border-primary bg-primary-subtle" : "border-[#4d4d4d] bg-white"
      }`}
    >
      {/*
        **The count replaces the glyph**, rather than sitting on it (2026-08-21):
        over the funnel it covered most of it and read as clutter, and beside the
        label it cost the chip 21px of a horizontally scrolling strip the moment
        it appeared (`Filter` 85 → 106px, measured). In the icon's place it costs
        nothing — a one-digit count is 3px narrower than the glyph it stands in
        for — and the chip stops changing width as filters are applied, which was
        half the point. The chip still says `Filter` beside it, so the glyph is
        not what carries the meaning; the number is, and now it has the room.

        The Sort dot stays *on* its glyph: Sort holds one value, so there is no
        number to swap in, and a dot is small enough not to obscure anything.
      */}
      {badge ? (
        <span className="flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-primary px-[4px] text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : (
        <span className="relative size-[20px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full" src={icon} />
          {dot && (
            // Ringed in the chip's own active fill, so it reads as sitting on
            // the chip rather than punched through it.
            <span className="absolute -top-[1px] -right-[2px] size-[8px] rounded-full bg-primary ring-2 ring-primary-subtle" />
          )}
        </span>
      )}
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
