"use client";

import type { ReactNode } from "react";
import { MaskIcon } from "@/components/ui/MaskIcon";
import type { ContextChip } from "@/lib/filters/contextChips";
import type { CountedOption } from "@/lib/filters/engine";

/**
 * Every chip in the strip is this tall — the verticals, Price, the offers, and
 * `TopChipBar`'s Sort and Filter, which import it. One number rather than four
 * copies of `h-[44px]`, because the row only reads as a row while they agree.
 *
 * 44 rather than the frames' 32 (2026-08-14): the vertical chip's thumbnail is
 * full-bleed, so the chip's height *is* the image size, and 32 was too small to
 * identify a garment. It also puts these controls on the 44px touch floor.
 */
export const CHIP_H = "h-[44px]";

/**
 * The strip below the app bar. In Variant A it holds only these; in B it
 * follows the Sort and Filter chips, after the divider the frame already draws
 * as the boundary for them.
 *
 * Pinned rather than scrolling with the list, matching `TopChipBar`: the strip
 * rewrites itself as you drill in, and a control that moves off-screen as it
 * changes is worse than no control.
 *
 * Everything inside scrolls horizontally as one row, in both variants — B's
 * Sort and Filter chips included. They were briefly pinned at the head of the
 * row; see `TopChipBar` for why that was reversed, and for the sticky trap to
 * avoid if it is ever reinstated.
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
  /** Opens the Price sheet over the bands this strip was built with. */
  onOpenPrice: (options: CountedOption[]) => void;
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
              onOpen={() => onOpenPrice(chip.options)}
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
            icon={OFFER_ICONS[`${chip.facetId}:${chip.option.id}`]}
            selected={selected}
            onClick={() => onToggle(chip.facetId, chip.option.id)}
          />
        );
      })}
    </>
  );
}

/**
 * Figma 674:4904 — the product-vertical chip, both states.
 *
 * Unselected: white, 0.5px #4d4d4d border, label Roboto Medium at `black/90`
 * and 74% opacity — the same label treatment `TopChipBar`'s chips use.
 * Selected: no border, filled, label in primary, and the exported `close_small`
 * glyph beside it.
 *
 * **The whole strip was scaled up on 2026-08-14**, so the thumbnail could be
 * read at a glance: every chip in the row is 44px high rather than the frame's
 * 32, which is also the first time these clear the 44px touch-target floor.
 * `CHIP_H` in this file is the single number — `TopChipBar`'s chip imports it,
 * so B's Sort and Filter cannot drift from the chips they share a row with.
 *
 * The avatar is **square-cropped and full-bleed**, two departures from the
 * frame, which draws it circular at 26.727 × 27.796 inside the chip's 6px
 * inset. It takes the chip's whole height, so it can only fit by losing the
 * inset: it sits flush against the leading edge and `overflow-hidden` on the
 * chip clips its left corners. `object-cover` does the cropping.
 *
 * The label went to 12px with the scale-up — 11px under a 44px thumbnail read
 * as an afterthought. Its box widened to 76px to match, that being where the
 * longest name (*Men's Casual T-Shirts*) still breaks across two lines rather
 * than clamping, which is the same rule the frame's 68px box followed at 11px.
 *
 * Two departures from the raw export, both by the standing rule that the
 * design's off-token blues are slips: the fill comes back as
 * `rgba(21,95,255,0.2)`, which over white is exactly `primary/subtle`
 * (#CCDCFE), and the label and glyph come back as `#0a57ff`, which is
 * `primary` (#004FFA). The glyph ships as an exported asset tinted through
 * `MaskIcon`, since an `<img>` would bake in the slipped hex.
 *
 * The frame keeps the label when selected and adds the ✕ beside it, so that is
 * what this does — it does not drop the label.
 *
 * The corner is **8px** (2026-08-14), a third departure: the frame draws 4px,
 * but a selected vertical sits in the same row as the Price and offer chips,
 * which are M3 filter chips at 8dp, and two radii one gap apart read as a
 * mistake. One radius across the strip, and 8px is the one more chips use.
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
      role="checkbox"
      aria-checked={selected}
      className={`flex ${CHIP_H} shrink-0 cursor-pointer items-center justify-center gap-[6px] overflow-hidden rounded-[8px] pr-[8px] ${
        selected ? "bg-primary-subtle" : "border-[0.5px] border-[#4d4d4d] bg-white"
      }`}
    >
      <span className="size-[44px] shrink-0 overflow-hidden bg-[#d9d9d9]">
        {option.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" loading="lazy" className="size-full object-cover" src={option.image} />
        )}
      </span>

      {/* Two lines deep, as the frame sets it. The box tracks the type size,
          which is the rule the frame's own 68px box followed at 11px: it has to
          be wide enough that the longest vertical name breaks rather than
          clamping. 68 at 11px became 76 at 12px, and **13px wants 82**
          (2026-08-20) — `Men's Casual T-Shirts` is the one that decides it.
          Two lines at 13px is ~31px, still inside `CHIP_H`. */}
      <span
        className={`line-clamp-2 max-w-[82px] text-left text-[13px] leading-[normal] font-medium ${
          selected ? "text-primary" : "text-black/90 opacity-74"
        }`}
      >
        {option.label}
      </span>

      {selected && (
        <MaskIcon
          src="/figma/icons/close-small.svg"
          color="var(--color-primary)"
          className="size-[14px] shrink-0"
        />
      )}
    </button>
  );
}

