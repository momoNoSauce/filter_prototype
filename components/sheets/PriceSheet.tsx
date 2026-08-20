"use client";

import { Sheet } from "@/components/ui/Sheet";
import { OptionRow } from "@/components/filters/OptionRows";
import type { CountedOption } from "@/lib/filters/engine";

/**
 * The Price chip's bands, in a bottom sheet.
 *
 * **Replaces the anchored dropdown** (2026-08-20, on request): same sheet shell
 * as Sort, so the strip has one way of opening things rather than two. The
 * dropdown had to be rendered at the screen root and positioned by hand —
 * measured against the frame and clamped, because `overflow-x-auto` on the strip
 * would otherwise clip it — and all of that arithmetic goes with it.
 *
 * **No glyph column**, unlike Sort: these are checkboxes, and the box is already
 * the row's leading element. That is also why the rows are the Filters screen's
 * own `OptionRow` rather than a sheet row — Price Range is a rail facet, its
 * panel is a list of exactly these checkboxes, and the same control in two
 * places should not be drawn twice. The counts come with them.
 *
 * It **applies live and stays open**, which is the one way it differs from Sort:
 * Sort holds a single value so a tap can commit and dismiss, where several bands
 * can be ticked here. Dismissal is the scrim, the ✕ or Escape — all three the
 * shell's own.
 */
export function PriceSheet({
  options,
  chosen,
  onToggle,
  onClose,
}: {
  options: CountedOption[];
  chosen: string[];
  onToggle: (optionId: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Price Range" onClose={onClose}>
      <div className="flex w-full flex-col items-start pb-[8px]">
        {options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            selected={chosen.includes(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </div>
    </Sheet>
  );
}
