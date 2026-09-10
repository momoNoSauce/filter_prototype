"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/catalog/types";
import { type Selections, facetOptionsWithCounts } from "@/lib/filters/engine";
import { SIZE_FACET_ID } from "@/lib/filters/activeVariant";
import { STYLE_FACET_ICONS } from "@/lib/filters/styleIcons";
import { MaskIcon } from "@/components/ui/MaskIcon";

/** The category facet's id — the thing a tile actually selects. See below. */
const CATEGORY_FACET_ID = "category";

/**
 * **Find It Fast** — the guided two-step filter at the head of `/pvfilters`
 * (2026-09-09), built from two screengrabs of a competitor's search results
 * rather than from Figma.
 *
 * *Choose category* as three pictures, and once one is picked a second step
 * unfolds under it: *shop by style*. They are the same facets the Filters sheet
 * carries, lifted onto the listing where a buyer will meet them without opening
 * anything — the guided path, against the sheet's exhaustive one.
 *
 * **This is the route's whole reason to exist.** `/userjourney` had the
 * "settling a vertical reveals more filters" behaviour removed the same morning
 * for launch; here it is the point, and made visible instead of hidden behind
 * the Filters button.
 *
 * ---
 *
 * **The tiles are Category, and now say so** (corrected 2026-09-10).
 *
 * They always selected `category`; the heading read *CHOOSE GENDER* and the
 * labels were *Men · Women · Boys*, both copied off the reference screengrab.
 * The excuse was that category → gender is 1:1 here, so tapping *Women* and
 * tapping *Women's T-Shirts* narrow to the same 191 products — but a control
 * named after a facet it does not touch stops being true the moment the catalog
 * gains a second women's vertical, and it was already untrue to anyone reading
 * the URL. The heading is *Choose category* and the labels are
 * `CATEGORIES[].label`, which is also what the Filters panel's own rows show.
 *
 * Category is the right facet to drive, which was never in doubt:
 *
 * - **It is on the rail.** The Filters badge counts it, the Filters panel shows
 *   it ticked, and Clear Filters reaches it — all for free. Gender has no row
 *   on this rail, so driving it would strand a filter the sheet couldn't undo.
 * - **It is what settles the vertical**, which is what unfolds the second step.
 *   A Gender cut settles one too, but through a longer inference; the shorter
 *   statement of the same intent is the category itself.
 *
 * The full names cost the single row of three — see the tile's own note.
 *
 * ---
 *
 * **Drawn in the SOLV tokens, not the reference's pink.** Layout, copy and
 * behaviour are the screengrab's; `primary` and `primary-subtle` replace the
 * purple tab and pink ground, and the selected tile takes the same
 * `border-primary` + primary-bold treatment the Category rows in the Filters
 * panel already use. Two palettes in one prototype is the drift the token rule
 * exists to stop, and nothing here is a Figma export to be preserved.
 *
 * **The second step is a row of buttons, not a list of sizes** (2026-09-09, on
 * request). It began as *choose size*, five tiles of the settled vertical's own
 * size vocabulary; it is now one button per **style filter** — Fit, Neck Type,
 * Sleeve Type, Pattern, Closure Type — each opening the Filters sheet on that
 * facet's own panel.
 *
 * The trade is deliberate: sizes were one facet answered in place, and this is
 * five facets *reached* in one tap each. A guided block earns its space by
 * being the shortest way into the filters a buyer would otherwise hunt for, and
 * five doors beat one answer.
 *
 * **Five, not the six `/pvfilters2` locks.** Size has no row on this rail, so a
 * Size button would open the sheet on Price Range — the rows come from
 * `styleRows`, which reads the rail, so the buttons cannot claim a panel that
 * is not there.
 *
 * **The pictures are line art**, supplied 2026-09-10 and living in
 * `public/style/` — not `public/figma/`, which is for exact Figma exports and
 * these are not. They go through `MaskIcon` rather than an `<img>`: each is one
 * `currentColor` path, which an `<img>` resolves against the file's own context
 * and not the button's.
 *
 * **A facet with no icon keeps the grey box** it had before them — `#d9d9d9`,
 * the placeholder `ThumbRow` shows for a missing image, at exactly the icon's
 * size so the row does not move when one arrives. Pattern is that case today.
 * See `STYLE_FACET_ICONS`.
 */
