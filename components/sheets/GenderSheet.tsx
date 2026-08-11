"use client";

import { useState } from "react";
import { Sheet, SheetRow } from "@/components/ui/Sheet";
import { ActionFooter } from "@/components/ui/ActionFooter";
import { MaskIcon } from "@/components/ui/MaskIcon";

/**
 * Figma 644:4470. Multi-select with a Clear/Apply footer, editing a draft that
 * only commits on Apply.
 *
 * It writes to the same `gender` facet the Filters screen exposes under More
 * Filters, so the two stay in sync.
 *
 * The frames show no selected state for these rows, so the selected treatment
 * is borrowed from the Sort sheet — the same component, one screen over.
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
  onApply,
  onClose,
}: {
  value: string[];
  onApply: (next: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(value);

  const toggle = (id: string) =>
    setDraft((current) =>
      current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
    );

  return (
    <Sheet
      title="Gender"
      onClose={onClose}
      footer={
        <ActionFooter
          primaryLabel="Apply"
          clearLabel="Clear all"
          clearDisabled={draft.length === 0}
          onClear={() => setDraft([])}
          onPrimary={() => {
            onApply(draft);
            onClose();
          }}
        />
      }
    >
      <div className="flex w-full flex-col items-start gap-[4px]">
        {GENDERS.map((gender, index) => (
          <SheetRow
            key={gender.id}
            label={gender.label}
            selected={draft.includes(gender.id)}
            last={index === GENDERS.length - 1}
            onClick={() => toggle(gender.id)}
            renderIcon={(color) =>
              "icon" in gender ? (
                <MaskIcon src={gender.icon} className="size-full" color={color} />
              ) : (
                // Boys and Girls are crops of one sprite. Masking the oversized
                // layer inside the clipping box keeps the exact crop geometry
                // while still letting the glyph tint.
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
        ))}
      </div>
    </Sheet>
  );
}
