"use client";

import { Sheet, SheetRow } from "@/components/ui/Sheet";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { SORT_OPTIONS, type SortId } from "@/lib/filters/engine";

/**
 * Figma 644:4435. Tapping a row applies it and closes — there is no Apply button.
 *
 * The glyphs are the five in Figma `688:1687` (`SortbyIcon`), drawn as a set at
 * one weight — so the sheet takes **all five from that set** and borrows
 * nothing. `recent` no longer stands in `tag.svg` (the Sort sheet's own
 * *Recently Added* glyph doing double duty), and `popularity` no longer takes
 * the PLP's `trend-up.svg`, which is a heavier cut of the same trending arrow.
 *
 * `sort-percent.svg` currently matches the library's `percent.svg` byte for
 * byte. It is still its own file: the set is the unit that gets reweighted, so
 * a redraw has to land in one place and not depend on a coincidence between
 * two glyphs with different owners.
 *
 * They render through `MaskIcon`, which reads only the alpha channel, so a
 * black glyph still tints to primary on the active row.
 *
 * Arrow direction is the magnitude, not the list — **up for low → high**,
 * prices ascending as you read down — and the frame agrees, naming the
 * up-arrow glyph `low to high`.
 */
const ICONS: Record<SortId, string> = {
  popularity: "/figma/icons/sort-popular.svg",
  recent: "/figma/icons/sort-new.svg",
  price_asc: "/figma/icons/sort-price-low-high.svg",
  price_desc: "/figma/icons/sort-price-high-low.svg",
  margin_desc: "/figma/icons/sort-percent.svg",
};

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
                <MaskIcon src={ICONS[option.id]} className="size-full" color={color} />
              )}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}
