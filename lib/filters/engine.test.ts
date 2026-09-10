import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { getKartikCatalog } from "@/lib/catalog/kartik";
import { CATEGORIES } from "@/lib/catalog/seed";
import {
  applyFilters,
  clearSelections,
  countMatching,
  countSelections,
  discriminatingOptions,
  facetOptionsWithCounts,
  sameSelections,
  sortProducts,
  toggleSelection,
  type Selections,
} from "./engine";
import { buildQuery, parseSelections, parseSort } from "./urlState";
import { contextChips } from "./contextChips";
import {
  FACET_BY_ID,
  FILTER_VERTICALS,
  getRail,
  parseTypedRange,
  getRailFacetIds,
  settledVertical,
  singleValuedFacets,
  styleRows,
  TYPED_RANGE_FACET_IDS,
} from "./facets";
import { defaultVariant, type Product } from "@/lib/catalog/types";
import { activeVariant, activeVariantIndex, sizeOptionId } from "./activeVariant";
import { PV_FACET_IDS, dropOrphanedSelections } from "./facets";
import { verticalRoutes, verticalScope } from "@/lib/catalog/scope";
import { CATEGORIES as CATS } from "@/lib/catalog/seed";

const catalog = getCatalog();

describe("catalog", () => {
  it("generates the 1,070 products the design's footer count implies", () => {
    expect(catalog).toHaveLength(1070);
  });

  it("is deterministic across calls", () => {
    expect(getCatalog()[500].title).toBe(catalog[500].title);
  });

  it("gives every product at least two packs so the pills are meaningful", () => {
    expect(catalog.every((p) => p.variants.length >= 2)).toBe(true);
  });

  it("keeps category and gender consistent — the labels name their audience", () => {
    const genderOf = new Map(CATEGORIES.map((c) => [c.label, c.gender]));
    expect(catalog.every((p) => genderOf.get(p.category) === p.gender)).toBe(true);
  });

  it("does not repeat the gender in a title", () => {
    // "… Casual T-Shirts for Boys", never "… Boy's Casual T-Shirts for Boys".
    expect(catalog.some((p) => /Boy's|Girl's|Men's|Women's/.test(p.title))).toBe(false);
  });

  it("breaks every pack down into quantities that sum to its set size", () => {
    // The card shows `SET OF 6` over `M/2, L/2, XL/2`, and a retailer reads the
    // second line to work out what arrives in the carton. A breakup that does
    // not add up to the first line is a wrong answer to that question — which
    // the pre-2026-08-14 shapes gave, `2XL` standing for a set of ten.
    const wrong = catalog
      .flatMap((p) => p.variants)
      .filter((v) => {
        const total = v.sizeBreakup
          .split(",")
          .reduce((sum, part) => sum + Number(part.split("/")[1]), 0);
        return total !== v.setOf;
      });

    expect(wrong).toEqual([]);
  });

  it("writes every pack breakup as size/qty", () => {
    // The live app's notation. Three earlier ones had drifted apart — bare
    // repetition (`S,S`), a multiplier (`M×2`), and a bare size (`2XL`).
    // The hyphen is for kids' age bands — `4-5Y/2` — which are sizes here in
    // exactly the way `2XL` is.
    const shape = /^[A-Z0-9-]+\/\d+(, [A-Z0-9-]+\/\d+)*$/;
    expect(catalog.flatMap((p) => p.variants).every((v) => shape.test(v.sizeBreakup))).toBe(
      true,
    );
  });
});

describe("applyFilters", () => {
  it("returns everything when nothing is selected", () => {
    expect(applyFilters(catalog, {})).toHaveLength(1070);
  });

  it("ORs within a facet", () => {
    const men = countMatching(catalog, { gender: ["men"] });
    const women = countMatching(catalog, { gender: ["women"] });
    const both = countMatching(catalog, { gender: ["men", "women"] });
    expect(both).toBe(men + women);
  });

  it("ANDs across facets", () => {
    const selections = { gender: ["men"], seller: ["grasim"] };
    const result = applyFilters(catalog, selections);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.gender === "men" && p.sellerId === "grasim")).toBe(true);
    expect(result.length).toBeLessThan(countMatching(catalog, { gender: ["men"] }));
  });

  it("honours multi-valued facets — cumulative delivery buckets", () => {
    const within2 = applyFilters(catalog, { delivery: ["d2"] });
    expect(within2.every((p) => p.deliveryDays <= 2)).toBe(true);
    // A 1-day product must also satisfy "Within 3 days".
    const within3 = applyFilters(catalog, { delivery: ["d3"] });
    expect(within3.length).toBeGreaterThan(within2.length);
  });
});

describe("facetOptionsWithCounts", () => {
  it("counts a facet's own options against the OTHER facets only", () => {
    // Ticking one gender must not zero out the remaining gender options.
    const options = facetOptionsWithCounts(catalog, { gender: ["men"] }, "gender");
    const women = options.find((o) => o.id === "women");
    expect(women?.count).toBeGreaterThan(0);
    expect(women?.count).toBe(countMatching(catalog, { gender: ["women"] }));
  });

  it("prunes options that become impossible — the 'high heels disappears' case", () => {
    // The categories name their audience, so Girls leaves exactly one standing.
    const all = facetOptionsWithCounts(catalog, {}, "category");
    expect(all.map((o) => o.id)).toContain("mens-formal-shirts");

    const forGirls = facetOptionsWithCounts(catalog, { gender: ["girls"] }, "category");
    expect(forGirls.map((o) => o.id)).toEqual(["girls-t-shirts"]);

    // Men keeps its three and drops the other four.
    const forMen = facetOptionsWithCounts(catalog, { gender: ["men"] }, "category");
    expect(forMen.map((o) => o.id).sort()).toEqual([
      "mens-casual-shirts",
      "mens-casual-t-shirts",
      "mens-formal-shirts",
    ]);
  });

  it("keeps a selected option visible even when its count reaches zero", () => {
    // Girls + Men's Formal Shirts is an empty intersection, but the user must
    // still be able to untick it.
    const options = facetOptionsWithCounts(
      catalog,
      { gender: ["girls"], category: ["mens-formal-shirts"] },
      "category",
    );
    const formal = options.find((o) => o.id === "mens-formal-shirts");
    expect(formal).toBeDefined();
    expect(formal?.count).toBe(0);
  });

  it("shrinks other facets' counts as constraints are added", () => {
    const before = facetOptionsWithCounts(catalog, {}, "seller");
    const after = facetOptionsWithCounts(catalog, { gender: ["men"] }, "seller");
    const id = "grasim";
    const b = before.find((o) => o.id === id)!.count;
    const a = after.find((o) => o.id === id)!.count;
    expect(a).toBeLessThan(b);
  });

  it("has counts that sum to the total for a single-valued facet", () => {
    const options = facetOptionsWithCounts(catalog, {}, "category");
    const sum = options.reduce((n, o) => n + o.count, 0);
    expect(sum).toBe(1070);
    expect(options).toHaveLength(CATEGORIES.length);
  });

  it("matches the footer count when a single option is selected", () => {
    const options = facetOptionsWithCounts(catalog, {}, "seller");
    const grasim = options.find((o) => o.id === "grasim")!;
    expect(countMatching(catalog, { seller: ["grasim"] })).toBe(grasim.count);
  });
});

describe("sortProducts", () => {
  it("sorts price ascending", () => {
    const sorted = sortProducts(catalog, "price_asc");
    const prices = sorted.map((p) => defaultVariant(p).pricePerPc);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts margin descending", () => {
    const sorted = sortProducts(catalog, "margin_desc");
    const margins = sorted.map((p) => defaultVariant(p).marginPct);
    expect(margins).toEqual([...margins].sort((a, b) => b - a));
  });

  it("does not mutate its input", () => {
    const first = catalog[0].id;
    sortProducts(catalog, "margin_desc");
    expect(catalog[0].id).toBe(first);
  });
});

describe("toggleSelection", () => {
  it("adds, then removes, then drops the empty key", () => {
    const added = toggleSelection({}, "brand", "camisa");
    expect(added).toEqual({ brand: ["camisa"] });
    expect(toggleSelection(added, "brand", "camisa")).toEqual({});
  });

  it("accumulates on a multi-select facet", () => {
    const one = toggleSelection({}, "brand", "camisa");
    expect(toggleSelection(one, "brand", "spykar")).toEqual({
      brand: ["camisa", "spykar"],
    });
  });

});

