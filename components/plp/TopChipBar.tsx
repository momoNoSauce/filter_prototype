"use client";

import type { ReactNode } from "react";
import { ChipStrip } from "./ContextChips";

/**
 * Figma 644:4011 — the Sort / Filter chip bar, used by Variant B.
 *
 * Chip: h-32, rounded-100, 1px #4d4d4d border, 18px icon, 14px Roboto Bold at
 * 74% opacity. Container: pl-8 pr-16 py-12, gap-8.
 *
 * It is pinned below the GOLD strip rather than scrolling with the list: in
 * this variant it is the *only* way to reach Sort and Filters, so it can never
 * be allowed to scroll out of reach.
 *
 * The trailing divider is the design's own — the boundary it draws before the
 * contextual chips, which now arrive as `children` and share the row and its
 * horizontal scroll. Variant A puts those same chips in a bare `ChipStrip`,
 * with no Sort or Filter chip ahead of them and so no divider.
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
      <Chip icon="/figma/icons/caret-down.svg" label="Sort" dot={sortActive} onClick={onSort} />
      <Chip
        icon="/figma/icons/funnel.svg"
        label="Filter"
        badge={filterCount}
        onClick={onFilters}
      />
      <span className="h-[22px] w-px shrink-0 bg-[#4d4d4d]" />
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
      className={`flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-[4px] rounded-[100px] border px-[8px] ${
        active ? "border-primary bg-primary-subtle" : "border-[#4d4d4d] bg-white"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="size-[18px]" src={icon} />
      <span
        className={`text-[14px] leading-[16px] font-bold whitespace-nowrap ${
          active ? "text-primary" : "text-black/90 opacity-74"
        }`}
      >
        {label}
      </span>
      {!!badge && (
        <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-[4px] text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {dot && <span className="size-[6px] shrink-0 rounded-full bg-primary" />}
    </button>
  );
}
