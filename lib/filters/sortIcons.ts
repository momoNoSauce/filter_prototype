import type { SortId } from "./engine";

/**
 * The five Sort glyphs, from Figma `688:1687` (`SortbyIcon`).
 *
 * They are **drawn as a set at one weight**, so anything showing the sort
 * options takes all five from here and borrows nothing: `recent` used to stand
 * in `tag.svg` and `popularity` used to take the PLP's heavier `trend-up.svg`,
 * and that is what this map exists to prevent recurring.
 *
 * It lives in `lib/` rather than beside the Sort sheet because there are now
 * two surfaces that draw these — the sheet in A–D, and the Filters screen's
 * Sort By panel on `/userjourney` (2026-08-28). A map owned by one of the two
 * would make the other import from a sibling it has nothing else to do with.
 *
 * `sort-percent.svg` currently matches the library's `percent.svg` byte for
 * byte and is still its own file: the set is the unit that gets reweighted, so
 * a redraw lands in one place rather than depending on a coincidence between
 * two glyphs with different owners.
 *
 * They render through `MaskIcon`, which reads only the alpha channel, so the
 * black exports still tint to primary on an active row.
 */
export const SORT_ICONS: Record<SortId, string> = {
  popularity: "/figma/icons/sort-popular.svg",
  recent: "/figma/icons/sort-new.svg",
  price_asc: "/figma/icons/sort-price-low-high.svg",
  price_desc: "/figma/icons/sort-price-high-low.svg",
  margin_desc: "/figma/icons/sort-percent.svg",
};
