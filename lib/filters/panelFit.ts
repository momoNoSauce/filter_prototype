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
 * The design frame's height. Every figure in this module is in design pixels
 * for the reason the module exists: the server has no viewport, and below 480px
 * `DeviceFrame` renders edge to edge, so the real frame is `100dvh` and 800
 * only in the phone mockup.
 */
export const FRAME_H = 800;

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

/*
 * Since 2026-09-03 that is the *tallest* the sheet's panel gets: the sheet
 * takes its height from the rail and only reaches 80% once the rail is long
 * enough to ask for it. `sheetPanelViewport` below is the live figure, and this
 * constant is what it returns at `SHEET_MAX_PCT` — which is what the pinned
 * thresholds are measured at.
 */

/** The sheet's own chrome: a 49px header and a 61px footer, as full-bleed. */
export const SHEET_CHROME_H = 110;

/** A rail row — `h-[60px]` in `FilterScreen`. */
export const RAIL_ROW_H = 60;

/**
 * The tallest the sheet ever gets: **80%** of the frame, which is where the
 * whole sheet presentation started on 2026-08-28. Chosen so that what stays
 * visible behind it is a recognisable piece of the listing rather than a strip
 * of grey — at 800px it leaves 160px, which is the app bar, the chip strip and
 * the top of the first card. Much taller and the context the sheet exists to
 * preserve is a sliver.
 *
 * **A ceiling rather than the height, since 2026-09-03.** A fixed 80% left
 * ~110px of white under a seven-row rail, reported as "a weird gap at the
 * bottom of the list": the sheet was as tall outside a vertical, where the
 * journey's rail is seven rows, as inside one, where it is thirteen.
 * `sheetHeightPct` sizes it to the rail and stops here, so a settled vertical
 * gets exactly the sheet that shipped in August and nothing else pays for it.
 */
export const SHEET_MAX_PCT = 80;

/**
 * The shortest, in design pixels. **440** = the 330 a Price Range panel needs
 * whole (62px of boxes over five 52px bands) plus the 110 of chrome. That is
 * the row the sheet opens on in the one route that uses it, so it is the panel
 * that must not arrive already scrolling.
 *
 * It doesn't bind today — the journey's shortest rail is seven rows, which asks
 * for 530 — and exists so a future two-row rail can't hand back a sheet with
 * less room than its own first panel.
 */
export const SHEET_MIN_H = 440;

/**
 * How tall the sheet should be, as a percentage of the frame, for a rail of
 * `railRows` rows (2026-09-03, on the report of dead space below a short rail).
 *
 * **The rail decides, not the open panel.** Sizing to whichever of the two is
 * taller would resize the sheet on every rail tap — Colour's twenty rows would
 * grow it and Category's three would shrink it back, which reads as a stutter
 * rather than as a fit. The rail is the one measurement that holds still while
 * a buyer moves around the screen, and panels scroll inside whatever room it
 * leaves, exactly as they did at a fixed 80%.
 *
 * It *does* move when the rail itself does: ticking a category that settles a
 * vertical adds the six attribute rows to the draft's rail, and the sheet grows
 * with them — 530 → 640 on `/userjourney`. That is the one height change a
 * buyer can cause, and it is the same event that already rearranges the rail
 * under them, so the sheet following it is coherent. `FilterScreen` transitions
 * the height so it reads as growth rather than a jump.
 *
 * A **percentage**, not pixels, for the reason `SHEET_PANEL_VIEWPORT` is
 * computed against the design height: below 480px `DeviceFrame` renders edge to
 * edge, so the frame is `100dvh` on a phone and 800 only in the mockup. The
 * arithmetic is done in design pixels and handed back as a ratio.
 */
export function sheetHeightPct(railRows: number): number {
  const wanted = Math.max(SHEET_CHROME_H + railRows * RAIL_ROW_H, SHEET_MIN_H);
  return Math.min((wanted / FRAME_H) * 100, SHEET_MAX_PCT);
}

/**
 * The panel's fold inside a sheet of that height — `needsSearch`'s viewport.
 *
 * Rounded before the chrome comes off, because the percentage is a round trip
 * through a division: 440 of 800 is 55%, and 55% of 800 comes back as
 * 440.00000000000006. Every figure in this module is a whole number of design
 * pixels and a threshold compared against a float is a threshold nobody can
 * pin in a test.
 */
export function sheetPanelViewport(pct: number): number {
  return Math.round((pct / 100) * FRAME_H) - SHEET_CHROME_H;
}

/** `OptionRow` — `h-[52px]`. */
export const OPTION_ROW_H = 52;

/**
 * `ThumbRow` — `h-[60px]`: a 44px thumbnail with 8px above and below. Category
 * and Brands, since 2026-09-03.
 */
export const THUMB_ROW_H = 60;