describe("contextual chips", () => {
  const ids = (selections: Record<string, string[]>) =>
    contextChips(catalog, selections).map((c) =>
      c.kind === "price" ? "price:*" : `${c.facetId}:${c.option.id}`,
    );

  /** The bands inside the Price dropdown, which is one chip however many. */
  const bands = (selections: Record<string, string[]>) => {
    const chip = contextChips(catalog, selections).find((c) => c.kind === "price");
    return chip?.kind === "price" ? chip.options.map((o) => o.id) : [];
  };

  it("offers the verticals when none is picked", () => {
    expect(ids({})).toEqual([
      "category:womens-t-shirts",
      "category:mens-formal-shirts",
      "category:mens-casual-t-shirts",
      "category:mens-casual-shirts",
      "category:girls-t-shirts",
      "category:boys-casual-shirts",
      "category:boys-casual-t-shirts",
    ]);
  });

  it("leads with the picked vertical, then price and offers", () => {
    expect(ids({ category: ["girls-t-shirts"] })).toEqual([
      // Stays on the strip so its ✕ is the way back out.
      "category:girls-t-shirts",
      "price:*",
      // The 2026-08-28 order, which interleaves the two offer facets — Seller
      // Offer (`hasOffer`) sits between two `offers` options, which is why
      // OFFER_CHIPS lists one chip per line rather than one per facet.
      "offers:cashback",
      "hasOffer:any",
      "offers:solv-target-scheme",
      "offers:free-delivery",
    ]);
  });

  it("offers price as one chip, not one per band", () => {
    const chips = contextChips(catalog, { category: ["girls-t-shirts"] });
    expect(chips.filter((c) => c.kind === "price")).toHaveLength(1);
    expect(bands({ category: ["girls-t-shirts"] }).length).toBeGreaterThan(1);
  });

  it("goes back to verticals when a second one is added", () => {
    const chips = ids({ category: ["girls-t-shirts", "womens-t-shirts"] });
    expect(chips.every((c) => c.startsWith("category:"))).toBe(true);
  });

  it("keeps the offer strip to the four asked for", () => {
    const chips = ids({ category: ["mens-formal-shirts"] });
    // OFFER_CHIPS is a whitelist: Bulk Offer is a real offer on the cards and
    // in the Filters panel, and stays off the strip by not being listed.
    expect(chips).not.toContain("offers:bulk-offer");
    // SOLV Target Scheme came back on 2026-08-28 and is on the strip. The GOLD
    // prefix went with that branding on 08-19 and SOLV took its place, so
    // neither the old name nor the unprefixed one it shipped with for an hour
    // should reappear.
    expect(chips).toContain("offers:solv-target-scheme");
    expect(chips).not.toContain("offers:gold-target-scheme");
    expect(chips).not.toContain("offers:target-scheme");
  });

  it("drops an offer every product in the vertical already carries", () => {
    // Nothing in the seeded catalog is universal, so pin the rule directly:
    // an option on every product in scope filters nothing and must not appear.
    const allCashback = catalog
      .filter((p) => p.category === "Girl's T-Shirts")
      .map((p) => ({ ...p, offers: ["Cashback"] }));
    const options = discriminatingOptions(allCashback, {}, "offers").map((o) => o.id);
    expect(options).not.toContain("cashback");
  });

  it("keeps a non-discriminating option visible while it is selected", () => {
    const allCashback = catalog
      .filter((p) => p.category === "Girl's T-Shirts")
      .map((p) => ({ ...p, offers: ["Cashback"] }));
    const options = discriminatingOptions(allCashback, { offers: ["cashback"] }, "offers");
    expect(options.map((o) => o.id)).toContain("cashback");
  });

  it("hides a price band no product in the vertical falls into", () => {
    // Girl's T-Shirts top out at ~₹320/pc, so the upper bands cannot appear.
    expect(bands({ category: ["girls-t-shirts"] })).toEqual(["p-200", "p-400"]);
    // Men's Formal Shirts reach ₹1,150 and so keep the top band.
    expect(bands({ category: ["mens-formal-shirts"] })).toContain("p-max");
  });

  it("carries a vertical chip with its image, so the strip can show a thumbnail", () => {
    const chip = contextChips(catalog, {})[0];
    expect(chip.kind).toBe("vertical");
    if (chip.kind === "vertical") {
      expect(chip.option.image).toBe("/categories/womens-t-shirts.jpg");
    }
  });

  it("treats Seller Offer as its own facet, so it narrows Cashback rather than widening it", () => {
    const both = countMatching(catalog, { hasOffer: ["any"], offers: ["cashback"] });
    expect(both).toBe(countMatching(catalog, { offers: ["cashback"] }));
    expect(both).toBeLessThan(countMatching(catalog, { hasOffer: ["any"] }));
  });
});

describe("sameSelections — what decides whether a discard is announced", () => {
  it("ignores option order, which is only ever tap sequence", () => {
    expect(sameSelections({ gender: ["men", "boys"] }, { gender: ["boys", "men"] })).toBe(true);
  });

  it("treats an absent key and an empty array as the same no-constraint", () => {
    expect(sameSelections({}, { category: [] })).toBe(true);
    expect(sameSelections({ category: [] }, {})).toBe(true);
  });

  it("spots an addition, a removal and a swap", () => {
    expect(sameSelections({ gender: ["men"] }, { gender: ["men", "boys"] })).toBe(false);
    expect(sameSelections({ gender: ["men"] }, {})).toBe(false);
    expect(sameSelections({ gender: ["men"] }, { gender: ["women"] })).toBe(false);
  });

  it("spots a change in a facet the other side never mentions", () => {
    expect(sameSelections({ gender: ["men"] }, { seller: ["grasim"] })).toBe(false);
  });

  it("says nothing was lost when an option is ticked and then unticked", () => {
    const opened = { seller: ["grasim"] };
    const ticked = toggleSelection(opened, "category", "girls-t-shirts");
    expect(sameSelections(ticked, opened)).toBe(false);
    const unticked = toggleSelection(ticked, "category", "girls-t-shirts");
    expect(sameSelections(unticked, opened)).toBe(true);
  });
});

describe("the rail, now identical in both variants", () => {
  it("keeps both facets in the engine either way", () => {
    expect(FACET_BY_ID.has("gender")).toBe(true);
    expect(FACET_BY_ID.has("category")).toBe(true);
    expect(countMatching(catalog, { gender: ["women"] })).toBeGreaterThan(0);
    expect(parseSelections(new URLSearchParams("gender=women"))).toEqual({
      gender: ["women"],
    });
  });

  it("runs in the reference apparel order", () => {
    // Ordered after a reference PLP (2026-08-19) rather than the Figma frame,
    // which sequenced these before most of them existed. Pinned in full so a
    // future reorder has to be a decision rather than a drift.
    // Size is absent here: it is vertical-only, M in menswear not being M in
    // womenswear. It reappears in its reference slot inside a vertical.
    expect(getRail().map((r) => r.id)).toEqual([
      "category", "gender", "brand", "colour", "fabric",
      "price", "margin", "moq", "delivery", "offers", "seller", "sellerCity", "more",
    ]);
    expect(getRailFacetIds().has("category")).toBe(true);
    expect(getRailFacetIds().has("gender")).toBe(true);
  });

  it("trails the vertical block after the commercial rows, and drops Gender", () => {
    // A departure from the reference, which interleaves Fit, Pattern and Sleeve
    // Type up beside Fabric. Five rows landing there pushed Price Range from
    // 6th to 12th and below the fold, so picking a vertical handed back a rail
    // the buyer hadn't learned. Gender goes at the same time: category → gender
    // is 1:1, so the row could only offer the one value everything in scope
    // already has.
    expect(getRail(["mens-formal-shirts"]).map((r) => r.id)).toEqual([
      "category", "brand", "size", "colour", "fabric",
      "price", "margin", "moq", "delivery", "offers", "seller", "sellerCity",
      "fit", "pattern", "sleeve", "neck", "closure",
      "more",
    ]);
    expect(getRail(["mens-formal-shirts"]).map((r) => r.id)).not.toContain("gender");
  });

  it("holds nine rows at the same index whether or not a vertical is picked", () => {
    // The point of the reorder. Gender leaving and Size arriving cancel, so
    // everything from Colour to Seller City keeps its position and the rail
    // stops rearranging itself under the buyer. Brands is the one row that
    // moves, up into Gender's slot.
    const multi = getRail().map((r) => r.id);
    const single = getRail(["mens-formal-shirts"]).map((r) => r.id);

    for (const id of [
      "colour", "fabric", "price", "margin", "moq",
      "delivery", "offers", "seller", "sellerCity",
    ]) {
      expect(single.indexOf(id), `${id} moved`).toBe(multi.indexOf(id));
    }
    expect(multi.indexOf("category")).toBe(single.indexOf("category"));
    expect(single.indexOf("brand")).toBe(multi.indexOf("brand") - 1);
    // Price Range specifically — the row that prompted this.
    expect(single.indexOf("price")).toBe(5);
  });

  it("Clear Filters now wipes Category in both variants", () => {
    // It used to survive in A, because the bottom bar owned it and clearing a
    // filter from a screen that never showed it is a silent surprise. The
    // screen shows it now, so the surprise is gone and so is the exception.
    const draft = {
      category: ["girls-t-shirts"],
      gender: ["women"],
      seller: ["grasim"],
      colour: ["navy"],
    };
    expect(clearSelections(draft, getRailFacetIds())).toEqual({});
  });

  it("Clear Filters leaves a facet the screen doesn't display standing", () => {
    // The reason it is a filter over the rail rather than a blanket reset.
    // Nothing is off the rail today, so the guard is exercised with a facet id
    // that isn't one — a stand-in for whatever the rails diverging would put
    // there. The button clears what the buyer can see it clear, and no more.
    const cleared = clearSelections(
      { seller: ["grasim"], notOnTheRail: ["x"] },
      getRailFacetIds(),
    );
    expect(cleared).toEqual({ notOnTheRail: ["x"] });
  });

  it("Clear Filters commits an empty draft, so the listing is unfiltered", () => {
    // The screen's own handler, minus React: clear what the rail owns, then
    // hand *that* to `onApply` rather than back to the draft. Clearing used to
    // stop at the draft, which left the listing untouched behind a screen the
    // buyer still had to dismiss through "Show N results".
    //
    // The draft settles a vertical, so this also pins the case where the rail
    // is at its widest: Size and the attribute block are on it, and clear with
    // everything else, because RAIL_FACET_IDS is read from the very draft
    // about to be cleared rather than from a bare rail.
    const draft = {
      category: ["girls-t-shirts"],
      size: ["6-7y"],
      fit: ["regular-fit"],
      colour: ["navy"],
    };
    const settled = settledVertical(catalog, draft, FILTER_VERTICALS);
    const applied = clearSelections(
      draft,
      getRailFacetIds(draft.category, FILTER_VERTICALS, settled),
    );

    expect(settled).toBe("girls-t-shirts");
    expect(countSelections(applied)).toBe(0);
    expect(countMatching(catalog, applied)).toBe(catalog.length);
  });

  it("counts category in the Filters badge, since nothing else reports it", () => {
    const selections = {
      category: ["girls-t-shirts", "womens-t-shirts"],
      gender: ["women"],
      seller: ["grasim"],
    };
    const owned = getRailFacetIds();
    const badge = Object.entries(selections).reduce(
      (sum, [facetId, chosen]) => sum + (owned.has(facetId) ? chosen.length : 0),
      0,
    );
    // Two categories, a gender and a seller — all four, where A used to
    // report two here and two on the bar.
    expect(badge).toBe(4);
  });

  it("leaves the variants differing by nothing the engine can see", () => {
    // The whole point of the move: the A/B is now purely about where Sort and
    // Filters sit. If this ever fails, the comparison has stopped being clean.
    expect(getRail()).toEqual(getRail());
    expect([...getRailFacetIds()].sort()).toEqual(
      [...new Set(getRail().flatMap((r) => r.facetIds))].sort(),
    );
  });
});

