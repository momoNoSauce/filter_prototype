"use client";

import { Sheet, SheetRow } from "@/components/ui/Sheet";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { SORT_OPTIONS, type SortId } from "@/lib/filters/engine";
import { SORT_ICONS } from "@/lib/filters/sortIcons";

/**
 * Figma 644:4435. Tapping a row applies it and closes — there is no Apply button.
 *
 * The glyphs come from `SORT_ICONS` — the five in Figma `688:1687`
 * (`SortbyIcon`), drawn as a set at one weight, so this sheet takes all five
 * and borrows nothing. They moved to `lib/filters/sortIcons.ts` on 2026-08-28
 * when the Filters screen grew a Sort By panel and became the second surface
 * that draws them.
 *
 * Arrow direction is the magnitude, not the list — **up for low → high**,
 * prices ascending as you read down — and the frame agrees, naming the
 * up-arrow glyph `low to high`.
 */

export function SortSheet({
  value,
  onChange,
  onClose,
}: {
  value: SortId;
  onChange: (sort: SortId) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Sort By" onClose={onClose}>
      {(close) => (
        <div className="flex w-full flex-col items-start gap-[4px] pb-[8px]">
          {SORT_OPTIONS.map((option, index) => (
            <SheetRow
              key={option.id}
              label={option.label}
              selected={option.id === value}
              last={index === SORT_OPTIONS.length - 1}
              onClick={() => {
                onChange(option.id);
                // Animated dismissal — the list re-sorts behind the sheet as
                // it slides away.
                close();
              }}
              renderIcon={(color) => (
                <MaskIcon src={SORT_ICONS[option.id]} className="size-full" color={color} />
              )}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}