/**
 * `TileGrid` — **105px** cells, three across: a 56px tile, a 4px gap and a
 * three-line 45px label box. It was 96 while the label was 11px on two lines;
 * both grew on 2026-08-21 so the label could be read beside its own photo.
 *
 * **Nothing renders a tile grid today**, Category and Brands having moved to
 * `ThumbRow`. Kept alongside the component itself: the moment a facet declares
 * `panel: "tile"` again, this is the figure it needs.
 */
export const TILE_ROW_H = 105;
export const TILES_PER_ROW = 3;

/** `SearchField` — `pt-[10px]` + a 31.903px input + `pb-[14px]`, rounded. */
export const SEARCH_FIELD_H = 56;

/** The spacer that stands in for the field when it isn't shown. */
export const PANEL_TOP_SPACER = 10;

/**
 * `RangeInputs` — `pt-[6px]` + a 44px field + `pb-[12px]`.
 *
 * Counted rather than waved through: the widest of the three panels that carry
 * it is five bands and 62px of boxes, which cannot overflow either fold, but
 * the rule this module keeps is that a height in the markup has a figure here.
 * A block that only some panels carry is passed in as `lead` rather than living
 * in `PanelBlock`, since it is a property of the panel and not of any facet in
 * it.
 */
export const RANGE_INPUTS_H = 62;

/**
 * A facet heading — `pt-[14px]` + a 22.5px row + `pb-[6px]`, measured at 42.5
 * and carried here as **43**. Rendered by any rail row carrying more than one
 * facet: A–D's *Offers* row, which stacks `hasOffer` and `offers`, and since
 * 2026-09-07 `/userjourney`'s, which stacks the three offer magnitudes and so
 * heads three groups of bands.
 *
 * It was 32 — a 12px line in 13px bold `#767676` — until 2026-09-07, when the
 * headings on that merged panel were reported as not prominent enough. At 15px
 * on `heading`, with the offer's own 20px icon beside it, the row is 22.5px and
 * the block 43.
 */
export const FACET_HEADING_H = 43;

/**
 * The rule and the space above every group but the first — `mt-[8px]` plus a
 * 1px `hairline` border (2026-09-07). The whiteboard drew the merged *All
 * Offers* panel as three boxes, and this is that line.
 */
export const FACET_GROUP_RULE_H = 9;

export type PanelBlock = {
  /**
   * Taken straight off the facet, so this branches on exactly what the screen
   * branches on — `"tile"` a `TileGrid`, `"thumb"` a column of `ThumbRow`s,
   * everything else `OptionRow`s. One condition, so the two can't drift apart.
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
  return blocks.reduce((total, block, i) => {
    const rowH =
      block.panel === "thumb" ? THUMB_ROW_H : block.panel === "tile" ? 0 : OPTION_ROW_H;
    const body = rowH
      ? block.optionCount * rowH
      : Math.ceil(block.optionCount / TILES_PER_ROW) * TILE_ROW_H;
    const chrome = headed ? FACET_HEADING_H + (i > 0 ? FACET_GROUP_RULE_H : 0) : 0;
    return total + body + chrome;
  }, 0);
}

/**
 * Whether the panel earns a search field.
 *
 * At the full-bleed 690 that is **14 checkbox rows**, **12 thumbnail rows** or
 * **19 tiles** — 13 checkbox rows come to 686px against the 690 the panel has,
 * and the fourteenth pushes it over. In the 530px sheet it is **11 rows**, **9
 * thumbnail rows** or **13 tiles**. A test pins all of them, so changing a row
 * height in the markup without changing it here fails loudly rather than moving
 * a field by one row.
 *
 * Neither facet that renders thumbnail rows reaches those numbers today —
 * Category is seven and Brands ten — so the field they earn is theoretical, in
 * the same way the tile thresholds were. It is here because the arithmetic is
 * what this module promises, not because a panel is waiting on it.
 *
 * Adding the field only ever costs more room than the spacer it replaces, so
 * a list that overflows without it still overflows with it. The answer can't
 * oscillate, which is why one pass over the counts is enough.
 *
 * **A panel of nothing but bands never earns one**, however tall it runs
 * (2026-09-07). The field searches option *labels*, which is what makes it
 * worth 56px over twenty colour names — and worthless over `₹200 – ₹400`,
 * where typing `200` matches two neighbouring bands and a percentage. Bands are
 * a short ordered vocabulary a buyer reads rather than hunts through, and the
 * one panel this can reach is the journey's merged *Offers* row: three groups
 * of four, 730px of them, where a field would cost another 56 and answer
 * nothing. A panel that mixes bands with a list of names still earns one, and
 * the bands' height still counts toward it.
 */
export function needsSearch(
  blocks: PanelBlock[],
  viewport: number = PANEL_VIEWPORT,
  /** Fixed height above the options — today only `RANGE_INPUTS_H`. */
  lead: number = 0,
): boolean {
  if (blocks.every((block) => block.panel === "range")) return false;
  return PANEL_TOP_SPACER + lead + panelContentHeight(blocks) > viewport;
}