describe("url state", () => {
  it("round-trips selections and sort", () => {
    const selections = { gender: ["men", "boys"], seller: ["grasim"] };
    const query = buildQuery(selections, "margin_desc");
    const params = new URLSearchParams(query);
    expect(parseSelections(params)).toEqual(selections);
    expect(parseSort(params)).toBe("margin_desc");
  });

  it("omits the default sort", () => {
    expect(buildQuery({}, "popularity")).toBe("");
  });

  it("discards unknown option ids rather than filtering to nothing", () => {
    const params = new URLSearchParams("gender=men,unicorn");
    expect(parseSelections(params)).toEqual({ gender: ["men"] });
  });
});

describe("size — a facet that lives on the pack, not the product", () => {
  const catalog = getCatalog();
  it("matches a product when any one of its packs carries the size", () => {
    for (const product of applyFilters(catalog, { size: ["l"] })) {
      expect(product.variants.some((v) => v.sizes.map(sizeOptionId).includes("l"))).toBe(true);
    }
  });

  it("widens rather than narrows when a second size is ticked", () => {
    // ANY, not ALL: M and L together means a pack carrying either. Confirmed
    // 2026-08-18 — the alternative reading was a pack carrying both.
    const m = applyFilters(catalog, { size: ["m"] });
    const l = applyFilters(catalog, { size: ["l"] });
    const both = applyFilters(catalog, { size: ["m", "l"] });

    expect(both.length).toBeGreaterThan(Math.max(m.length, l.length));
    expect(new Set(both.map((p) => p.id))).toEqual(
      new Set([...m, ...l].map((p) => p.id)),
    );
  });

  it("keeps every option reachable and none universal", () => {
    // The old flat size table put L in 96% of the catalog and M in 93%, so
    // ticking either pruned about 4% and the control did nothing worth doing.
    const options = facetOptionsWithCounts(catalog, {}, "size");
    expect(options).toHaveLength(13);
    for (const option of options) {
      expect(option.count).toBeGreaterThan(0);
      expect(option.count).toBeLessThan(catalog.length * 0.6);
    }
  });

  it("prunes to age bands for kids and letters for adults", () => {
    const labels = (selections: Record<string, string[]>) =>
      facetOptionsWithCounts(catalog, selections, "size").map((o) => o.label);

    expect(labels({ gender: ["girls"] }).every((l) => l.endsWith("Y"))).toBe(true);
    expect(labels({ gender: ["men"] }).some((l) => l.endsWith("Y"))).toBe(false);
  });
});

describe("the pack a card shows, and is judged by", () => {
  const catalog = getCatalog();

  it("opens on pack #1 when no size is selected", () => {
    for (const product of catalog.slice(0, 50)) {
      expect(activeVariantIndex(product, undefined)).toBe(0);
      expect(activeVariantIndex(product, [])).toBe(0);
      expect(activeVariant(product, [])).toBe(defaultVariant(product));
    }
  });

  it("opens on the leftmost pack carrying a selected size", () => {
    const sizes = ["3xl"];
    const hits = applyFilters(catalog, { size: sizes });
    expect(hits.length).toBeGreaterThan(0);

    for (const product of hits) {
      const index = activeVariantIndex(product, sizes);
      expect(product.variants[index].sizes.map(sizeOptionId)).toContain("3xl");
      // Nothing to its left qualifies, or it would not be the leftmost.
      for (const earlier of product.variants.slice(0, index)) {
        expect(earlier.sizes.map(sizeOptionId)).not.toContain("3xl");
      }
    }
  });

  it("ignores the order sizes were tapped in", () => {
    for (const product of applyFilters(catalog, { size: ["m", "l"] }).slice(0, 100)) {
      expect(activeVariantIndex(product, ["m", "l"])).toBe(activeVariantIndex(product, ["l", "m"]));
    }
  });

  it("sorts price on the pack the card prints, not on pack #1", () => {
    // Ranking on pack #1 while the card shows another pack lists visibly
    // descending prices under a low-to-high sort. Measured 2026-08-18: with
    // size=M,L that was 63 out-of-order rows.
    const sizes = ["m", "l"];
    const hits = applyFilters(catalog, { size: sizes });
    const printed = sortProducts(hits, "price_asc", sizes).map(
      (p) => activeVariant(p, sizes).pricePerPc,
    );

    expect(printed).toEqual([...printed].sort((a, b) => a - b));
    expect(hits.filter((p) => activeVariantIndex(p, sizes) > 0).length).toBeGreaterThan(0);
  });

  it("filters price on that same pack", () => {
    const sizes = ["xs"];
    for (const product of applyFilters(catalog, { size: sizes, price: ["p-200"] })) {
      expect(activeVariant(product, sizes).pricePerPc).toBeLessThan(200);
    }
  });

  it("resolves to a real pack even for a product the size filter excluded", () => {
    // Count passes ask about products that were filtered out; -1 would index
    // undefined and take the card down with it.
    const outside = catalog.find((p) => !p.variants.some((v) => v.sizes.includes("3XL")))!;
    expect(activeVariant(outside, ["3xl"])).toBe(outside.variants[0]);
  });
});

describe("Pack Type is no longer a filter, but is still a product property", () => {
  const catalog = getCatalog();

  it("has no facet, no rail row, and no URL", () => {
    expect(FACET_BY_ID.has("packType")).toBe(false);
    expect(getRail().some((r) => r.id === "packType")).toBe(false);
    expect(getRailFacetIds().has("packType")).toBe(false);
    // Nothing left to undo it with, so it must not survive in a link either.
    expect(parseSelections(new URLSearchParams("packType=solid-size-pack"))).toEqual({});
  });

  it("keeps the field, because the seed leans on it twice", () => {
    // Its draw sits mid-sequence — deleting it re-rolls the catalog and moves
    // every documented count. It also still decides pack composition.
    expect(new Set(catalog.map((p) => p.packType))).toEqual(
      new Set(["Solid Size Pack", "Mixed Size Pack", "Assorted Colour Pack"]),
    );

    for (const product of catalog) {
      const solid = product.packType === "Solid Size Pack";
      for (const variant of product.variants) {
        expect(variant.sizes.length === 1).toBe(solid);
      }
    }
  });
});

