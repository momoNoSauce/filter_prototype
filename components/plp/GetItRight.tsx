"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/catalog/types";
import { type Selections, facetOptionsWithCounts } from "@/lib/filters/engine";
import { SIZE_FACET_ID } from "@/lib/filters/activeVariant";
import { CATEGORIES, GENDER_LABEL } from "@/lib/catalog/seed";

/** The category facet's id — the thing a tile actually selects. See below. */
const CATEGORY_FACET_ID = "category";

/**
 * **Get It Right** — the guided two-step filter at the head of `/pvfilters`
 * (2026-09-09), built from two screengrabs of a competitor's search results
 * rather than from Figma.
 *
 * *Choose gender* as three pictures, and once one is picked a second step
 * unfolds under it: *choose size*. It is the same pair of facets the Filters
 * sheet carries, lifted onto the listing where a buyer will meet them without
 * opening anything — the guided path, against the sheet's exhaustive one.
 *
 * **This is the route's whole reason to exist.** `/userjourney` had the
 * "settling a vertical reveals more filters" behaviour removed the same morning
 * for launch; here it is the point, and made visible instead of hidden behind
 * the Filters button.
 *
 * ---
 *
 * **The tiles select `category`, not `gender`**, though the heading says what
 * the reference's says.
 *
 * Category → gender is 1:1 in this catalog (all seven categories name their
 * audience), and Kartik's three tee verticals *are* Men's, Women's and Boy's —
 * so tapping *Women* and tapping *Women's T-Shirts* narrow to the same 191
 * products. Two things make Category the right one to drive:
 *
 * - **It is on the rail.** The Filters badge counts it, the Filters panel shows
 *   it ticked, and Clear Filters reaches it — all for free. Gender has no row
 *   on this rail, so driving it would strand a filter the sheet couldn't undo.
 * - **It is what settles the vertical**, which is what unfolds the size step.
 *   A Gender cut settles one too, but through a longer inference; the shorter
 *   statement of the same intent is the category itself.
 *
 * The label is the gender word because that is what the reference draws, and
 * because *Men* reads better than *Men's Casual T-Shirts* in a 98px tile. The
 * picture is the category's own, the one the Filters panel's rows use.
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
 * **Sizes come from the settled vertical**, counted the way every Size list in
 * this app is: by *applying* each option alone rather than tallying it, since
 * the active pack moves with the cut. `facetOptionsWithCounts` does that; this
 * component must not shortcut it.
 */
export function GetItRight({
  products,
  selections,
  settled,
  onPickVertical,
  onToggleSize,
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
  /** Tap a size tile: multi-select, like every other Size control. */
  onToggleSize: (sizeId: string) => void;
}) {
  const genderOf = useMemo(
    () => new Map(CATEGORIES.map((c) => [c.id, GENDER_LABEL[c.gender]])),
    [],
  );

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

  const sizes = useMemo(
    () => (settled ? facetOptionsWithCounts(products, selections, SIZE_FACET_ID) : []),
    [products, selections, settled],
  );

  // A storefront with one vertical has nothing to choose between, and the block
  // would be a heading over a single tile you cannot deselect into anything.
  if (verticals.length < 2) return null;

  const chosen = selections[CATEGORY_FACET_ID] ?? [];

  return (
    // No bottom margin: the scroller is a flex column with its own gap, and a
    // margin on top of it made the space under this block half again the space
    // between two cards.
    <div className="w-full shrink-0 rounded-[12px] bg-primary-subtle px-[8px] pt-[10px] pb-[12px]">
      {/* The reference's tab, in primary. Caps and tracked, as drawn. */}
      <span className="inline-flex h-[20px] items-center rounded-[4px] bg-primary px-[8px] text-[11px] font-bold tracking-[0.6px] text-white">
        GET IT RIGHT!
      </span>

      <Step label="Choose gender" />
      <div className="flex gap-[8px]">
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
              // 34px picture and 5px of gap and padding, not the 38/6/6 this
              // shipped with: three tiles across 326px leave the label ~50px,
              // and `Women` in 14px Roboto bold is 52 — it truncated to `Wom…`
              // on the very first render. 13px over 34px buys 8px and clears it.
              className={`relative flex h-[50px] min-w-0 flex-1 cursor-pointer items-center gap-[5px] rounded-[8px] border bg-white px-[5px] ${
                selected ? "border-primary" : "border-hairline"
              }`}
            >
              <span className="size-[34px] shrink-0 overflow-hidden rounded-[6px] bg-[#d9d9d9]">
                {option.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" loading="lazy" className="size-full object-cover" src={option.image} />
                )}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-left text-[13px] font-bold ${
                  selected ? "text-primary" : "text-heading"
                }`}
              >
                {genderOf.get(option.id) ?? option.label}
              </span>
              {selected && <Check />}
            </button>
          );
        })}
      </div>

      {/*
        **The second step only exists once a vertical is settled**, which is the
        behaviour the whole route is for. It is the same gate the rail uses, so
        the sheet grows its attribute rows in the same tap that unfolds this.

        `sizes.length > 0` as well as `settled`: a vertical whose products carry
        no size at all would otherwise draw a heading over nothing.
      */}
      {settled && sizes.length > 0 && (
        <>
          {/* Full-bleed across the card, so it reads as dividing the two steps
              rather than as a rule inside one of them. */}
          <div className="mt-[12px] -mx-[8px] h-px bg-primary/15" />
          <Step label="Choose size" />
          {/*
            **A five-column grid, not a wrapping flex row.** Wrapping was the
            first try and `flex-1` made the leftovers grow: Kartik's women's tees
            run XS–3XL, so the second row was `2XL` and `3XL` at half the frame
            each, which reads as two buttons of a different kind. A grid keeps
            every tile the width of the first row's, whatever the vocabulary —
            and five across is what the reference draws.

            Wrapping rather than scrolling either way: a horizontal scroller
            hides options past the edge with nothing to say they are there.
          */}
          <div className="grid grid-cols-5 gap-[8px]">
            {sizes.map((option) => {
              const selected = (selections[SIZE_FACET_ID] ?? []).includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => onToggleSize(option.id)}
                  aria-pressed={selected}
                  className={`h-[44px] cursor-pointer rounded-[8px] border text-[15px] font-bold ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-hairline bg-white text-heading"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
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
    <p className="mt-[10px] mb-[8px] text-[12px] font-medium tracking-[0.6px] text-muted uppercase">
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
