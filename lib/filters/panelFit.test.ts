import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { COLOURS } from "@/lib/catalog/seed";
import { facetOptionsWithCounts } from "./engine";
import { FACET_BY_ID, getRail } from "./facets";
import {
  FRAME_H,
  PANEL_VIEWPORT,
  RAIL_ROW_H,
  SHEET_CHROME_H,
  SHEET_MAX_PCT,
  SHEET_MIN_H,
  SHEET_PANEL_VIEWPORT,
  needsSearch,
  panelContentHeight,
  sheetHeightPct,
  sheetPanelViewport,
} from "./panelFit";

const catalog = getCatalog();

/** What the open panel would render for a facet, with nothing else selected. */
const block = (facetId: string) => {
  const facet = FACET_BY_ID.get(facetId)!;
  return {
    panel: facet.panel,
    optionCount: facetOptionsWithCounts(catalog, {}, facetId).length,
  };
};

describe("the search field is earned, not declared", () => {
  it("puts the threshold at 14 checkbox rows", () => {
    /*
     * 13 rows come to 676px, which with the 10px spacer is 686 against the
     * 690px the panel has — it fits, just. The fourteenth is what pushes it
     * over. These two assertions are the whole contract; if a row's height
     * changes in the markup without `panelFit.ts` following, this is what
     * fails rather than the field quietly appearing a row early.
     */
    expect(needsSearch([{ panel: "checkbox", optionCount: 13 }])).toBe(false);
    expect(needsSearch([{ panel: "checkbox", optionCount: 14 }])).toBe(true);
  });

  it("puts the threshold at 19 tiles", () => {
    // Three across at 105px, so six rows (18 tiles) fit and the seventh
    // doesn't. It was 22 while the cell was 96px — the label went to 13px on
    // three lines on 2026-08-21 and the row grew with it.
    expect(needsSearch([{ panel: "tile", optionCount: 18 }])).toBe(false);
    expect(needsSearch([{ panel: "tile", optionCount: 19 }])).toBe(true);
  });

  it("puts the threshold at 12 thumbnail rows", () => {
    // Category and Brands since 2026-09-03: one 60px row per option, so 11
    // fit the 690px panel (10 + 660) and the twelfth doesn't. Neither facet
    // gets near it — seven categories and ten brands — so the field is
    // theoretical, exactly as the tile thresholds were.
    expect(needsSearch([{ panel: "thumb", optionCount: 11 }])).toBe(false);
    expect(needsSearch([{ panel: "thumb", optionCount: 12 }])).toBe(true);

    // A row is 60px, not `OPTION_ROW_H`'s 52 — the 44px thumbnail sets it.
    expect(panelContentHeight([{ panel: "thumb", optionCount: 5 }])).toBe(5 * 60);
  });

  it("charges a stacked panel for its headings", () => {
    // Any row carrying more than one facet heads each group: A–D's Offers row,
    // and since 2026-09-07 the journey's three offer magnitudes.
    const alone = panelContentHeight([{ panel: "checkbox", optionCount: 6 }]);
    const stacked = panelContentHeight([
      { panel: "checkbox", optionCount: 3 },
      { panel: "checkbox", optionCount: 3 },
    ]);
    expect(alone).toBe(6 * 52);
    // A 43px heading each, and the 9px rule above the second group — the
    // headings went to 15px on `heading` with the offer's icon beside them on
    // 2026-09-07, measured at 42.5.
    expect(stacked).toBe(6 * 52 + 2 * 43 + 9);
  });

  it("never earns a field for a panel of nothing but bands", () => {
    /*
     * 2026-09-07, with the journey's merged *Offers* row: three facets, four
     * bands each and a heading apiece is 720px, which overflows both folds. A
     * field would cost another 56 and answer nothing — it searches option
     * labels, and typing `200` into `₹200 – ₹400` matches two neighbouring
     * bands and a percentage. Bands are a short ordered vocabulary you read.
     */
    const offers = [
      { panel: "range" as const, optionCount: 4 },
      { panel: "range" as const, optionCount: 4 },
      { panel: "range" as const, optionCount: 4 },
    ];
    expect(panelContentHeight(offers)).toBe(12 * 52 + 3 * 43 + 2 * 9);
    expect(panelContentHeight(offers)).toBeGreaterThan(PANEL_VIEWPORT);
    expect(needsSearch(offers)).toBe(false);
    expect(needsSearch(offers, SHEET_PANEL_VIEWPORT)).toBe(false);

    // A panel that mixes bands with a list of names still earns one, and the
    // bands' height still counts toward it.
    expect(
      needsSearch([
        { panel: "range", optionCount: 4 },
        { panel: "checkbox", optionCount: 11 },
      ]),
    ).toBe(true);
  });

  it("leaves a lone panel unheaded", () => {
    /*
     * The rail row names the panel, in primary, two columns to the left — so a
     * heading over a single facet's options repeats it. An offer magnitude had
     * one for an hour of 2026-09-07, while the three were merged behind *All
     * Offers* and a heading was the only thing telling the groups apart; with a
     * row each it came off again, art and all.
     */
    expect(panelContentHeight([{ panel: "range", optionCount: 4 }])).toBe(4 * 52);
    expect(panelContentHeight([{ panel: "checkbox", optionCount: 20 }])).toBe(20 * 52);
  });

  it("leaves every rail panel but Colour inside the fold", () => {
    /*
     * The point of the change. Five facets used to set `searchable: true` —
     * Category, Brands, Colour, Seller, Seller City — and every one of them
     * fit whole, so the field cost 56px of the fold to search a list already
     * on screen. Colour is the only panel in the app that overflows, and only
     * because it went from ten colours to twenty on 2026-08-20.
     */
    const overflowing = getRail()
      .flatMap((entry) => entry.facetIds)
      .filter((facetId) => needsSearch([block(facetId)]));

    expect(overflowing).toEqual(["colour"]);
  });

  it("hides the field again once pruning shortens the list", () => {
    /*
     * The other half of "earned": a static flag can't do this. Colour needs
     * searching across the catalog and stops needing it once the list is
     * short — Girl's T-Shirts in 12-13Y is 9 products carrying 6 colours, so
     * the field gives its 56px back rather than sitting over a list of six.
     *
     * Note the vertical is what makes the size legal here; a bare `?size=` is
     * ignored.
     */
    const narrow = { category: ["girls-t-shirts"], size: ["12-13y"] };
    const inScope = facetOptionsWithCounts(catalog, narrow, "colour");

    expect(needsSearch([block("colour")])).toBe(true);
    expect(inScope).toHaveLength(6);
    expect(needsSearch([{ panel: "checkbox", optionCount: inScope.length }])).toBe(false);
  });
});