describe("vertical-specific attributes", () => {
  const catalog = getCatalog();
  const ATTRS = ["fit", "neck", "sleeve", "pattern", "closure"];
  const shirt = ["mens-formal-shirts"];
  const tee = ["womens-t-shirts"];

  it("only joins the rail inside exactly one vertical", () => {
    const base = getRail().map((r) => r.id);
    for (const id of ATTRS) expect(base).not.toContain(id);

    const inside = getRail(shirt).map((r) => r.id);
    for (const id of ATTRS) expect(inside).toContain(id);

    // Two verticals is not one, so the block goes again.
    expect(getRail(["mens-formal-shirts", "womens-t-shirts"]).map((r) => r.id)).toEqual(base);
  });

  it("keeps Fabric out of the block, and in the rail exactly once", () => {
    // Asked for alongside them, but its values don't vary by vertical, so it
    // is an ordinary row — available with or without one, and listed in a
    // single place rather than here and in More Filters both.
    for (const category of [undefined, shirt, tee]) {
      expect(getRail(category).filter((r) => r.facetIds.includes("fabric"))).toHaveLength(1);
      expect(getRailFacetIds(category).has("fabric")).toBe(true);
    }
    expect(getRail().find((r) => r.id === "more")?.facetIds).toEqual(["tags"]);
    expect(PV_FACET_IDS.has("fabric")).toBe(false);
  });

  it("leaves More Filters last, wherever the block lands", () => {
    for (const category of [undefined, shirt, tee]) {
      const rail = getRail(category);
      expect(rail[rail.length - 1].id).toBe("more");
    }
  });

  it("offers collars to shirts and necklines to tees, never both", () => {
    const necks = (category: string[]) =>
      facetOptionsWithCounts(catalog, { category }, "neck").map((o) => o.label);

    expect(necks(shirt).every((l) => l.includes("Collar"))).toBe(true);
    expect(necks(tee)).toContain("Round Neck");
    expect(necks(tee).some((l) => l === "Spread Collar")).toBe(false);

    const closures = (category: string[]) =>
      facetOptionsWithCounts(catalog, { category }, "closure").map((o) => o.label);
    expect(closures(tee)).toContain("Pullover");
    expect(closures(shirt).some((l) => l === "Pullover")).toBe(false);
  });

  it("gives every category a full, non-degenerate set of options", () => {
    for (const category of CATS) {
      for (const id of ATTRS) {
        const options = facetOptionsWithCounts(catalog, { category: [category.id] }, id);
        expect(options.length).toBeGreaterThan(2);
        // A value every product in the vertical shares would filter nothing.
        const scope = applyFilters(catalog, { category: [category.id] }).length;
        expect(options.every((o) => o.count > 0 && o.count < scope)).toBe(true);
      }
    }
  });

  it("drops a gender selection on the way into a vertical, without moving results", () => {
    // The Gender row leaves the rail there — one vertical is one audience, so
    // it could only offer the value everything in scope already has. The
    // selection has to leave with its control, and because category → gender is
    // 1:1 it was implied anyway, so the list it was narrowing doesn't move.
    const entering = { category: shirt, gender: ["men"], seller: ["grasim"] };
    const kept = dropOrphanedSelections(entering);
    expect(kept).toEqual({ category: shirt, seller: ["grasim"] });
    expect(applyFilters(catalog, kept).length).toBe(
      applyFilters(catalog, entering).length,
    );

    // Across verticals the row is back, so the selection stands.
    const across = { gender: ["men"], seller: ["grasim"] };
    expect(dropOrphanedSelections(across)).toEqual(across);

    // A contradiction is the one case where dropping it moves the count — and
    // it resolves an empty page rather than causing one, there being no Gender
    // row left to undo the mismatch.
    const contradiction = { category: ["girls-t-shirts"], gender: ["men"] };
    expect(applyFilters(catalog, contradiction).length).toBe(0);
    expect(dropOrphanedSelections(contradiction)).toEqual({
      category: ["girls-t-shirts"],
    });
    expect(
      applyFilters(catalog, dropOrphanedSelections(contradiction)).length,
    ).toBe(108);
  });

  it("strips a gender from a locked page's URL, the row being gone there too", () => {
    // C and D settle their vertical by being the page, so the block is always
    // on and Gender always off. This used to be an ad-hoc `params.delete` in
    // `PlpScreen`; it belongs with the rest of the guard.
    expect(
      parseSelections(new URLSearchParams("gender=men&colour=navy"), {
        kind: "locked",
        id: "mens-formal-shirts",
      }),
    ).toEqual({ colour: ["navy"] });
  });

  it("drops attribute selections when the vertical they belong to goes", () => {
    const inside = { category: shirt, fit: ["slim-fit"], seller: ["grasim"] };
    expect(dropOrphanedSelections(inside)).toEqual(inside);

    // Leaving the vertical takes the rows off the rail, so the filters they
    // set must go too — otherwise they narrow the list uncounted and
    // unclearable, with no control left to undo them.
    expect(dropOrphanedSelections({ ...inside, category: [] })).toEqual({
      category: [],
      seller: ["grasim"],
    });
    expect(
      dropOrphanedSelections({ ...inside, category: [...shirt, ...tee] }),
    ).toEqual({ category: [...shirt, ...tee], seller: ["grasim"] });
  });

  it("clears a size when the vertical it was chosen in goes", () => {
    // M in menswear is not M in womenswear, so a size outlives its vertical
    // only as a filter nothing on screen can explain or undo.
    const inside = { category: shirt, size: ["l"], seller: ["grasim"] };
    expect(dropOrphanedSelections(inside)).toEqual(inside);
    expect(dropOrphanedSelections({ ...inside, category: [] })).toEqual({
      category: [],
      seller: ["grasim"],
    });
    // ...but it survives on a vertical-scoped page, where the page is the
    // vertical and there is none to leave.
    expect(
      dropOrphanedSelections({ size: ["l"] }, { kind: "locked", id: shirt[0] }),
    ).toEqual({ size: ["l"] });
  });

  it("refuses to honour an attribute in a URL that has no vertical", () => {
    expect(parseSelections(new URLSearchParams("fit=slim-fit"))).toEqual({});
    expect(parseSelections(new URLSearchParams("size=l"))).toEqual({});
    // ...unless the page itself is the vertical, as in C and D, where the
    // query string never carries the category at all.
    expect(parseSelections(new URLSearchParams("fit=slim-fit"), { kind: "locked", id: "mens-formal-shirts" })).toEqual({
      fit: ["slim-fit"],
    });
    expect(
      parseSelections(new URLSearchParams("category=mens-formal-shirts&fit=slim-fit")),
    ).toEqual({ category: ["mens-formal-shirts"], fit: ["slim-fit"] });
  });

  it("filters on them like any other facet", () => {
    const selections = { category: shirt, fit: ["slim-fit"] };
    const hits = applyFilters(catalog, selections);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((p) => p.fit === "Slim Fit" && p.category === "Men's Formal Shirts")).toBe(
      true,
    );
    expect(hits.length).toBeLessThan(applyFilters(catalog, { category: shirt }).length);
  });

  it("registers the vertical-specific facets, Size among them", () => {
    // Size joins them so that leaving a vertical clears it too — otherwise a
    // size would keep filtering with no row left to show or undo it.
    expect([...PV_FACET_IDS].sort()).toEqual([...ATTRS, "size"].sort());
    // Fabric is shared, not vertical-specific: Cotton means the same on a
    // shirt as on a tee, so it survives leaving a vertical.
    expect(PV_FACET_IDS.has("fabric")).toBe(false);
  });
});

