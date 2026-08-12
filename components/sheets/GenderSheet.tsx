"use client";

import { Sheet, SheetRow } from "@/components/ui/Sheet";
import { MaskIcon } from "@/components/ui/MaskIcon";

/**
 * Figma 644:4470, with one deliberate departure.
 *
 * The frame carries a Clear Filters / Apply footer, implying multi-select.
 * Journey mapping found nobody shops two genders at once, so this behaves like
 * the Sort sheet instead: tap a row, it applies and the sheet closes. No
 * footer, no draft state.
 *
 * Tapping the row that's already on clears the filter — with no Clear button,
 * that's the only way back to "all genders" from here.
 *
 * It writes the same `gender` facet the Filters screen exposes under More
 * Filters, which is single-select too, so the two can never disagree.
 */
const GENDERS = [
  { id: "men", label: "Men", icon: "/figma/icons/gender-male.svg" },
  { id: "women", label: "Women", icon: "/figma/icons/gender-female.svg" },
  // Boys and Girls are two crops out of one exported sprite.
  { id: "boys", label: "Boys", sprite: { left: "-184.82%", top: "-126.77%" } },
  { id: "girls", label: "Girls", sprite: { left: "-71.88%", top: "-127.4%" } },
] as const;

export function GenderSheet({
  value,
  onSelect,
  onClose,
}: {
  value: string[];
  onSelect: (next: string[]) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Gender" onClose={onClose}>
      {(close) => (
        <div className="flex w-full flex-col items-start gap-[4px] pb-[8px]">
          {GENDERS.map((gender, index) => {
            const selected = value.includes(gender.id);
            return (
              <SheetRow
                key={gender.id}
                label={gender.label}
                selected={selected}
                last={index === GENDERS.length - 1}
                onClick={() => {
                  onSelect(selected ? [] : [gender.id]);
                  close();
                }}
                renderIcon={(color) =>
                  "icon" in gender ? (
                    <MaskIcon
                      src={gender.icon}
                      className="size-full"
                      color={color}
                    />
                  ) : (
                    // Masking the oversized layer inside the clipping box keeps
                    // the exact sprite crop while still letting the glyph tint.
                    <span className="absolute inset-0 overflow-hidden">
                      <MaskIcon
                        src="/figma/icons/kids-sprite.png"
                        className="absolute h-[383.56%] w-[356.16%] max-w-none"
                        color={color}
                        style={{
                          left: gender.sprite.left,
                          top: gender.sprite.top,
                          WebkitMaskSize: "100% 100%",
                          maskSize: "100% 100%",
                        }}
                      />
                    </span>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
