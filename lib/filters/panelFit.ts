/**
 * Does a facet panel's options run past the fold?
 *
 * The Filters screen used to carry a static `searchable` flag per facet, and
 * every facet that set it fit inside the panel whole — Category 7 tiles,
 * Brands 10, Colour 10, Seller 8, Seller City 8. A search field over a list
 * you can already see spends 56px of the fold to solve nothing, so the flag
 * went on 2026-08-20 and the field is now earned rather than declared: it
 * appears when the options genuinely overflow and goes away again when
 * pruning shortens the list.
 *
 * **Computed from counts, not measured from the DOM.** `scrollHeight >
 * clientHeight` is the literal reading of "below the fold", but the server
 * can't measure: SSR would render no field and the client would add one after
 * hydration, flashing a 56px shift every time a panel opened. Server/client
 * agreement is load-bearing here, so the geometry is arithmetic both sides
 * can do.
 *
 * The constants are the rendered sizes, not estimates. Change a row's height
 * in the markup and it has to change here too — the test pins the pair of
 * thresholds these produce, so a drift shows up as a failure rather than as a
 * search field that appears one row early.
 */

import type { PanelType } from "./facets";

/**
 * The 800px frame less the 49px header (`py-[12px]` around a 24px glyph, plus
 * a 1px border) and the 61px `ActionFooter` (`h-[60px]` plus a 1px border).
 */
export const PANEL_VIEWPORT = 690;

/**
 * The same arithmetic for the **sheet** presentation (`/userjourney`,
 * 2026-08-28): 80% of the 800px frame is 640, less the same 49px header and
 * 61px footer.
 *
 * Computed against the *design* height for the reason `PANEL_VIEWPORT` is —
 * the server has no viewport, and a measured rule would render no field on the
 * server and add one after hydration, which is the 56px shift this module
 * exists to avoid. Exact at 800 and slightly optimistic on a taller phone,
 * where the sheet's 80% is more than 640 and a panel could earn a field it
 * doesn't need. That way round is the cheap one: a search field over a list
 * that happens to fit costs 56px, where the reverse costs a layout shift.
 */
export const SHEET_PANEL_VIEWPORT = 530;

/** `OptionRow` — `h-[52px]`. */
export const OPTION_ROW_H = 52;

/**
 * `TileGrid` — **105px** cells, three across: a 56px tile, a 4px gap and a
 * three-line 45px label box. It was 96 while the label was 11px on two lines;
 * both grew on 2026-08-21 so the label could be read beside its own photo.
 */
export const TILE_ROW_H = 105;
export const TILES_PER_ROW = 3;

/** `SearchField` — `pt-[10px]` + a 31.903px input + `pb-[14px]`, rounded. */
export const SEARCH_FIELD_H = 56;

/** The spacer that stands in for the field when it isn't shown. */
export const PANEL_TOP_SPACER = 10;

/**
 * `PriceRangeInputs` — `pt-[6px]` + a 44px field + `pb-[12px]`.
 *
 * Counted rather than waved through: the price panel is five bands and 62px
 * of boxes, which cannot overflow either fold, but the rule this module keeps
 * is that a height in the markup has a figure here. A block that only some
 * panels carry is passed in as `lead` rather than living in `PanelBlock`,
 * since it is a property of the panel and not of any facet in it.
 */
export const PRICE_INPUTS_H = 62;

/**
 * A facet heading — `pt-[12px]` + a 12px line + `pb-[4px]`. Only "More
 * Filters" stacks enough facets to render them.
 */
export const FACET_HEADING_H = 32;

export type PanelBlock = {
  /**
   * Taken straight off the facet, so this branches on exactly what the screen
   * branches on — `panel === "tile"` renders a `TileGrid` and everything else
   * renders `OptionRow`s. One condition, so the two can't drift apart.
   */
  panel: PanelType;
  /**
   * Options actually rendered: after zero-count pruning, but **before** the
   * search query narrows them. Deciding on the queried list would let the
   * field remove itself from under the cursor as soon as you typed enough to
   * make the remainder fit.
   */
  optionCount: number;
};

/**
 * What the panel's options stand to occupy. The 16px spacer that closes the
 * panel is left out on purpose — it is blank space rather than content, and
 * counting it would push a list that fits exactly onto the wrong side.
 */
export function panelContentHeight(blocks: PanelBlock[]): number {
  const headed = blocks.length > 1;
  return blocks.reduce((total, block) => {
    const body =
      block.panel === "tile"
        ? Math.ceil(block.optionCount / TILES_PER_ROW) * TILE_ROW_H
        : block.optionCount * OPTION_ROW_H;
    return total + body + (headed ? FACET_HEADING_H : 0);
  }, 0);
}

/**
 * Whether the panel earns a search field.
 *
 * At the full-bleed 690 that is **14 checkbox rows** or **19 tiles** — 13 rows
 * come to 686px against the 690 the panel has, and the fourteenth pushes it
 * over. In the 530px sheet it is **11 rows** or **13 tiles**. A test pins both
 * pairs, so changing a row height in the markup without changing it here fails
 * loudly rather than moving a field by one row.
 *
 * Adding the field only ever costs more room than the spacer it replaces, so
 * a list that overflows without it still overflows with it. The answer can't
 * oscillate, which is why one pass over the counts is enough.
 */
export function needsSearch(
  blocks: PanelBlock[],
  viewport: number = PANEL_VIEWPORT,
  /** Fixed height above the options — today only `PRICE_INPUTS_H`. */
  lead: number = 0,
): boolean {
  return PANEL_TOP_SPACER + lead + panelContentHeight(blocks) > viewport;
}