describe("variants C and D — the page is the vertical", () => {
  const LOCKED = { kind: "locked", id: "mens-formal-shirts" } as const;
  const scope = verticalScope("baheti", LOCKED.id)!;

  it("scopes the catalog by vertical, and by seller unless it is the storefront", () => {
    expect(scope.products).toHaveLength(168);
    expect(scope.products.every((p) => p.category === "Men's Formal Shirts")).toBe(true);
    // Baheti aggregates, so every seller's stock in this vertical is in scope.
    expect(new Set(scope.products.map((p) => p.sellerId)).size).toBeGreaterThan(1);

    const one = verticalScope("grasim", LOCKED.id)!;
    expect(one.products.every((p) => p.sellerId === "grasim")).toBe(true);
    expect(one.products.length).toBeLessThan(scope.products.length);
  });

  it("gives no page to a seller with nothing in the vertical", () => {
    for (const route of verticalRoutes()) {
      expect(verticalScope(route.sellerId, route.categoryId)!.products.length).toBeGreaterThan(0);
    }
    expect(verticalScope("baheti", "not-a-category")).toBeNull();
    expect(verticalScope("not-a-seller", LOCKED.id)).toBeNull();
  });

  it("drops Category and Gender, and keeps the attribute block on", () => {
    const rail = getRail(undefined, LOCKED).map((r) => r.id);
    expect(rail).not.toContain("category");
    // Every category names its audience, so one vertical is one gender: the
    // row could only ever offer the value every product in scope has.
    expect(rail).not.toContain("gender");
    for (const id of PV_FACET_IDS) expect(rail).toContain(id);
    expect(rail[0]).toBe("brand");
    expect(rail[rail.length - 1]).toBe("more");

    // Nothing can clear or count a facet the page never shows.
    for (const id of ["category", "gender"]) {
      expect(getRailFacetIds(undefined, LOCKED).has(id)).toBe(false);
    }
  });

  it("confirms Gender would in fact be a dead control there", () => {
    const genders = facetOptionsWithCounts(scope.products, {}, "gender");
    expect(genders).toHaveLength(1);
    expect(genders[0].count).toBe(scope.products.length);
  });

  it("never orphans the attributes, there being no vertical to leave", () => {
    const selections = { fit: ["slim-fit"], neck: ["spread-collar"] };
    // Without a lock this would be stripped — no single category selected.
    expect(dropOrphanedSelections(selections)).toEqual({});
    expect(dropOrphanedSelections(selections, LOCKED)).toEqual(selections);
  });

  it("offers no vertical chips, since there is none to pick or remove", () => {
    const chips = contextChips(scope.products, {}, LOCKED);
    expect(chips.some((c) => c.kind === "vertical")).toBe(false);
    expect(chips[0].kind).toBe("price");

    // The unscoped strip does the opposite with the same products.
    expect(contextChips(scope.products, {}).every((c) => c.kind === "vertical")).toBe(true);
  });

  it("carries no vertical chip in any state when the screen opts out", () => {
    // `/userjourney` (2026-08-28): a buyer already in a storefront gets the
    // price and offer chips from the first paint instead of a choice of
    // garment type. Unlike LOCKED, this is a strip change only — the rail
    // keeps Category and Gender.
    const off = { verticals: false };

    // Nothing picked: the default strip offers verticals, this one leads with
    // the chips that would otherwise wait for one to be settled.
    expect(contextChips(catalog, {}).every((c) => c.kind === "vertical")).toBe(true);
    expect(contextChips(catalog, {}, FILTER_VERTICALS, off).some((c) => c.kind === "vertical"))
      .toBe(false);
    expect(contextChips(catalog, {}, FILTER_VERTICALS, off)[0].kind).toBe("price");

    // One picked: the default keeps it leading the strip as the way back out;
    // opted out, it is gone too — the accepted cost of the call.
    const picked = { category: ["girls-t-shirts"] };
    expect(contextChips(catalog, picked)[0].kind).toBe("vertical");
    expect(contextChips(catalog, picked, FILTER_VERTICALS, off).some((c) => c.kind === "vertical"))
      .toBe(false);

    // The chips it does carry are the real ones, counted against the pick.
    const chips = contextChips(catalog, picked, FILTER_VERTICALS, off);
    expect(chips.map((c) => c.facetId)).toEqual([
      "price",
      "offers",
      "hasOffer",
      "offers",
      "offers",
    ]);
    const price = chips.find((c) => c.kind === "price");
    expect(price && price.options.length).toBeGreaterThan(0);
  });

  it("filters price by a typed range, not just a band", () => {
    // `/userjourney` carries a min/max above the bands (2026-08-28); A–D show
    // the bands alone. Both live on the `price` facet — one facet, because two
    // would AND and a typed range would then need a band cleared to show
    // anything. Within the facet they OR, which is why the UI keeps them
    // exclusive; the engine itself has no opinion and is tested for both.
    const priced = (sel: Record<string, string[]>) =>
      applyFilters(catalog, sel).map((p) => activeVariant(p).pricePerPc);

    const between = priced({ price: ["150-450"] });
    expect(between.length).toBeGreaterThan(0);
    expect(between.every((v) => v >= 150 && v <= 450)).toBe(true);

    // Open-ended at either end.
    expect(priced({ price: ["800-"] }).every((v) => v >= 800)).toBe(true);
    expect(priced({ price: ["-150"] }).every((v) => v <= 150)).toBe(true);

    // Inverted stays empty rather than being silently swapped: it is a
    // transient typing state and the footer reports it honestly.
    expect(priced({ price: ["450-150"] })).toHaveLength(0);

    // A bare hyphen is not a range, so it falls through to band matching and
    // matches nothing — a hand-typed `?price=-` can't empty the listing.
    expect(parseTypedRange("-")).toBeNull();

    // Band ids still work and can never be read as a range.
    expect(parseTypedRange("p-200")).toBeNull();
    expect(priced({ price: ["p-200"] }).every((v) => v < 200)).toBe(true);
  });

  it("carries a typed price range through the URL and back", () => {
    // Found in the browser, not by reading: the range filtered correctly
    // in-session and vanished on reload, because `parseSelections` validates
    // every id against the facet's options and a range is in no option list.
    const round = (q: string) => parseSelections(new URLSearchParams(q));

    expect(round("price=150-450")).toEqual({ price: ["150-450"] });
    expect(round("price=800-")).toEqual({ price: ["800-"] });
    expect(round("price=-450")).toEqual({ price: ["-450"] });
    expect(round("price=p-200")).toEqual({ price: ["p-200"] });

    // The guard still guards: neither an option nor a range.
    expect(round("price=junk")).toEqual({});
    expect(round("price=-")).toEqual({});

    // And it survives a build → parse round trip.
    const q = buildQuery({ price: ["150-450"] }, "popularity");
    expect(q).toBe("?price=150-450");
    expect(round(q.slice(1))).toEqual({ price: ["150-450"] });
  });

  it("filters Margin on MRP and MOQ by a typed range too", () => {
    // The same control on all three range facets (2026-09-03, on request).
    // What differs is only the number each compares against — the pack's margin
    // for one, the product's `moq` for the other — so this is the price test
    // run again over the two that joined it.
    const margins = (sel: Record<string, string[]>) =>
      applyFilters(catalog, sel).map((p) => activeVariant(p).marginPct);
    const moqs = (sel: Record<string, string[]>) => applyFilters(catalog, sel).map((p) => p.moq);

    const band = margins({ margin: ["35-50"] });
    expect(band.length).toBeGreaterThan(0);
    expect(band.every((v) => v >= 35 && v <= 50)).toBe(true);
    expect(margins({ margin: ["60-"] }).every((v) => v >= 60)).toBe(true);
    expect(margins({ margin: ["-30"] }).every((v) => v <= 30)).toBe(true);
    // Inverted matches nothing rather than being swapped, as with price.
    expect(margins({ margin: ["50-35"] })).toHaveLength(0);

    const some = moqs({ moq: ["5-12"] });
    expect(some.length).toBeGreaterThan(0);
    expect(some.every((v) => v >= 5 && v <= 12)).toBe(true);
    expect(moqs({ moq: ["20-"] }).every((v) => v >= 20)).toBe(true);

    // Their own band ids are still bands and can never be read as a range —
    // every bucket id starts with a letter, every range with a digit or `-`.
    expect(parseTypedRange("m-30")).toBeNull();
    expect(parseTypedRange("moq-4")).toBeNull();
    expect(margins({ margin: ["m-30"] }).every((v) => v < 30)).toBe(true);
    expect(moqs({ moq: ["moq-4"] }).every((v) => v <= 4)).toBe(true);
  });

  it("carries every typed range through the URL, and only the three", () => {
    // `matches` without `accepts` is the trap: the selection works in-session
    // and vanishes on reload, because `parseSelections` validates each id
    // against the facet's options and a range is in no option list. All three
    // range facets are built from one table for exactly this reason.
    const round = (q: string) => parseSelections(new URLSearchParams(q));

    expect(round("margin=35-50")).toEqual({ margin: ["35-50"] });
    expect(round("moq=5-12")).toEqual({ moq: ["5-12"] });
    expect(round("moq=20-")).toEqual({ moq: ["20-"] });
    // The guard still guards on the new two.
    expect(round("margin=junk")).toEqual({});
    expect(round("moq=-")).toEqual({});

    // And a facet that takes no range still refuses one, so `accepts` did not
    // quietly widen for everybody.
    expect(round("colour=100-200")).toEqual({});
    expect(round("delivery=1-3")).toEqual({});

    const q = buildQuery({ moq: ["5-12"], margin: ["35-50"] }, "popularity");
    expect(round(q.slice(1))).toEqual({ moq: ["5-12"], margin: ["35-50"] });
  });

  it("counts the bands the same whether or not a range is typed, on all three", () => {
    // Own-facet-excluded counting, asserted for the two facets that just
    // gained an input: a typed range is one of the facet's own selections, so
    // it must not move that facet's band counts.
    for (const [facetId, typed] of [
      ["price", "150-450"],
      ["margin", "35-50"],
      ["moq", "5-12"],
    ] as const) {
      expect(facetOptionsWithCounts(catalog, { [facetId]: [typed] }, facetId)).toEqual(
        facetOptionsWithCounts(catalog, {}, facetId),
      );
    }
  });

  it("counts the price bands the same whether or not a range is typed", () => {
    // The one rule that matters: a facet is counted against every *other*
    // facet's selections and never its own. A typed range is one of its own,
    // so it must not move the band counts — which is what still lets A–D show
    // live counts on a facet the journey drives with an input.
    const plain = facetOptionsWithCounts(catalog, {}, "price");
    const withRange = facetOptionsWithCounts(catalog, { price: ["150-450"] }, "price");
    expect(withRange).toEqual(plain);
  });

  it("bands the three offer magnitudes, in the unit each is quoted in", () => {
    /*
     * 2026-09-03, on request: the strip's binary offer chips are also ranges —
     * Cashback in ₹, Seller Offer in %, SOLV Target Scheme in ₹. Kartik's
     * catalog only, the main one carrying offer *names* without magnitudes, so
     * this runs against his 540.
     *
     * **Bands alone since 2026-09-07**, when the three rows merged into one
     * *Offers* panel and lost their typed boxes with the merge — see the URL
     * test below for what that removed.
     */
    const kartik = getKartikCatalog();
    const of = (sel: Record<string, string[]>, read: (p: Product) => number | undefined) =>
      applyFilters(kartik, sel).map(read);

    expect(of({ cashback: ["cb-200"] }, (p) => p.cashback).every((v) => v! >= 100 && v! <= 200))
      .toBe(true);
    expect(of({ sellerOffer: ["so-max"] }, (p) => p.sellerOfferPct).every((v) => v! >= 21))
      .toBe(true);
    expect(of({ sellerOffer: ["so-10"] }, (p) => p.sellerOfferPct).every((v) => v! <= 9))
      .toBe(true);
    expect(of({ targetScheme: ["ts-2k"] }, (p) => p.targetScheme).every((v) => v! >= 1001 && v! <= 2000))
      .toBe(true);

    // Each is non-empty, or the test above passes by matching nothing.
    const nonEmpty: Selections[] = [
      { cashback: ["cb-200"] },
      { sellerOffer: ["so-max"] },
      { targetScheme: ["ts-2k"] },
    ];
    for (const sel of nonEmpty) {
      expect(applyFilters(kartik, sel).length).toBeGreaterThan(0);
    }

    /*
     * **A product without the offer is excluded, not banded.** The value is -1
     * where the offer is absent rather than 0, so it falls outside every bucket
     * and below every typed floor — a 0 would have offered *Under ₹100
     * cashback* on products carrying no cashback at all.
     */
    expect(of({ cashback: ["cb-100"] }, (p) => p.cashback).every((v) => v !== undefined))
      .toBe(true);
    expect(of({ sellerOffer: ["so-10"] }, (p) => p.sellerOfferPct).every((v) => v !== undefined))
      .toBe(true);
    expect(of({ targetScheme: ["ts-500"] }, (p) => p.targetScheme).every((v) => v !== undefined))
      .toBe(true);
  });

  it("round-trips a typed range on all six band facets", () => {
    /*
     * `matches` without `accepts` is the trap: it would work in-session and
     * vanish on reload, which is how that pairing was found in August.
     *
     * All six carry the boxes again as of 2026-09-07. The three offer
     * magnitudes had them from 2026-09-03, lost them that morning when their
     * rows merged into one panel with nowhere to put three pairs, and took them
     * back hours after the rows split apart — *"bring back the input range and
     * similar behaviour for the three offers"*. Similar means identical, which
     * is what one `RANGE_FACETS` table buys.
     */
    const round = (q: string) => parseSelections(new URLSearchParams(q));

    expect([...TYPED_RANGE_FACET_IDS].sort()).toEqual([
      "cashback",
      "margin",
      "moq",
      "price",
      "sellerOffer",
      "targetScheme",
    ]);

    expect(round("price=150-450")).toEqual({ price: ["150-450"] });
    expect(round("margin=60-")).toEqual({ margin: ["60-"] });
    expect(round("moq=5-12")).toEqual({ moq: ["5-12"] });
    expect(round("cashback=100-200")).toEqual({ cashback: ["100-200"] });
    expect(round("sellerOffer=10-")).toEqual({ sellerOffer: ["10-"] });
    expect(round("targetScheme=-2000")).toEqual({ targetScheme: ["-2000"] });

    // Bands still survive a reload, and nonsense still doesn't — the guard is
    // widened by `accepts`, not dropped.
    expect(round("cashback=cb-200")).toEqual({ cashback: ["cb-200"] });
    expect(round("cashback=junk")).toEqual({});

    // And a typed range matches the number, not a bucket.
    const kartik = getKartikCatalog();
    const typed = applyFilters(kartik, { cashback: ["300-"] });
    expect(typed.length).toBeGreaterThan(0);
    expect(typed.every((p) => p.cashback! >= 300)).toBe(true);
    // An inverted pair is honest rather than an error: the control refuses it
    // on blur, and a hand-written one matches nothing.
    expect(applyFilters(kartik, { sellerOffer: ["20-10"] })).toEqual([]);
  });

  it("ANDs an offer chip with the magnitude of that offer", () => {
    // The chip and the row are different questions on different facets — "has
    // cashback" AND "at least ₹200 of it" — so they narrow together.
    const kartik = getKartikCatalog();
    const chip = { offers: ["cashback"] };
    const both = applyFilters(kartik, { ...chip, cashback: ["cb-400"] });
    expect(both.length).toBeGreaterThan(0);
    expect(both.length).toBeLessThan(applyFilters(kartik, chip).length);
    expect(both.every((p) => p.offers.includes("Cashback") && p.cashback! >= 201)).toBe(true);
  });

  it("gives /userjourney its own rail order, in full", () => {
    // Pinned in full, like the default rail, because the interesting failure
    // is a row quietly moving rather than one going missing. Re-ordered on
    // 2026-09-07: the commercial numbers lead, Size is global here, and the
    // three offer magnitudes are a row each at the **foot** — last in both
    // states, which is what the second pass that day asked for.
    const kartik = getKartikCatalog();
    const singles = singleValuedFacets(kartik);
    const rail = (category?: string[], settled: string | null = null) =>
      getRail(category, FILTER_VERTICALS, settled, "journey", singles).map((r) => r.label);

    expect(rail()).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
    ]);

    // Inside one settled vertical the block joins — *above* the three offer
    // rows, which stay last. Fabric left this rail on 2026-09-07 and Colour on
    // 09-08; **Size came back on 2026-09-10**, leading the block, so
    // `/pvfilters`' guided block could offer a Size button that opens a real
    // panel. `/userjourney` shows none of these, being `"journey-flat"`.
    expect(rail(["womens-t-shirts"], "womens-t-shirts")).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Size",
      "Fit",
      "Neck Type",
      "Sleeve Type",
      "Pattern",
      "Closure Type",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
    ]);

    // Brands, Seller and Seller City are in the order and hidden by *this*
    // storefront: one brand, one seller, one city. On a scope that spans
    // several they are all three back, in the place the request put them.
    expect(singles).toEqual(new Set(["brand", "seller", "sellerCity"]));
    expect(getRail(undefined, FILTER_VERTICALS, null, "journey").map((r) => r.label)).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Brands",
      "Seller",
      "Seller City",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
    ]);

    // The four that stay dropped, and the default rail keeping every one.
    const journey = getRailFacetIds(undefined, FILTER_VERTICALS, null, "journey", singles);
    const dflt = getRailFacetIds();
    for (const gone of ["gender", "delivery", "tags", "fabric", "colour"]) {
      expect(journey.has(gone)).toBe(false);
      expect(dflt.has(gone)).toBe(true);
    }
    // Size is vertical-only here as on A–D, since 2026-09-10 — off the rail
    // outside a vertical, on it inside one.
    expect(journey.has("size")).toBe(false);
    expect(
      getRailFacetIds(["womens-t-shirts"], FILTER_VERTICALS, "womens-t-shirts", "journey", singles),
    ).toContain("size");
    expect(getRailFacetIds(["womens-t-shirts"]).has("size")).toBe(true);

    // Gender leaving does not strand it: Category is still there, and it is a
    // ticked category that settles the vertical which puts the attributes on
    // the rail.
    expect(journey.has("category")).toBe(true);
  });

  it("strips a shared Size link where a control could have shown it", () => {
    /*
     * One rule read three ways (2026-09-09), and the reason `parseSelections`
     * takes the rail preset: strip a cut where something on the page could have
     * shown it and now can't.
     *
     * - A–D: a vertical-only Size **row**, so `?size=m` with no vertical goes.
     * - `/pvfilters` and `/pvfilters2`: a Size row once a vertical settles —
     *   the guided block's Size button on one, *Style Filters* on the other —
     *   so an unsettled link goes there too.
     * - `/userjourney`: no Size control in any state, so nothing was stranded
     *   and the link survives, as it has since the row came off on 2026-09-08.
     */
    const kartik = getKartikCatalog();
    const bare = new URLSearchParams("size=m");
    expect(parseSelections(bare, FILTER_VERTICALS, kartik)).toEqual({});
    for (const preset of ["journey", "journey-gated"] as const) {
      expect(parseSelections(bare, FILTER_VERTICALS, kartik, preset)).toEqual({});
    }
    expect(parseSelections(bare, FILTER_VERTICALS, kartik, "journey-flat")).toEqual({
      size: ["m"],
    });

    // With the vertical beside it both keep it — the row is on screen, which is
    // the link a buyer would actually share out of either block.
    const withVertical = new URLSearchParams("category=womens-t-shirts&size=m,l");
    for (const preset of ["journey", "journey-gated"] as const) {
      expect(parseSelections(withVertical, FILTER_VERTICALS, kartik, preset)).toEqual({
        category: ["womens-t-shirts"],
        size: ["m", "l"],
      });
    }
  });

  it("offers a rail's own style rows as the guided block's buttons", () => {
    /*
     * `/pvfilters`, 2026-09-09. The block's second step was five size tiles and
     * is now a button per style filter, each opening the Filters sheet on that
     * row — so the buttons are read off the rail rather than listed, and a
     * button can never claim a panel that is not there.
     *
     * **Six, Size leading** — since 2026-09-10, when Size got its row back on
     * this rail precisely so the block could offer the button. For a few hours
     * on 09-09 it was five: the row did not exist, and `styleRows` reading the
     * rail is what stopped a Size button being drawn that would have opened the
     * sheet on Price Range.
     */
    expect(styleRows("journey").map((r) => r.label)).toEqual([
      "Size",
      "Fit",
      "Neck Type",
      "Sleeve Type",
      "Pattern",
      "Closure Type",
    ]);

    // Every one of them is a real row once a vertical settles — the state the
    // buttons are drawn in — so every button has a panel to open.
    const rail = getRail(
      ["womens-t-shirts"],
      FILTER_VERTICALS,
      "womens-t-shirts",
      "journey",
      singleValuedFacets(getKartikCatalog()),
    ).map((r) => r.id);
    for (const row of styleRows("journey")) expect(rail).toContain(row.id);

    // `"journey-gated"` derives its block from the same array, so the two
    // agree — and will keep agreeing when a seventh is added to either.
    expect(styleRows("journey-gated").map((r) => r.id)).toEqual([
      "size",
      "fit",
      "neck",
      "sleeve",
      "pattern",
      "closure",
    ]);
  });

  it("swaps the gated row for the rows it stood in for", () => {
    /*
     * `/pvfilters2`, 2026-09-09. The other two Kartik rails *remove* the garment
     * attributes until a vertical settles, so a buyer who never ticks a category
     * never learns there was anything to tick for. This one puts a **Style
     * Filters** placeholder there instead — and the placeholder leaves the
     * moment the real rows arrive: a stand-in should not outlive the thing it
     * stood in for.
     *
     * **Both live at the foot of the rail**, which is this rail's one departure
     * from `JOURNEY_RAIL_ORDER`'s order — that puts the block above the three
     * offer magnitudes. Asked for, and the reason is the swap: the six should
     * arrive where the row you tapped stood, not somewhere you were not looking.
     */
    const singles = singleValuedFacets(getKartikCatalog());
    const gated = (category?: string[], settled: string | null = null) =>
      getRail(category, FILTER_VERTICALS, settled, "journey-gated", singles);

    expect(gated().map((r) => r.label)).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
      "Style Filters",
    ]);

    // Settled: the placeholder is gone and all six are rows of their own, in
    // the slot it held — Size leading, then `JOURNEY_RAIL_ORDER`'s own order.
    expect(gated(["womens-t-shirts"], "womens-t-shirts").map((r) => r.label)).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
      "Size",
      "Fit",
      "Neck Type",
      "Sleeve Type",
      "Pattern",
      "Closure Type",
    ]);

    // Exactly one of the two states carries the placeholder — never both, which
    // is what reading it off `showVertical` rather than `genderRedundant` buys.
    expect(gated().filter((r) => r.gated)).toHaveLength(1);
    expect(gated(["womens-t-shirts"], "womens-t-shirts").filter((r) => r.gated)).toHaveLength(0);

    // Its facetIds are the six it hands over, so Clear Filters reaches them
    // while it is standing in for them — and they are also what the rail row's
    // ticker reads out, in this order.
    expect(gated().find((r) => r.gated)!.facetIds).toEqual([
      "size",
      "fit",
      "neck",
      "sleeve",
      "pattern",
      "closure",
    ]);

    // Size is in the block on both Kartik rails that show one — `"journey"`
    // since 2026-09-10 — and on this one it is reachable while *locked* too,
    // through the placeholder that carries its facets.
    const facets = (settled: string | null, preset: "journey" | "journey-gated") =>
      getRailFacetIds(settled ? [settled] : undefined, FILTER_VERTICALS, settled, preset, singles);
    expect(facets("womens-t-shirts", "journey-gated")).toContain("size");
    expect(facets("womens-t-shirts", "journey")).toContain("size");
    expect(facets(null, "journey-gated")).toContain("size");
    expect(facets(null, "journey")).not.toContain("size");
  });

  it("still orphans the gated row's facets when the vertical goes", () => {
    /*
     * The row never leaves the rail, but its *contents* do — the panel locks
     * outside a vertical — so a cut made inside one and left behind when the
     * buyer widens has nothing to show or undo it, exactly as on a rail that
     * dropped the rows outright.
     */
    const all = {
      category: ["womens-t-shirts"],
      size: ["m"],
      fit: ["slim"],
      neck: ["round-neck"],
      sleeve: ["half-sleeves"],
      pattern: ["solid"],
      closure: ["pullover"],
    };
    // Inside the vertical the panel is open, so everything stands.
    expect(
      dropOrphanedSelections(all, FILTER_VERTICALS, "womens-t-shirts", "journey-gated"),
    ).toEqual(all);

    // Widen out of it and all six go, Size included.
    const attributes = { ...all };
    delete (attributes as Record<string, string[]>).category;
    expect(dropOrphanedSelections(attributes, FILTER_VERTICALS, null, "journey-gated"))
      .toEqual({});

    // What the rail carries unconditionally is untouched.
    const kept = { price: ["p-200-400"], cashback: ["cb-400"] };
    expect(dropOrphanedSelections(kept, FILTER_VERTICALS, null, "journey-gated")).toEqual(kept);
  });

  it("never grows the flat rail, whatever settles the vertical", () => {
    /*
     * 2026-09-09, on request: *"remove the behaviour of showing more filters
     * when a pv is selected, this is what we are launching now"*. `/userjourney`
     * moved to `"journey-flat"`, which is `JOURNEY_RAIL_ORDER` with the vertical
     * block switched off in every state.
     *
     * The same three inputs that grow the `"journey"` rail from 7 rows to 12 —
     * a ticked category, a settled vertical, both — are asserted to move
     * nothing here. Three, not one, because the two callers used to disagree
     * about which of them counted and that disagreement is the orphan trap.
     */
    const kartik = getKartikCatalog();
    const singles = singleValuedFacets(kartik);
    const flat = (category?: string[], settled: string | null = null) =>
      getRail(category, FILTER_VERTICALS, settled, "journey-flat", singles).map((r) => r.label);

    const SEVEN = [
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
    ];

    expect(flat()).toEqual(SEVEN);
    expect(flat(["womens-t-shirts"])).toEqual(SEVEN);
    expect(flat(undefined, "womens-t-shirts")).toEqual(SEVEN);
    expect(flat(["womens-t-shirts"], "womens-t-shirts")).toEqual(SEVEN);

    // The row it removes is exactly the vertical block, and nothing else: the
    // two rails agree outside a vertical and differ only inside one.
    const journey = (category?: string[], settled: string | null = null) =>
      getRail(category, FILTER_VERTICALS, settled, "journey", singles).map((r) => r.label);
    expect(journey()).toEqual(flat());
    expect(journey(["womens-t-shirts"], "womens-t-shirts")).not.toEqual(
      flat(["womens-t-shirts"], "womens-t-shirts"),
    );

    // `hideIfSingle` still works on it — the flat rail is the same array, so a
    // scope spanning several brands gets those three rows back.
    expect(getRail(undefined, FILTER_VERTICALS, null, "journey-flat").map((r) => r.label)).toEqual([
      "Price Range",
      "Margin on MRP",
      "MOQ",
      "Category",
      "Brands",
      "Seller",
      "Seller City",
      "Cashback",
      "Seller Offer",
      "SOLV Target Scheme",
    ]);
  });

  it("orphans an attribute cut on the flat rail in every state", () => {
    /*
     * The trap the flat rail opens, and the reason `dropOrphanedSelections`
     * stopped branching on `byCategory` (2026-09-09).
     *
     * On every other rail a ticked category *turns the attribute rows on*, so
     * the old early return could skip the attribute test there and be right. On
     * this one it doesn't, and a `?fit=slim` arriving with a category would have
     * survived with no control to show or undo it — surviving Clear Filters,
     * uncounted by the badge, quietly hiding products.
     */
    const withFit = { category: ["womens-t-shirts"], fit: ["slim"] };

    // `"journey"`: the rows are on, so the cut is reachable and stays.
    expect(dropOrphanedSelections(withFit, FILTER_VERTICALS, "womens-t-shirts", "journey"))
      .toEqual(withFit);

    // `"journey-flat"`: no row in any state, so it goes in every state.
    for (const settled of [null, "womens-t-shirts"]) {
      expect(
        dropOrphanedSelections(withFit, FILTER_VERTICALS, settled, "journey-flat"),
      ).toEqual({ category: ["womens-t-shirts"] });
      expect(
        dropOrphanedSelections({ fit: ["slim"] }, FILTER_VERTICALS, settled, "journey-flat"),
      ).toEqual({});
    }

    // Every one of the five, not just the one that reads well in a test.
    const all = {
      category: ["womens-t-shirts"],
      fit: ["slim"],
      neck: ["round-neck"],
      sleeve: ["half-sleeves"],
      pattern: ["solid"],
      closure: ["pullover"],
    };
    expect(
      dropOrphanedSelections(all, FILTER_VERTICALS, "womens-t-shirts", "journey-flat"),
    ).toEqual({ category: ["womens-t-shirts"] });

    // And nothing the rail *does* carry is touched by the new clause.
    const kept = { category: ["womens-t-shirts"], price: ["p-200-400"], cashback: ["cb-400"] };
    expect(dropOrphanedSelections(kept, FILTER_VERTICALS, "womens-t-shirts", "journey-flat"))
      .toEqual(kept);
  });

  it("gives each offer magnitude its own row, at the foot of the rail", () => {
    /*
     * 2026-09-07, second pass. They were merged behind one *All Offers* row
     * earlier the same day — a rail row can carry several facets and the panel
     * heads each group, which was the first request's own sketch — and the ask
     * reversed: three types of offer, three rows, last of all the filters.
     *
     * The chips are untouched and stay binary either way: they select `offers`
     * and `hasOffer`, which hold names, where these hold numbers, so the two
     * AND.
     */
    const singles = singleValuedFacets(getKartikCatalog());
    const rail = getRail(undefined, FILTER_VERTICALS, null, "journey", singles);

    // One facet each, and the last three rows in that order.
    expect(rail.slice(-3)).toEqual([
      { id: "cashback", label: "Cashback", facetIds: ["cashback"] },
      { id: "sellerOffer", label: "Seller Offer", facetIds: ["sellerOffer"] },
      { id: "targetScheme", label: "SOLV Target Scheme", facetIds: ["targetScheme"] },
    ]);

    // Last inside a vertical too, where five attribute rows arrive above them.
    const settled = getRail(["womens-t-shirts"], FILTER_VERTICALS, "womens-t-shirts", "journey", singles);
    expect(settled.slice(-3).map((r) => r.id)).toEqual([
      "cashback",
      "sellerOffer",
      "targetScheme",
    ]);
    expect(settled.at(-4)!.id).toBe("closure");

    // A–D's Offers row is untouched — a different pair of facets, and theirs
    // is the offer *names*.
    expect(getRail().find((r) => r.id === "offers")!.facetIds).toEqual([
      "hasOffer",
      "offers",
    ]);
    expect(rail.some((r) => r.id === "offers")).toBe(false);

    // The binary pair is still off this rail, so *Clear Filters* still needs
    // `clearsAlso` to reach a lit chip.
    const journey = getRailFacetIds(undefined, FILTER_VERTICALS, null, "journey", singles);
    expect(journey.has("hasOffer")).toBe(false);
    expect(journey.has("offers")).toBe(false);
    for (const id of ["cashback", "sellerOffer", "targetScheme"]) {
      expect(journey.has(id)).toBe(true);
    }
  });

  it("hides a row the buyer landed inside, and only from scope", () => {
    /*
     * `hideIfSingle` (2026-09-07): Brands, Seller and Seller City are dead
     * controls on a storefront carrying one brand in one city, and live
     * anywhere that spans more. Measured off the page's products, never off
     * the selections — a row that came and went as boxes were ticked is the
     * churn the 2026-08-19 reorder exists to prevent.
     */
    expect(singleValuedFacets(getKartikCatalog())).toEqual(
      new Set(["brand", "seller", "sellerCity"]),
    );
    // The main catalog spans ten brands, eight sellers and six cities.
    expect(singleValuedFacets(catalog)).toEqual(new Set());

    // Narrowing to one brand by *filtering* changes nothing: the rail is asked
    // about scope, and this is scope's answer either way.
    const oneBrand = applyFilters(catalog, { brand: ["killer"] });
    expect(singleValuedFacets(oneBrand)).toEqual(new Set(["brand"]));
    const rail = getRail(undefined, FILTER_VERTICALS, null, "journey", singleValuedFacets(catalog));
    expect(rail.map((r) => r.id)).toContain("brand");

    // A–D never set the flag, so their rail is unmoved whatever it is handed.
    expect(getRail().map((r) => r.id)).toEqual(
      getRail(undefined, FILTER_VERTICALS, null, "default", new Set(["brand", "seller"])).map(
        (r) => r.id,
      ),
    );
  });

  it("keeps one vertical-only set per rail", () => {
    /*
     * Size is vertical-only on A–D's rail, on the argument that M in menswear
     * is not M in womenswear. On 2026-09-07 the journey asked for it always,
     * which is what split `PV_FACET_IDS` per preset; on 2026-09-08 that route
     * dropped the row altogether, along with Colour.
     *
     * **The split now runs the other way round** (2026-09-09), and it is the
     * two Kartik rails that disagree rather than Kartik against A–D:
     *
     * - `"journey"` and `"journey-gated"` orphan a Size cut like A–D: both give
     *   Size a row once a vertical settles, one through the guided block's Size
     *   button and one through *Style Filters*.
     * - `"journey-flat"` keeps it: `/userjourney` has no Size control in any
     *   state, so `?size=m` is a hand-written URL nothing can strand, and the
     *   empty state's Clear Filters resolves it. Its set excludes Size by hand,
     *   Size having rejoined `JOURNEY_RAIL_ORDER` on 2026-09-10 for the other
     *   two.
     *
     * What differs is never whether a rail has a Size *row* outside a vertical
     * — none of the three has one — but whether anything on the page can show
     * or undo the cut inside one.
     */
    const singles = singleValuedFacets(getKartikCatalog());
    const journey = getRail(undefined, FILTER_VERTICALS, null, "journey", singles).map(
      (r) => r.id,
    );
    expect(journey).not.toContain("size");
    expect(journey).not.toContain("colour");
    // …outside a vertical. Inside one, Size is back since 2026-09-10.
    expect(getRail().map((r) => r.id)).not.toContain("size");
    expect(getRail(["womens-t-shirts"]).map((r) => r.id)).toContain("size");

    const sized = { size: ["m", "l"] };
    expect(dropOrphanedSelections(sized, FILTER_VERTICALS, null)).toEqual({});
    for (const preset of ["journey", "journey-gated"] as const) {
      expect(dropOrphanedSelections(sized, FILTER_VERTICALS, null, preset)).toEqual({});
      // Inside a settled vertical both keep it, the row being on screen.
      expect(
        dropOrphanedSelections(sized, FILTER_VERTICALS, "womens-t-shirts", preset),
      ).toEqual(sized);
    }
    expect(dropOrphanedSelections(sized, FILTER_VERTICALS, null, "journey-flat")).toEqual(sized);

    // The five garment attributes are vertical-only on every rail.
    const withFit = { fit: ["slim-fit"] };
    expect(dropOrphanedSelections(withFit, FILTER_VERTICALS, null, "journey")).toEqual({});
    expect(dropOrphanedSelections(withFit, FILTER_VERTICALS, null, "journey-flat")).toEqual({});
    expect(dropOrphanedSelections(withFit, FILTER_VERTICALS, null)).toEqual({});
  });

  it("still clears a facet whose chip outlived its rail row", () => {
    // The journey rail has no Offers row, but the strip keeps the three offer
    // chips. Clearing has to reach them or `All filters cleared` closes onto a
    // lit chip — so the clear scope is the rail *plus* what the listing shows.
    const rail = getRailFacetIds(undefined, FILTER_VERTICALS, null, "journey");
    const selections = { price: ["under-200"], offers: ["cashback"], hasOffer: ["any"] };

    // The rail alone would leave both offer selections standing.
    expect(clearSelections(selections, rail)).toEqual({
      offers: ["cashback"],
      hasOffer: ["any"],
    });

    // The rail plus the strip's own facets clears everything the buyer can see.
    const clearable = new Set([...rail, "hasOffer", "offers"]);
    expect(clearSelections(selections, clearable)).toEqual({});
  });

  it("drops the Price chip on request, leaving the offers", () => {
    // `/userjourney` again (2026-08-28). Price Range stays a rail facet, so
    // turning the chip off strands nothing — which is the reason this is
    // allowed where a chip-only facet would not be.
    const off = { verticals: false, price: false };
    const chips = contextChips(catalog, {}, FILTER_VERTICALS, off);

    expect(chips.map((c) => c.facetId)).toEqual(["offers", "hasOffer", "offers", "offers"]);
    expect(chips.some((c) => c.kind === "price")).toBe(false);
    expect(getRailFacetIds().has("price")).toBe(true);

    // Each flag is independent: price off alone keeps the verticals.
    expect(
      contextChips(catalog, {}, FILTER_VERTICALS, { price: false }).every(
        (c) => c.kind === "vertical",
      ),
    ).toBe(true);
  });

  it("filters and counts inside the vertical like any other page", () => {
    const hits = applyFilters(scope.products, { fit: ["slim-fit"] });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThan(scope.products.length);
    expect(hits.every((p) => p.fit === "Slim Fit")).toBe(true);

    // Counted against the scoped set, not the whole catalog.
    const necks = facetOptionsWithCounts(scope.products, {}, "neck");
    expect(necks.reduce((n, o) => n + o.count, 0)).toBe(scope.products.length);
    expect(necks.every((o) => o.label.includes("Collar"))).toBe(true);
  });
});

