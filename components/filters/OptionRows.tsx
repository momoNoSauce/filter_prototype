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
        className={`ml-[8px] flex min-w-0 flex-1 items-center gap-[4px] text-[15px] ${
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
}: {
  options: CountedOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    /*
      **One responsive grid** (2026-08-21), where there were two fixed layouts.
      `auto-fill` with a 72px floor and `1fr` columns lands on the frame's three
      across at the designed 240px panel — 10 + 72×3 + 3×2 + 6 = 238 of 240 — and
      spreads to fill anything wider, which is what a phone that isn't 360px needs:
      `DeviceFrame` renders edge to edge below 480px, so a 430px screen gives the
      panel 310px, and fixed 72px cells left 70px of dead white beside the tiles.

      Columns stretch rather than multiply at these widths — three 96px cells at
      430px, not four 72px ones — which is the better half of the trade, since the
      extra width goes to the label that was the reason for widening the cell in
      the first place. The tile itself stays the designed 56px, centred.

      The insets are the frame's 14/8 less 4px each, and the gap its 4 less one:
      that is what bought the cell 68 → 72 when the label went to 13px.

      The old `layout="fill"` variant went with this: it existed for the 360px
      Category sheet, which was deleted with A's bar slot, and a grid that already
      fills its container is the thing it was holding the door open for.
    */
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(72px,1fr))] items-start gap-x-[3px] gap-y-[4px] pr-[6px] pl-[10px]">
      {options.map((option) => {
        const isOn = selected.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => onToggle(option.id)}
            aria-pressed={isOn}
            title={`${option.label} (${option.count})`}
            // Height is content, not a constant: the tile is square and tracks
            // the column, so a fixed 105 would clip the label the moment a
            // wider phone grew the cell. At the design width it comes to
            // 56.67 + 4 + 45 ≈ 105, which is what `panelFit` still assumes.
            className="flex w-full cursor-pointer flex-col items-center gap-[4px]"
          >
            <span
              // **The column less 16px**, square (2026-08-21): the frame's flat
              // 56px left 20px of air either side of a photograph once a 430px
              // phone stretched the column to 96, which is what prompted this.
              // `calc(100% - 16px)` is 8px of breathing room either side, and it
              // lands on 56.67 at the designed 72.67 column — the frame's 56
              // within a subpixel — so the 360px rendering is unchanged and only
              // wider phones see a bigger tile.
              //
              // The radius goes proportional with it: 9.333 of 56 is 16.667%,
              // exactly the frame's corner at the design width and the same
              // corner at any other.
              className={`relative aspect-square w-[calc(100%-16px)] shrink-0 overflow-hidden rounded-[16.667%] bg-[#d9d9d9] ${
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
            {/* Fixed **three**-line box: the height is reserved even for
                one-line labels, so every tile on a row lines up.

                The reserved height and the clamp must sit on *different*
                elements. Together on one, the explicit height wins over the
                clamp's line count, so a label needing another line is cropped
                mid-glyph instead of ellipsised. Wrapper reserves the space;
                inner clamps and ellipsises.

                **13px since 2026-08-21**, up from the 11px the 2026-08-20 type
                pass had to leave alone — the label read as small next to its own
                photograph, which was the complaint. 11px was tuned to the
                frame's 68px cell: `Men's Formal` measures ~66px there and
                clears 68 at 12px, so the third word went to a third line and a
                two-line clamp ellipsised it. Raising the type therefore meant
                changing the grid, as the note here said it would — the cell took
                4px off the insets and gap to reach 72, and the box grew to three
                lines. Nothing clamps now: `Men's Formal Shirts` sets as three
                short lines rather than two truncated ones, which is the reading
                the photo can't supply on its own. */}
            <span className="h-[45px] w-full">
              <span
                className={`line-clamp-3 text-center text-[13px] leading-[15px] ${
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
