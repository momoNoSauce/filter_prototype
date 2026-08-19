"use client";

import { Sheet, SheetRow } from "@/components/ui/Sheet";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { SORT_OPTIONS, type SortId } from "@/lib/filters/engine";

/** Figma 644:4435. Tapping a row applies it and closes — there is no Apply button. */
const ICONS: Record<SortId, string> = {
  popularity: "/figma/icons/trend-up.svg",
  recent: "/figma/icons/tag.svg",
  /*
   * Supplied PNGs, not Figma exports, so they sit outside `public/figma/`.
   * They work through `MaskIcon` like the rest: a mask reads only the alpha
   * channel, so a black glyph on transparent still tints to primary when its
   * row is active.
   *
   * Arrow direction is the magnitude, not the list: **up for low → high**,
   * since the prices ascend as you read down. Swap the two paths if the
   * intent was to describe the list order instead.
   */
  price_asc: "/sort/price-asc.png",
  price_desc: "/sort/price-desc.png",
  margin_desc: "/figma/icons/percent.svg",
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
