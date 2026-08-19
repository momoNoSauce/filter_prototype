"use client";

import type { CountedOption } from "@/lib/filters/engine";

/**
 * Figma 644:4163 — a facet option row. 52px tall, a 20px box at x=14, label at
 * x=42, and the count trailing the label.
 *
 * Every non-tile facet uses this, including the range buckets and colour: the
 * designs only ever show this one row type, so inventing sliders or swatch
 * grids alongside it would add vocabulary the design system doesn't have. The
 * colour dot is the single addition, sitting between box and label.
 */
export function OptionRow({
  option,
  selected,
  onToggle,
}: {
  option: CountedOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className="flex h-[52px] w-full shrink-0 cursor-pointer items-center pr-[16px] pl-[14px] text-left"
    >
      <Checkbox checked={selected} />
      {option.hex && (
        <span
          className="ml-[8px] size-[16px] shrink-0 rounded-full border border-black/15"
          style={{ backgroundColor: option.hex }}
        />
      )}
      <span
        className={`ml-[8px] flex min-w-0 flex-1 items-center gap-[4px] text-[14px] ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        <span className="truncate">{option.label}</span>
        <span className="shrink-0">({option.count})</span>
      </span>
    </button>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-[20px] shrink-0 items-center justify-center rounded-[3px] ${
        checked ? "bg-primary" : "border-[1.5px] border-[#767676] bg-white"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 20 20" className="size-[14px]" aria-hidden>
          <path
            d="M4 10.5l4 4 8-8"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Figma 638:3696 (frame "Category") — the tile grid used by Category and Brands.
 *
 * 68 x 96 cells, a 56px rounded square (radius 9.333), 4px gaps, 14px left
 * inset. Three fit across the 240px panel.
 *
 * The label block is a fixed 36px — two lines, reserved whether or not the
 * label needs them. That's deliberate: a facet's labels vary in length, and
 * letting the box grow with the text would leave the tiles on a row sitting at
 * different heights. Long labels clamp at two lines rather than truncating on
 * one, so "Men's Casual T-Shirts" stays readable.
 *
 * The frames show flat #d9d9d9 placeholders; facets that supply an `image`
 * render it in that square instead, and the grey stays as the backdrop so
 * tiles still look right while an image loads or if one is missing.
 *
 * Two layouts, because only one of the two surfaces is designed:
 *
 * - `fixed` — the frame exactly: 68px cells, 4px gaps, left-aligned from a
 *   14px inset. Three fit the 240px filter panel with 6px to spare, which is
 *   what Figma draws.
 * - `fill` — cells divide the container evenly instead, with a 64px floor. The
 *   56px square, the 4px gaps and the 36px label box are untouched; only the
 *   cell's spare width moves.
 *
 * **`fill` has no caller.** It was built for the Category sheet, which was
 * 360px wide and had no frame of its own — left-aligned 68px cells fit four
 * there and stranded an empty column, so filling put five across with no dead
 * edge. That sheet went with A's bottom-bar slot on 2026-08-19. Kept because
 * the geometry is the answer for any wide, undesigned tile surface and is
 * cheap to leave standing; delete it if none appears.
 */
export function TileGrid({
  options,
  selected,
  onToggle,
  layout = "fixed",
}: {
  options: CountedOption[];
  selected: string[];
  onToggle: (id: string) => void;
  layout?: "fixed" | "fill";
}) {
  const fill = layout === "fill";
  return (
    <div
      className={
        fill
          ? // Symmetric insets here, unlike the panel's 14/8 — nothing sits to
            // the side of this grid, so there's no rail to bias away from.
            // 8px insets and a 2px column gap rather than the frame's 14/8 and
            // 4px: they buy back enough width that a five-across cell lands at
            // 67.2px, close enough to the frame's 68 that "Men's Formal
            // Shirts" still wraps to two lines instead of three.
            "grid w-full grid-cols-[repeat(auto-fill,minmax(64px,1fr))] items-start gap-x-[2px] gap-y-[4px] px-[8px]"
          : "flex w-full flex-wrap items-start gap-[4px] pr-[8px] pl-[14px]"
      }
    >
      {options.map((option) => {
        const isOn = selected.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            aria-pressed={isOn}
            title={`${option.label} (${option.count})`}
            className={`flex h-[96px] shrink-0 cursor-pointer flex-col items-center gap-[4px] ${
              fill ? "w-full" : "w-[68px]"
            }`}
          >
            <span
              className={`relative size-[56px] shrink-0 overflow-hidden rounded-[9.333px] bg-[#d9d9d9] ${
                isOn ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {option.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                  src={option.image}
                />
              )}
              {/* Selected: a primary ring, the image veiled in 50% primary,
                  and a white check stamped over it. */}
              {isOn && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/50">
                  <svg viewBox="0 0 24 24" className="size-[24px]" aria-hidden>
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </span>
            {/* Fixed two-line box: the height is reserved even for one-line
                labels, so every tile on a row lines up.

                The reserved height and the clamp must sit on *different*
                elements. Together on one, the explicit 36px wins over the
                clamp's two-line height, so a label needing three lines is
                cropped mid-glyph at 36 of its 39px instead of ellipsised.
                Wrapper reserves the space; inner clamps and ellipsises. */}
            <span className="h-[36px] w-full">
              <span
                className={`line-clamp-2 text-center text-[11px] leading-[13px] ${
                  isOn ? "font-bold text-primary" : "font-normal text-[#323232]"
                }`}
              >
                {option.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