describe("sorting by price", () => {
  const catalog = getCatalog();

  it("runs high → low as the exact reverse of low → high", () => {
    const asc = sortProducts(catalog, "price_asc").map((p) => defaultVariant(p).pricePerPc);
    const desc = sortProducts(catalog, "price_desc").map((p) => defaultVariant(p).pricePerPc);

    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc).toEqual([...asc].reverse());
  });

  it("reads the pack the card prints, as low → high does", () => {
    const sizes = ["m", "l"];
    const hits = applyFilters(catalog, { size: sizes });
    const printed = sortProducts(hits, "price_desc", sizes).map(
      (p) => activeVariant(p, sizes).pricePerPc,
    );
    expect(printed).toEqual([...printed].sort((a, b) => b - a));
  });

  it("round-trips through the URL and is not the default", () => {
    expect(buildQuery({}, "price_desc")).toBe("?sort=price_desc");
    expect(parseSort(new URLSearchParams("sort=price_desc"))).toBe("price_desc");
  });
});

describe("a count the tap can honour", () => {
  const catalog = getCatalog();

  const BASES: Selections[] = [
    {},
    { price: ["p-900"] },
    { colour: ["white"], price: ["p-900"], closure: ["snap-button"] },
    { margin: ["m-60"], category: ["mens-formal-shirts"] },
    { size: ["m"], price: ["p-400"] },
    { category: ["womens-t-shirts"], size: ["s"] },
  ];

  it("counts a size on its own, the way every other facet is counted", () => {
    /*
     * The failure this exists for, measured 2026-08-19: colour=White,
     * price ₹600–900, closure=Snap Button left two products; the Size panel
     * offered 2XL as `(1)` and tapping it gave an empty page. Pack #1 of
     * `p-0079` is ₹610, inside the band, but the pack carrying 2XL is ₹575,
     * outside it — so picking the size moved the product out of a *price*
     * filter, which a tally taken with size ignored can't see.
     *
     * The count is the option applied *alone* alongside the other facets —
     * own-facet-excluded, exactly what the tally computes for everything else.
     * It is deliberately not `selected ∪ option`; see the bug below.
     */
    for (const base of BASES) {
      for (const option of facetOptionsWithCounts(catalog, base, "size")) {
        const alone = { ...base, size: [option.id] };
        expect(applyFilters(catalog, alone).length).toBe(option.count);
      }
    }
  });

  it("hides sizes the vertical doesn't carry, even once one is ticked", () => {
    /*
     * Reported 2026-08-20: pick Women's T-Shirts, open Filters, tick S — and
     * the panel started offering `2-3Y`, `4-5Y` and the rest of the kids' age
     * bands, which no adult vertical carries.
     *
     * The count had been `selected ∪ option`. Size is OR-within-a-facet, so a
     * union only ever widens: every unticked option inherited S's own count,
     * none could reach zero, and hide-at-zero stopped firing entirely.
     */
    const bands = /^\d+-\d+Y$/;
    const labels = (selections: Selections) =>
      facetOptionsWithCounts(catalog, selections, "size").map((o) => o.label);

    const women = { category: ["womens-t-shirts"] };
    expect(labels(women).some((l) => bands.test(l))).toBe(false);
    expect(labels({ ...women, size: ["s"] }).some((l) => bands.test(l))).toBe(false);
    // And the mirror: a kids' vertical offers no letters, ticked or not.
    const girls = { category: ["girls-t-shirts"] };
    expect(labels(girls).every((l) => bands.test(l))).toBe(true);
    expect(labels({ ...girls, size: ["4-5y"] }).every((l) => bands.test(l))).toBe(true);
  });

  it("never shows a count a tap would undershoot", () => {
    // Ticking widens, Size being OR-within-a-facet, so what the tap delivers is
    // always at least the number on the row — and never zero, which is the
    // guarantee the empty-page walk below leans on.
    for (const base of BASES) {
      for (const option of facetOptionsWithCounts(catalog, base, "size")) {
        if ((base.size ?? []).includes(option.id)) continue;
        const ticked = {
          ...base,
          size: [...new Set([...(base.size ?? []), option.id])],
        };
        expect(option.count).toBeGreaterThan(0);
        expect(applyFilters(catalog, ticked).length).toBeGreaterThanOrEqual(
          option.count,
        );
      }
    }
  });

  it("never lets a visible option lead to an empty page", () => {
    /*
     * Random walks that only ever tick what the UI is showing. Before the fix
     * above, 13 of 400 ended on "No products match".
     *
     * Kept to 60 × 12 with an explicit budget: every step re-counts every
     * facet, and Size now costs a filter pass per option, so the full 400 runs
     * for forty seconds. This is a slow guard by nature — it is here because
     * no single hand-written case would have found the bug.
     */
    const facetIds = [...new Set(getRail(["mens-formal-shirts"]).flatMap((r) => r.facetIds))];
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

    for (let walk = 0; walk < 60; walk += 1) {
      let selections: Selections = {};
      for (let step = 0; step < 12; step += 1) {
        const choices: { facetId: string; id: string }[] = [];
        for (const facetId of facetIds) {
          for (const option of facetOptionsWithCounts(catalog, selections, facetId)) {
            if (!(selections[facetId] ?? []).includes(option.id)) {
              choices.push({ facetId, id: option.id });
            }
          }
        }
        if (!choices.length) break;

        const pick = choices[Math.floor(rnd() * choices.length)];
        selections = {
          ...selections,
          [pick.facetId]: [...(selections[pick.facetId] ?? []), pick.id],
        };
        expect(applyFilters(catalog, selections).length).toBeGreaterThan(0);
      }
    }
  }, 30_000);
});
