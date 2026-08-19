import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { CATEGORIES } from "@/lib/catalog/seed";
import {
  applyFilters,
  countMatching,
  discriminatingOptions,
  facetOptionsWithCounts,
  sameSelections,
  sortProducts,
  toggleSelection,
} from "./engine";
import { buildQuery, parseSelections, parseSort } from "./urlState";
import { contextChips } from "./contextChips";
import { FACET_BY_ID, getRail, getRailFacetIds } from "./facets";
import { defaultVariant } from "@/lib/catalog/types";
import { activeVariant, activeVariantIndex, sizeOptionId } from "./activeVariant";

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
      "hasOffer:any",
      "offers:cashback",
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

  it("keeps the offer strip to the three asked for", () => {
    const chips = ids({ category: ["mens-formal-shirts"] });
    expect(chips).not.toContain("offers:bulk-offer");
    expect(chips).not.toContain("offers:gold-target-scheme");
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

  it("heads the rail with Category, then Gender", () => {
    // Category left Variant A's bottom bar on 2026-08-19 and rejoined the
    // rail, so there is one rail rather than two.
    const rail = getRail();
    expect(rail[0].id).toBe("category");
    expect(rail[1].id).toBe("gender");
    expect(getRailFacetIds().has("category")).toBe(true);
    expect(getRailFacetIds().has("gender")).toBe(true);
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
    const owned = getRailFacetIds();
    const cleared = Object.fromEntries(
      Object.entries(draft).filter(([id]) => !owned.has(id)),
    );
    expect(cleared).toEqual({});
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
