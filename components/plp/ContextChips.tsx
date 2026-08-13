"use client";

import type { ReactNode } from "react";
import type { ContextChip } from "@/lib/filters/contextChips";
import type { CountedOption } from "@/lib/filters/engine";

/**
 * The strip below the GOLD bar. In Variant A it holds only these; in B it
 * follows the Sort and Filter chips, after the divider the frame already draws
 * as the boundary for them.
 *
 * Pinned rather than scrolling with the list, matching `TopChipBar`: the strip
 * rewrites itself as you drill in, and a control that moves off-screen as it
 * changes is worse than no control.
 */
export function ChipStrip({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex w-full items-center gap-[8px] overflow-x-auto bg-white py-[12px] pr-[16px] pl-[8px]">
      {children}
    </div>
  );
}

export function ContextChips({
  chips,
  selections,
  onToggle,
  onOpenPrice,
}: {
  chips: ContextChip[];
  selections: Record<string, string[]>;
  onToggle: (facetId: string, optionId: string) => void;
  /** Passes the chip element so the menu can be anchored under it. */
  onOpenPrice: (anchor: HTMLElement, options: CountedOption[]) => void;
}) {
  return (
    <>
      {chips.map((chip) => {
        if (chip.kind === "price") {
          const chosen = selections.price ?? [];
          return (
            <PriceChip
              key="price"
              options={chip.options}
              chosen={chosen}
              onOpen={(el) => onOpenPrice(el, chip.options)}
            />
          );
        }

        const selected = (selections[chip.facetId] ?? []).includes(chip.option.id);

        if (chip.kind === "vertical") {
          return (
            <VerticalChip
              key={`category:${chip.option.id}`}
              option={chip.option}
              selected={selected}
              onToggle={() => onToggle("category", chip.option.id)}
            />
          );
        }

        return (
          <FilterChip
            key={`${chip.facetId}:${chip.option.id}`}
            label={chip.option.label}
            selected={selected}
            onClick={() => onToggle(chip.facetId, chip.option.id)}
          />
        );
      })}
    </>
  );
}

/**
 * The product-vertical chip — a Material input chip, which is the pattern for
 * an avatar plus a remove.
 *
 * M3 proportions: a 40dp container on an 8dp corner, 1dp outline when
 * unselected, filled and outline-free when selected, a 30dp avatar inset from
 * the leading edge on its own 8dp corner, 14sp Medium label on a single line.
 * Slightly above M3's 32dp container and 24dp avatar, because these avatars
 * are product photography rather than initials and stop reading much below
 * this.
 *
 * **Selected drops the label**, keeping the avatar and the ✕. That makes the
 * chip you're standing in far smaller than the ones you could move to, so the
 * strip reads as "here, and the alternatives" at a glance. It does mean the
 * strip no longer names the vertical in words while you're inside it — the
 * photo has to carry it.
 *
 * Each state is one button. Unselected it toggles on; selected its only
 * possible action is to leave, so the whole chip removes rather than a 20dp
 * circle — a far better touch target for the same result.
 */