describe("twenty colours", () => {
  it("lists all twenty, none of them empty", () => {
    /*
     * A colour nobody stocks would be hidden by the zero-count rule and the
     * panel would quietly fall back under the threshold, taking the search
     * field with it. Every weight has to earn at least one product.
     */
    expect(COLOURS).toHaveLength(20);
    const options = facetOptionsWithCounts(catalog, {}, "colour");
    expect(options).toHaveLength(20);
    expect(options.every((option) => option.count > 0)).toBe(true);
  });

  it("gives every colour a swatch and a render to fall back on", () => {
    // `hex` draws the 16px dot in the row; `dark` picks between the only two
    // product renders Figma has.
    expect(COLOURS.every((colour) => /^#[0-9a-f]{6}$/.test(colour.hex))).toBe(true);
    expect(COLOURS.every((colour) => typeof colour.dark === "boolean")).toBe(true);
    expect(new Set(COLOURS.map((c) => c.hex)).size).toBe(20);
  });

  it("still sums to the catalog, the extra colours having shifted no draw", () => {
    /*
     * `weightedPick` takes exactly one `rand()` however long the array is, so
     * going from ten colours to twenty moved no other draw. This is the guard
     * on that: every product still has exactly one colour, and they still add
     * up to 1,070.
     */
    const sum = facetOptionsWithCounts(catalog, {}, "colour").reduce(
      (total, option) => total + option.count,
      0,
    );
    expect(sum).toBe(1070);
  });
});

describe("the panel geometry is the rendered geometry", () => {
  it("derives the viewport from the frame, header and footer", () => {
    // 800px frame − 49px header − 61px ActionFooter. Spelled out so a change
    // to any of the three has to be made here as well.
    expect(PANEL_VIEWPORT).toBe(800 - 49 - 61);
  });
});

describe("the sheet presentation's shorter fold", () => {
  // `/userjourney` renders Filters as an 80% bottom sheet (2026-08-28), so the
  // panel is 530px rather than 690 and lists earn a field sooner. Pinned like
  // the full-bleed pair, so changing a row height in the markup without
  // changing panelFit fails here rather than moving a field by one row.
  const rows = (n: number) => [{ panel: "checkbox" as const, optionCount: n }];
  const tiles = (n: number) => [{ panel: "tile" as const, optionCount: n }];

  it("takes 11 checkbox rows, where the full-bleed panel takes 14", () => {
    expect(needsSearch(rows(10), SHEET_PANEL_VIEWPORT)).toBe(false);
    expect(needsSearch(rows(11), SHEET_PANEL_VIEWPORT)).toBe(true);
    // The same counts still fit the full-bleed panel, which is unchanged.
    expect(needsSearch(rows(13))).toBe(false);
    expect(needsSearch(rows(14))).toBe(true);
  });

  it("takes 13 tiles, where the full-bleed panel takes 19", () => {
    expect(needsSearch(tiles(12), SHEET_PANEL_VIEWPORT)).toBe(false);
    expect(needsSearch(tiles(13), SHEET_PANEL_VIEWPORT)).toBe(true);
    expect(needsSearch(tiles(18))).toBe(false);
    expect(needsSearch(tiles(19))).toBe(true);
  });

  it("takes 9 thumbnail rows, where the full-bleed panel takes 12", () => {
    const thumbs = (n: number) => [{ panel: "thumb" as const, optionCount: n }];
    expect(needsSearch(thumbs(8), SHEET_PANEL_VIEWPORT)).toBe(false);
    expect(needsSearch(thumbs(9), SHEET_PANEL_VIEWPORT)).toBe(true);
    expect(needsSearch(thumbs(11))).toBe(false);
    expect(needsSearch(thumbs(12))).toBe(true);
  });

  it("sizes the sheet to its rail, and stops at 80%", () => {
    /*
     * 2026-09-03, on the report of dead space below a short rail. A fixed 80%
     * meant a short rail carried ~110px of white under it. The journey's rail
     * is eight rows outside a vertical and thirteen inside one since the
     * 2026-09-07 re-order, so the arithmetic is pinned generically and the two
     * live cases sit below it.
     */
    const px = (n: number) => Math.round((sheetHeightPct(n) / 100) * FRAME_H);

    // Eight rows: 110 of chrome plus 480 of rail, so 590 of the 800 frame.
    expect(px(8)).toBe(SHEET_CHROME_H + 8 * RAIL_ROW_H);
    expect(sheetHeightPct(8)).toBeCloseTo(73.75);

    // Thirteen rows want 890 and get the ceiling — the sheet a settled
    // vertical has had since 2026-08-28, unchanged.
    expect(sheetHeightPct(13)).toBe(SHEET_MAX_PCT);
    expect(px(13)).toBe(640);

    // Under the floor the panel would have less room than its own first facet.
    expect(px(2)).toBe(SHEET_MIN_H);

    // The panel's fold follows the height, and at the ceiling it is the figure
    // every threshold above is pinned at.
    expect(sheetPanelViewport(SHEET_MAX_PCT)).toBe(SHEET_PANEL_VIEWPORT);
    expect(sheetPanelViewport(sheetHeightPct(8))).toBe(480);
  });

  it("earns a field sooner in a sheet that shrank with its rail", () => {
    // The cost of a shorter sheet, and the reason the viewport is computed
    // rather than assumed: a panel in a seven-row sheet has 420px, not 530.
    const seven = sheetPanelViewport(sheetHeightPct(7));
    expect(needsSearch(rows(8), seven)).toBe(true);
    expect(needsSearch(rows(8), SHEET_PANEL_VIEWPORT)).toBe(false);
  });

  it("defaults to the full-bleed panel when no viewport is given", () => {
    // A–D pass nothing and must be untouched by the sheet's existence.
    expect(needsSearch(rows(13))).toBe(needsSearch(rows(13), PANEL_VIEWPORT));
  });
});
