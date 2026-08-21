import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { COLOURS } from "@/lib/catalog/seed";
import { facetOptionsWithCounts } from "./engine";
import { FACET_BY_ID, getRail } from "./facets";
import { PANEL_VIEWPORT, needsSearch, panelContentHeight } from "./panelFit";

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

  it("charges a stacked panel for its headings", () => {
    // Only "More Filters" stacks facets, and only then are headings rendered.
    const alone = panelContentHeight([{ panel: "checkbox", optionCount: 6 }]);
    const stacked = panelContentHeight([
      { panel: "checkbox", optionCount: 3 },
      { panel: "checkbox", optionCount: 3 },
    ]);
    expect(alone).toBe(6 * 52);
    expect(stacked).toBe(6 * 52 + 2 * 32);
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