export function FindItFast({
  products,
  selections,
  settled,
  onPickVertical,
  styles,
  onOpenStyle,
}: {
  /** The page's scope, so the tiles offer only verticals that exist here. */
  products: Product[];
  selections: Selections;
  /**
   * The settled vertical from `settledVertical`, or `null`. **The gate for the
   * second step** — and the same value `getRail` uses, so the block and the
   * Filters sheet unfold together rather than disagreeing about scope.
   */
  settled: string | null;
  /** Tap a gender tile: replaces the category cut, or clears its own. */
  onPickVertical: (categoryId: string) => void;
  /**
   * The style filters to offer once a vertical is settled — `styleRows` for the
   * page's rail, so the buttons and the rail agree about what exists.
   */
  styles: { id: string; label: string }[];
  /** Tap one: opens the Filters sheet with that rail row already showing. */
  onOpenStyle: (railId: string) => void;
}) {
  /*
   * **Counted against everything except the step below it.**
   *
   * `facetOptionsWithCounts` already skips the facet it is counting, so picking
   * *Women* can't zero *Men* — that rule is what keeps a choice undoable. Size
   * needed saying by hand: it is a *different* facet, so it counts, and ticking
   * M and L deleted the **Boys** tile outright, Kartik's kids' tees carrying age
   * bands rather than letters. Measured on the first render of this block; the
   * row went from three tiles to two and reflowed under the buyer's finger.
   *
   * A guided block reads downwards, so each step is counted against the steps
   * *above* it and never below. A price cut made in the Filters sheet is a
   * different surface and still narrows this one — that is an option honestly
   * at zero, not a step eating its own parent.
   */
  const verticals = useMemo(() => {
    const upstream = { ...selections };
    delete upstream[SIZE_FACET_ID];
    return facetOptionsWithCounts(products, upstream, CATEGORY_FACET_ID);
  }, [products, selections]);

  // A storefront with one vertical has nothing to choose between, and the block
  // would be a heading over a single tile you cannot deselect into anything.
  if (verticals.length < 2) return null;

  const chosen = selections[CATEGORY_FACET_ID] ?? [];

  return (
    // No bottom margin: the scroller is a flex column with its own gap, and a
    // margin on top of it made the space under this block half again the space
    // between two cards.
    //
    // **No top padding either** (2026-09-09, on the render): the tab is flush
    // with the card's top edge, as the reference has it, so the padding that
    // used to sit above it is the tab's own business now.
    <div className="w-full shrink-0 rounded-[12px] bg-primary-subtle px-[8px] pb-[10px]">
      {/*
        The reference's tab, in primary. Caps and tracked, as drawn.

        **Attached to the top edge, and rounded on the bottom two corners only.**
        It shipped inset 10px with all four rounded, which read as a chip that
        happened to be near the top; a tab hangs off the edge it belongs to, and
        square top corners are what make it look joined rather than nearly
        touching. It keeps the 8px left inset, which is the card's own padding.
      */}
      {/*
        `flex w-fit`, not `inline-flex`. An inline box sits on a text baseline
        and the line's strut left 4px of card above it — invisible as a rule,
        obvious on a tab whose whole job is to touch the edge. A block-level
        flex box has no strut, so `w-fit` keeps it hugging its label.
      */}
      <span className="flex h-[20px] w-fit items-center rounded-b-[6px] bg-primary px-[8px] text-[11px] font-bold tracking-[0.6px] text-white">
        FIND IT FAST
      </span>

      <Step label="Choose category" />
      {/* Wrapping and content-width, like the style buttons below — see the
          tile's note for why it stopped being a fixed row of three. */}
      <div className="flex flex-wrap gap-[8px]">
        {verticals.map((option) => {
          const selected = chosen.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => onPickVertical(option.id)}
              aria-pressed={selected}
              // `relative` for the check badge, which sits half outside the
              // corner as the reference draws it. The border is on the tile in
              // both states and merely changes colour, so nothing shifts on tap
              // — the same rule `ThumbRow` follows.
              /*
               * **46 high around a 38px picture** — 4px of air top and bottom,
               * against the 8px a 50px tile left around a 34px one, which read
               * as a picture floating in a box. Asked for on the render.
               *
               * **`w-fit`, not `flex-1`** (2026-09-10): the tile is as wide as
               * its name, which is what lets the full category labels in. It
               * was three fixed thirds while the labels were single gender
               * words; *Men's Casual T-Shirts* needs ~135px where *Men* needed
               * 30, and clamping it to `Men's Casu…` in a 103px third is the
               * exact truncation `ThumbRow` exists to fix.
               */
              className={`relative flex h-[46px] w-fit cursor-pointer items-center gap-[6px] rounded-[8px] border bg-white px-[5px] ${
                selected ? "border-primary" : "border-hairline"
              }`}
            >
              <span className="size-[38px] shrink-0 overflow-hidden rounded-[6px] bg-[#d9d9d9]">
                {option.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" loading="lazy" className="size-full object-cover" src={option.image} />
                )}
              </span>
              <span
                className={`pr-[3px] text-left text-[13px] font-bold whitespace-nowrap ${
                  selected ? "text-primary" : "text-heading"
                }`}
              >
                {option.label}
              </span>
              {selected && <Check />}
            </button>
          );
        })}
      </div>

      {/*
        **The second step only exists once a vertical is settled**, which is the
        behaviour the whole route is for. It is the same gate the rail uses, so
        the sheet grows its style rows in the same tap that unfolds this — and
        that is what these buttons open on to.

        `styles.length > 0` as well as `settled`: a rail with no style rows would
        otherwise draw a heading over nothing.
      */}
      {settled && styles.length > 0 && (
        <>
          {/* Full-bleed across the card, so it reads as dividing the two steps
              rather than as a rule inside one of them. */}
          <div className="mt-[10px] -mx-[8px] h-px bg-primary/15" />
          <Step label="Shop by style" />
          {/*
            **A wrapping row of buttons sized to their own labels**, not a
            fixed-column grid.

            Two columns was the first build and it wasted the card: every button
            took half the width whether it said `Fit` or `Closure Type`, so six
            filters cost three rows and the short ones sat in a pool of white.
            Reported on the render. `flex-wrap` with `w-fit` buttons packs
            `Size` and `Fit` beside a long one and lets the block end where its
            content does.

            Wrapping rather than scrolling, as the sizes were: a horizontal
            scroller hides options past the edge with nothing to say they are
            there.
          */}
          <div className="flex flex-wrap gap-[8px]">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => onOpenStyle(style.id)}
                className="flex h-[46px] w-fit cursor-pointer items-center gap-[6px] rounded-[8px] border border-hairline bg-white px-[5px] text-left"
              >
                {/*
                  The icon, or the grey box it replaced where there isn't one
                  yet — same 34px either way, so the buttons stay the same size
                  as the set fills in.
                */}
                {STYLE_FACET_ICONS[style.id] ? (
                  <MaskIcon
                    src={STYLE_FACET_ICONS[style.id]}
                    color="var(--color-heading)"
                    className="size-[34px] shrink-0"
                  />
                ) : (
                  <span className="size-[34px] shrink-0 rounded-[6px] bg-[#d9d9d9]" />
                )}
                {/* No `flex-1` and no `truncate`: the button is as wide as its
                    label, which is the whole point of the wrap. */}
                <span className="pr-[3px] text-[13px] font-bold whitespace-nowrap text-heading">
                  {style.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * A step heading. The reference sets both in the same grey caps, and they are
 * the only two labels in the block, so they share one component rather than two
 * copies of the same four classes.
 */
function Step({ label }: { label: string }) {
  return (
    // 8 above and 6 below, tightened from 10/8 on the same note: the block is
    // three bands of controls and the air between them was reading as four.
    <p className="mt-[8px] mb-[6px] text-[12px] font-medium tracking-[0.6px] text-muted uppercase">
      {label}
    </p>
  );
}

/** The selected tile's badge — filled primary, half outside the corner. */
function Check() {
  return (
    <span className="absolute -top-[6px] -right-[6px] flex size-[16px] items-center justify-center rounded-full bg-primary">
      <svg viewBox="0 0 12 12" className="size-[8px]" aria-hidden>
        <path
          d="M1.5 6.2 4.4 9 10.5 3"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