function VerticalChip({
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
      {...(selected
        ? { "aria-label": `Remove ${option.label}` }
        : { role: "checkbox", "aria-checked": false })}
      className={`flex h-[40px] shrink-0 cursor-pointer items-center gap-[8px] rounded-[8px] pl-[5px] ${
        selected ? "bg-primary-subtle pr-[8px]" : "border border-[#4d4d4d] bg-white pr-[12px]"
      }`}
    >
      <span className="size-[30px] shrink-0 overflow-hidden rounded-[8px] bg-[#d9d9d9]">
        {option.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" loading="lazy" className="size-full object-cover" src={option.image} />
        )}
      </span>

      {selected ? (
        <span
          aria-hidden
          className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#2e9e42]"
        >
          <svg viewBox="0 0 24 24" className="size-[13px]">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="#fff"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : (
        <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-[#323232]">
          {option.label}
        </span>
      )}
    </button>
  );
}

/**
 * Price: one chip opening a dropdown over the bands, rather than a chip each.
 *
 * The label carries the state so the closed chip still says what's applied —
 * the band's own name when one is picked, a count beyond that.
 */
function PriceChip({
  options,
  chosen,
  onOpen,
}: {
  options: CountedOption[];
  chosen: string[];
  onOpen: (anchor: HTMLElement) => void;
}) {
  const selected = chosen.length > 0;
  const label =
    chosen.length === 1
      ? (options.find((o) => o.id === chosen[0])?.label ?? "Price")
      : chosen.length > 1
        ? `Price (${chosen.length})`
        : "Price";

  return (
    <button
      onClick={(e) => onOpen(e.currentTarget)}
      aria-haspopup="menu"
      className={`flex h-[32px] shrink-0 cursor-pointer items-center gap-[4px] rounded-[8px] pr-[8px] pl-[16px] ${
        selected ? "bg-primary-subtle" : "border border-[#4d4d4d] bg-white"
      }`}
    >
      <span
        className={`text-[14px] leading-[20px] font-medium whitespace-nowrap ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
      <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" aria-hidden>
        <path
          d="M7 10l5 5 5-5"
          fill="none"
          stroke={selected ? "var(--color-primary)" : "#323232"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Material 3 filter chip — the three offer chips.
 *
 * Spec followed: 32dp high, 8dp corner, 1dp outline when unselected, filled
 * container with no outline when selected, an 18dp leading checkmark on
 * selection, 16dp label padding dropping to 8dp beside the checkmark, 14sp
 * Medium label, 8dp between chips.
 *
 * The palette is this app's rather than M3's, and the 8dp corner sits beside
 * `TopChipBar`'s fully-rounded Figma pills in Variant B — following the M3
 * instruction, but a visible mismatch and one line to reverse.
 */
function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      className={`flex h-[32px] shrink-0 cursor-pointer items-center gap-[8px] rounded-[8px] pr-[16px] ${
        selected ? "bg-primary-subtle pl-[8px]" : "border border-[#4d4d4d] bg-white pl-[16px]"
      }`}
    >
      {selected && (
        <svg viewBox="0 0 18 18" className="size-[18px] shrink-0" aria-hidden>
          <path
            d="M3.5 9.5l3.5 3.5 7.5-7.5"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span
        className={`text-[14px] leading-[20px] font-medium whitespace-nowrap ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * The Price dropdown: a Material menu anchored under its chip.
 *
 * It renders at the screen root rather than inside the strip, because the
 * strip scrolls horizontally under `overflow-x-auto`, which would clip a
 * child menu. `left` and `top` are measured against the root when it opens.
 *
 * Each tap applies immediately — matching the chips beside it, which also
 * commit on tap — so there is no Apply button.
 */
export function PriceMenu({
  options,
  chosen,
  left,
  top,
  onToggle,
  onClose,
}: {
  options: CountedOption[];
  chosen: string[];
  left: number;
  top: number;
  onToggle: (optionId: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 z-40 cursor-default"
      />
      <div
        role="menu"
        style={{ left, top }}
        className="absolute z-50 w-[180px] overflow-hidden rounded-[8px] border border-[#dedede] bg-white py-[4px] shadow-[0px_4px_12px_rgba(0,0,0,0.18)]"
      >
        {options.map((option) => {
          const on = chosen.includes(option.id);
          return (
            <button
              key={option.id}
              role="menuitemcheckbox"
              aria-checked={on}
              onClick={() => onToggle(option.id)}
              className="flex h-[40px] w-full cursor-pointer items-center gap-[8px] px-[12px] text-left"
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-[3px] ${
                  on ? "bg-primary" : "border-[1.5px] border-[#767676] bg-white"
                }`}
              >
                {on && (
                  <svg viewBox="0 0 20 20" className="size-[13px]" aria-hidden>
                    <path
                      d="M4 10.5l4 4 8-8"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                className={`flex-1 truncate text-[14px] ${
                  on ? "font-medium text-primary" : "text-[#323232]"
                }`}
              >
                {option.label}
              </span>
              <span className="shrink-0 text-[12px] text-muted">{option.count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