/**
 * Price: one chip opening a **bottom sheet** over the bands, rather than a chip
 * each. It was an anchored dropdown until 2026-08-20; see `PriceSheet` for why
 * it moved, and note that the chip no longer has to hand its own element up so
 * the overlay can be positioned against it.
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
  onOpen: () => void;
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
      onClick={onOpen}
      aria-haspopup="dialog"
      className={`flex ${CHIP_H} shrink-0 cursor-pointer items-center gap-[4px] rounded-[8px] pr-[10px] pl-[8px] ${
        selected ? "bg-primary-subtle" : "border border-[#4d4d4d] bg-white"
      }`}
    >
      {/* Unlike the offer chips this one has no checkmark to make room for —
          its state is the fill and the label — so the icon stays in both. */}
      <ChipIcon src={PRICE_ICON} />
      <span
        className={`text-[15px] leading-[20px] font-medium whitespace-nowrap ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
      <svg viewBox="0 0 24 24" className="size-[20px] shrink-0" aria-hidden>
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
 * Spec followed: 8dp corner, 1dp outline when unselected, filled container with
 * no outline when selected, a leading checkmark on selection, 16dp label
 * padding dropping to 8dp beside the checkmark, 14sp Medium label, 8dp between
 * chips. **Height departs** — `CHIP_H` at 44 rather than M3's 32dp, because the
 * vertical chips beside these needed the room for their thumbnail and a row of
 * two heights is worse than a row off-spec by one value.
 *
 * The palette is this app's rather than M3's. The 8dp corner used to sit beside
 * `TopChipBar`'s fully-rounded Figma pills in Variant B; that mismatch closed
 * on 2026-08-14 by taking the pills to 8px too, so the whole row is one radius.
 */
/**
 * Leading art for an offer chip, keyed by **facet and option**.
 *
 * Supplied as PNGs rather than exported from Figma, which is why they sit in
 * `public/offers/` and not `public/figma/` — the latter is exports only, and a
 * file's folder should not imply an origin it doesn't have. Both are small
 * enough to have little headroom above the 20px they render at; vectors would
 * be better if any turn up.
 *
 * Both parts of the key, because Seller Offer's option id is the bare `any` —
 * it is the catch-all on its own `hasOffer` facet — and a one-word id like
 * that is exactly the sort another facet acquires later.
 */
const OFFER_ICONS: Record<string, string> = {
  "hasOffer:any": "/offers/seller-offer.png",
  "offers:cashback": "/offers/cashback.png",
  "offers:free-delivery": "/offers/free-delivery.png",
};

const PRICE_ICON = "/offers/price.png";

/**
 * A chip's leading art.
 *
 * A 26px `object-contain` box, not a fixed height: these are different aspects
 * and sizing by height alone left the square ones 20px on their longest edge
 * while the landscape ones reached 26. The longest edge is what the eye
 * compares, so the box equalises that.
 */
function ChipIcon({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className="size-[26px] shrink-0 object-contain" src={src} />;
}

function FilterChip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}) {
  // Material 3: the checkmark *replaces* the leading icon rather than joining
  // it, so a selected chip has one leading element either way and the label
  // never shifts. The 8px inset applies whenever something leads.
  const leading = selected || !!icon;

  return (
    <button
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      // 4px beside the icon, 8px beside the checkmark. The icon is wider than
      // the check and carries its own visual padding, so M3's 8dp read loose
      // on it while being right for the glyph.
      className={`flex ${CHIP_H} shrink-0 cursor-pointer items-center rounded-[8px] pr-[16px] ${
        !selected && icon ? "gap-[4px]" : "gap-[8px]"
      } ${selected ? "bg-primary-subtle" : "border border-[#4d4d4d] bg-white"} ${
        leading ? "pl-[8px]" : "pl-[16px]"
      }`}
    >
      {!selected && icon && <ChipIcon src={icon} />}
      {selected && (
        <svg viewBox="0 0 18 18" className="size-[20px] shrink-0" aria-hidden>
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
        className={`text-[15px] leading-[20px] font-medium whitespace-nowrap ${
          selected ? "text-primary" : "text-[#323232]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
