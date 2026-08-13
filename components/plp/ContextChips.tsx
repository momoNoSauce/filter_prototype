"use client";

import type { ReactNode } from "react";
import type { ContextChip } from "@/lib/filters/contextChips";

/**
 * The strip below the GOLD bar. In Variant A it holds only these; in B it
 * follows the Sort and Filter chips, after the divider the frame already draws
 * as the boundary for them.
 *
 * Pinned rather than scrolling with the list, matching `TopChipBar`: the strip
 * changes as you drill in, and a control that rewrites itself off-screen is
 * worse than no control.
 */
export function ChipStrip({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex w-full items-center gap-[8px] overflow-x-auto bg-white py-[12px] pr-[16px] pl-[8px]">
      {children}
    </div>
  );
}

export function ContextChips({
  chips,
  selections,
  onToggle,
}: {
  chips: ContextChip[];
  selections: Record<string, string[]>;
  onToggle: (facetId: string, optionId: string) => void;
}) {
  return (
    <>
      {chips.map(({ facetId, option }) => (
        <FilterChip
          key={`${facetId}:${option.id}`}
          label={option.label}
          selected={(selections[facetId] ?? []).includes(option.id)}
          onClick={() => onToggle(facetId, option.id)}
        />
      ))}
    </>
  );
}

/**
 * Material 3 filter chip.
 *
 * Spec followed: 32dp high, 8dp corner, 1dp outline when unselected, filled
 * container with no outline when selected, an 18dp leading checkmark on
 * selection, 16dp label padding dropping to 8dp on the side the checkmark
 * takes, 14sp Medium label, 8dp between chips.
 *
 * Two deliberate departures. The container and label take this app's tokens
 * rather than M3's palette — `primary/subtle` and `primary/default` for the
 * selected state — so the chips read as part of the product. And the shape is
 * M3's 8dp corner while `TopChipBar`'s Sort and Filter chips are the frame's
 * fully-rounded pills, so in Variant B the two shapes sit side by side. That
 * follows the instruction to use the M3 guideline, but it is a visible
 * mismatch and easy to reverse if the pill should win.
 *
 * No counts on the labels. M3 filter chips are a label and an optional leading
 * icon, and the vertical names are long enough on a 360px strip without a
 * trailing number. Counts stay where there is room for them, in the panels.
 */
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      // A chip is a toggle, so it announces as one rather than as a button
      // that happens to look pressed.
      role="checkbox"
      aria-checked={selected}
      className={`flex h-[32px] shrink-0 cursor-pointer items-center gap-[8px] rounded-[8px] pr-[16px] ${
        selected
          ? "bg-primary-subtle pl-[8px]"
          : "border border-[#4d4d4d] bg-white pl-[16px]"
      }`}
    >
      {selected && (
        <svg viewBox="0 0 18 18" className="size-[18px] shrink-0" aria-hidden>
          <path
            d="M3.5 9.5l3.5 3.5 7.5-7.5"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span
        className={`text-[14px] leading-[20px] font-medium whitespace-nowrap ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
