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
 * Figma 638:3696 — the tile grid used by Category and Brands. 64px cells, a
 * 48px rounded square and an 11px label.
 *
 * The frames show flat #d9d9d9 placeholders; facets that supply an `image`
 * render it in that square instead, and the grey stays as the backdrop so
 * tiles still look right while an image loads or if one is missing.
 */
export function TileGrid({
  options,
  selected,
  onToggle,
}: {
  options: CountedOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-start gap-[8px] pr-[8px] pl-[14px]">
      {options.map((option) => {
        const isOn = selected.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            aria-pressed={isOn}
            title={`${option.label} (${option.count})`}
            className="flex size-[64px] shrink-0 cursor-pointer flex-col items-center gap-[4px]"
          >
            <span
              className={`relative size-[48px] shrink-0 overflow-hidden rounded-[8px] bg-[#d9d9d9] ${
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
            <span
              className={`w-full truncate text-[11px] ${
                isOn ? "font-bold text-primary" : "font-normal text-[#323232]"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
