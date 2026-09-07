"use client";

import { useState } from "react";

import type { CountedOption } from "@/lib/filters/engine";
import { MaskIcon } from "@/components/ui/MaskIcon";

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
  disabled = false,
}: {
  option: CountedOption;
  selected: boolean;
  onToggle: () => void;
  /**
   * Another control on the same facet is holding the answer, so this one is
   * out of play. Today only the price bands, while a min/max range is typed —
   * the mirror of that range being disabled while a band is ticked.
   */
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      disabled={disabled}
      className="flex h-[52px] w-full shrink-0 cursor-pointer items-center pr-[16px] pl-[14px] text-left disabled:cursor-not-allowed disabled:opacity-40"
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

/**
 * A facet option as a **row with its picture**, for Category and Brands
 * (2026-09-03, on request: *"it should be in column view — box, image, name"*).
 *
 * It replaces the tile grid on both facets. `TileGrid` is Figma `638:3696` and
 * is left standing below with no caller, this being the third layout call this
 * week; what it cost to leave is one component nothing imports.
 *
 * **Why a row reads better here than a tile.** The grid gave three cells across
 * a 240px panel, so a name had to fit ~72px and set as up to three clamped
 * lines under a 56px square — `Men's Casual T-Shirts` in three stacked
 * fragments. A row gives the name the panel's full width on one line, and it
 * restores two things the grid had to drop: the **count**, which every other
 * row in this screen carries and the tile could only put in a `title`
 * attribute, and one scanning direction — a buyer reading down a rail of rows
 * no longer switches to reading across a grid when they reach these two.
 *
 * **60px, not `OptionRow`'s 52.** The picture sets the height: 44px of
 * thumbnail plus 8px above and below. 44 is the same figure the contextual
 * chips settled on for a legible thumbnail, and the row clears the touch floor
 * with room to spare. `panelFit` carries it as `THUMB_ROW_H` — a height in the
 * markup with no figure there is what that module exists to prevent.
 *
 * **The checkbox carries the selection, not a ring or a veil.** The tile needed
 * both because it had no box; here the row is the same shape as every other
 * multi-select row on the screen, so it states itself the same way — box
 * filled, label primary. Colour's dot is the precedent: a leading ornament that
 * doesn't restate what the box already says.
 *
 * Brands have no logos — Clearbit is retired and Wikimedia returned unrelated
 * files for seven of eight — so their box stays the frame's flat `#d9d9d9`, as
 * it did in the grid. The grey is the backdrop in both cases, so a row still
 * looks right while an image loads or if one is missing.
 */
export function ThumbRow({
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
      className="flex h-[60px] w-full shrink-0 cursor-pointer items-center pr-[16px] pl-[14px] text-left"
    >
      <Checkbox checked={selected} />
      <span
        // The tile's own corner, kept proportional: 9.333 of 56 is 16.667%,
        // which on a 44px box is 7.33 — so the two layouts round their pictures
        // by the same rule rather than by two hand-picked radii.
        className="ml-[8px] size-[44px] shrink-0 overflow-hidden rounded-[16.667%] bg-[#d9d9d9]"
      >
        {option.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" loading="lazy" className="size-full object-cover" src={option.image} />
        )}
      </span>
      {/*
        **Two lines, wrapped — not truncated.** The panel is 240px at the design
        width and this row spends 110 of it on the box, the picture and the
        insets, so the name has ~130px. On one truncated line that gave
        `Women's T-…` and, worse, `Men's Casu…` for *both* Men's Casual Shirts
        and Men's Casual T-Shirts — two rows reading identically, which is a
        worse failure than the three-line clamp the tile grid had.

        The count rides in the same text run rather than pinned to the right, so
        it wraps with the name instead of taking 46px off every row. Two lines
        at 20px is 40px, inside the 44px the thumbnail already sets, so the row
        height doesn't move and `panelFit`'s figure holds.
      */}
      <span
        className={`ml-[8px] line-clamp-2 min-w-0 flex-1 text-[15px] leading-[20px] ${
          selected ? "font-medium text-primary" : "text-[#323232]"
        }`}
      >
        {option.label} ({option.count})
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
 * Figma 638:3696 (frame "Category") — the tile grid Category and Brands used
 * until 2026-09-03, when both moved to `ThumbRow` above on request.
 *
 * **No caller today.** Kept for the reason the frame is the design of record and
 * this is the third layout decision of the week: it is one unimported
 * component, and the geometry below — a proportional square, a reserved
 * three-line label box, `auto-fill` columns — is the answer for any tile
 * surface that comes back. Delete it if a month passes without one.
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

/**
 * A Sort By row in the Filters panel — `/userjourney` only (2026-08-28).
 *
 * Single-select, so it carries **no checkbox**: every other row in this panel
 * is a checkbox because every other facet is multi-select, and a checkbox on a
 * radio control would promise a second tick the list can't hold. It takes the
 * Sort sheet's own treatment instead — the glyph leads, and the active row is
 * bold, primary, and tints its icon, which is the three-part active state
 * already documented for Sort.
 *
 * The height is `OptionRow`'s 52px rather than the sheet's, so the panel keeps
 * one row pitch whichever rail entry is open.
 */
export function SortRow({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className="flex h-[52px] w-full shrink-0 cursor-pointer items-center gap-[10px] pr-[16px] pl-[14px] text-left"
    >
      <MaskIcon
        src={icon}
        className="size-[20px] shrink-0"
        color={selected ? "var(--color-primary)" : "#323232"}
      />
      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${
          selected ? "font-bold text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * The typed min and max above a range facet's bands on `/userjourney`
 * (2026-08-28, on the stakeholder review: *"we can't predict the exact range
 * the customer might be looking for"*).
 *
 * **Three facets since 2026-09-03**, on the same argument: Price Range, Margin
 * on MRP and MOQ. What differs between them is only the unit beside the number,
 * so this took a `unit` rather than a copy — a `₹` leading the box for money,
 * a `%` or `pc` trailing it for the other two, since a percent or a quantity is
 * written after its number and a rupee before it. `FilterScreen` holds the map
 * from facet to unit; everything below is shared.
 *
 * **Local text state, committed only when valid.** The obvious build controls
 * both boxes straight from the draft, which is wrong the moment a rule refuses
 * a value: editing `min` to 900 against a max of 450 would be rejected, the
 * draft would keep 150–450, and the box would snap back to `150` under the
 * cursor. So the text is local, `onChange` fires only for a pair the draft can
 * hold, and the effect below re-seeds from the draft when something *else*
 * changes it — ticking a band clears the range, and the boxes have to empty
 * with it.
 *
 * **A ticked band disables the boxes** (asked for the same day). The two were
 * already exclusive — ticking a band cleared whatever was typed — but silently,
 * so the rule was only visible after you had lost your typing to it. Disabled,
 * the exclusivity is stated before it costs anything, and the way back is the
 * band you just ticked, sitting directly below.
 *
 * `disabled` on the inputs rather than a hidden block: a control that vanishes
 * reads as a bug, where a greyed one reads as unavailable. It also keeps the
 * panel's height steady as bands are ticked.
 *
 * **`min > max` is refused rather than applied** (asked for the same day). It
 * used to filter honestly and hand back `Show 0 results`, which is accurate
 * and unhelpful: nothing said *why* zero. Now the draft never takes it, and
 * `onInvalid` fires **on blur** — not on every keystroke, or typing `9` into
 * min against a max of 450 would scold you mid-number.
 *
 * `inputMode="numeric"` rather than `type="number"`: this is a kirana retailer
 * on a mid-range Android, so the numeric keypad matters, while `type="number"`'s
 * spinners, scroll-to-change and locale-dependent parsing do not. Non-digits
 * are stripped on the way in, so a pasted `₹1,200` becomes `1200`.
 */
export function RangeInputs({
  min,
  max,
  unit,
  onChange,
  onInvalid,
  disabled = false,
}: {
  min: string;
  max: string;
  /**
   * What the number is in. `symbol` leads the box when `after` is false and
   * trails it when true; `name` completes the screen-reader label — "Min price
   * per piece", "Max margin on MRP".
   */
  unit: { symbol: string; name: string; after?: boolean };
  /**
   * A finished, valid pair. Fired on **blur**, never per keystroke — see
   * `commit`.
   */
  onChange: (min: string, max: string) => void;
  /** Blurred with min > max. The draft was never given the value. */
  onInvalid: () => void;
  /** A band is ticked on this facet, and the two are exclusive. */
  disabled?: boolean;
}) {
  const [text, setText] = useState({ min, max });

  /*
   * Re-seed when the draft's range changes underneath — Clear Filters, or a
   * band being ticked, which clears the range it is exclusive with.
   *
   * Adjusted **during render** rather than in an effect. React 19 flags
   * `setState` inside an effect as a cascading render, and it would also paint
   * the stale value for a frame first; this is the documented
   * derive-from-props pattern and React re-runs the component before touching
   * the DOM. `seen` is what makes it fire on a genuine prop change only — the
   * invalid case never reaches the draft, so the props don't move and the text
   * the buyer typed survives.
   */
  const [seen, setSeen] = useState({ min, max });
  if (seen.min !== min || seen.max !== max) {
    setSeen({ min, max });
    setText({ min, max });
  }

  const inverted = (a: string, b: string) => a !== "" && b !== "" && Number(a) > Number(b);

  /*
   * **Typing changes nothing but the text** (2026-09-07, closing UX backlog
   * item 13).
   *
   * It used to commit on every keystroke that wasn't inverted, and because
   * `inverted` is false whenever either box is empty, the first box filled
   * always committed: typing `900` into an empty min applied `9-`, then `90-`,
   * then `900-`, so the footer fell to `Show 0 results` — and a dot appeared on
   * the rail row — before the max had been touched. Every route into a filled
   * inverted pair therefore left the facet already holding something, which
   * made the **designed** refusal state unreachable: both boxes red, a toast
   * naming the rule, and the count *untouched* (the Figma handoff's screen 05).
   *
   * So the draft is written on blur, which is the earliest moment the buyer has
   * said they are finished with a box. A range is legitimately one-ended —
   * `150-` is a floor, `-450` a ceiling — so "finished" cannot mean "both boxes
   * filled"; it can only mean the box lost focus. Tabbing from min to max
   * commits the floor alone, which is a pair the buyer typed rather than a
   * prefix of one.
   *
   * Two things fall out of it, both wanted. The count no longer moves while a
   * number is being typed, so the listing stops flickering through the answers
   * to ranges nobody asked for. And the ✕ and `Show N results` both blur the
   * box before their own handler runs, so a typed value still commits on the
   * way out — the discard toast keeps working, because the draft did change.
   */
  const commit = () => {
    if (disabled) return;
    // Nothing to say and nothing to write: the props already hold this pair.
    if (text.min === min && text.max === max) return;
    if (inverted(text.min, text.max)) {
      onInvalid();
      return;
    }
    onChange(text.min, text.max);
  };

  return (
    <div className="flex w-full items-center gap-[8px] px-[14px] pt-[6px] pb-[12px]">
      <Field
        label="Min"
        unit={unit}
        value={text.min}
        placeholder="0"
        disabled={disabled}
        // Never invalid while disabled: the boxes aren't being edited, and a
        // red border on a control nobody can fix is an error with no exit.
        // Red as soon as the pair reads back to front, where the toast waits
        // for the blur: the border is a description of what is on screen, and
        // the toast is an interruption.
        invalid={!disabled && inverted(text.min, text.max)}
        onChange={(next) => setText({ min: next, max: text.max })}
        onBlur={commit}
      />
      <span className={`shrink-0 text-[15px] ${disabled ? "text-[#c4c4c4]" : "text-muted"}`}>
        –
      </span>
      <Field
        label="Max"
        unit={unit}
        value={text.max}
        placeholder="Any"
        disabled={disabled}
        invalid={!disabled && inverted(text.min, text.max)}
        onChange={(next) => setText({ min: text.min, max: next })}
        onBlur={commit}
      />
    </div>
  );
}

/** One of the two boxes: the unit and the number inside a 44px bordered field. */
function Field({
  label,
  unit,
  value,
  placeholder,
  invalid,
  disabled,
  onChange,
  onBlur,
}: {
  label: string;
  unit: { symbol: string; name: string; after?: boolean };
  value: string;
  placeholder: string;
  invalid: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const symbol = (
    <span
      aria-hidden
      className={`shrink-0 text-[15px] ${disabled ? "text-[#c4c4c4]" : "text-[#323232]"}`}
    >
      {unit.symbol}
    </span>
  );
  return (
    <label
      className={`flex h-[44px] min-w-0 flex-1 items-center gap-[4px] rounded-[8px] border px-[10px] ${
        disabled
          ? "border-[#dedede] bg-[#f7f7f7]"
          : // Both boxes carry the invalid state: which one is "wrong" depends
            // on which the buyer meant to change, and the app doesn't know.
            invalid
            ? "border-[#d93025]"
            : "border-[#4d4d4d]"
      }`}
    >
      <span className="sr-only">{`${label} ${unit.name}`}</span>
      {!unit.after && symbol}
      <input
        value={value}
        inputMode="numeric"
        placeholder={placeholder}
        // Digits only, so a pasted "₹1,200" lands as 1200 rather than being
        // rejected — and the draft never holds something the URL can't carry.
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onBlur={onBlur}
        aria-invalid={invalid}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[#323232] outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:text-[#a1a1a1] disabled:placeholder:text-[#c4c4c4]"
      />
      {unit.after && symbol}
    </label>
  );
}
