import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { CATEGORIES } from "@/lib/catalog/seed";
import {
  applyFilters,
  countMatching,
  facetOptionsWithCounts,
  sameSelections,
  sortProducts,
  toggleSelection,
} from "./engine";
import { buildQuery, parseSelections, parseSort } from "./urlState";
import { FACET_BY_ID, getRail, getRailFacetIds } from "./facets";
import { defaultVariant } from "@/lib/catalog/types";

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

describe("the rail differs by variant, and only by Category", () => {
  it("keeps both facets in the engine either way", () => {
    expect(FACET_BY_ID.has("gender")).toBe(true);
    expect(FACET_BY_ID.has("category")).toBe(true);
    expect(countMatching(catalog, { gender: ["women"] })).toBeGreaterThan(0);
    expect(parseSelections(new URLSearchParams("gender=women"))).toEqual({
      gender: ["women"],
    });
  });

  it("Variant A shows Gender but not Category — the bottom bar owns Category", () => {
    const rail = getRail("bottom-bar");
    const owned = getRailFacetIds("bottom-bar");
    expect(owned.has("category")).toBe(false);
    expect(owned.has("gender")).toBe(true);
    expect(rail.some((r) => r.id === "category")).toBe(false);
    expect(rail[0].id).toBe("gender");
  });

  it("Variant B adds Category on top, and changes nothing else", () => {
    const rail = getRail("top-chips");
    const owned = getRailFacetIds("top-chips");
    expect(owned.has("category")).toBe(true);
    expect(owned.has("gender")).toBe(true);
    expect(rail[0].id).toBe("category");
    expect(rail[1].id).toBe("gender");
    // The rails differ by exactly one row.
    expect(rail.slice(1)).toEqual(getRail("bottom-bar"));
    expect(rail.length).toBe(getRail("bottom-bar").length + 1);
  });

  it("Variant A's Clear must not wipe the Category it never displayed", () => {
    const draft = {
      category: ["girls-t-shirts"],
      gender: ["women"],
      seller: ["grasim"],
      colour: ["navy"],
    };
    const owned = getRailFacetIds("bottom-bar");
    const cleared = Object.fromEntries(
      Object.entries(draft).filter(([id]) => !owned.has(id)),
    );
    // Gender goes, because A's rail shows it; Category survives, because the
    // bottom bar owns it.
    expect(cleared).toEqual({ category: ["girls-t-shirts"] });
  });

  it("Variant B's Clear does wipe Category too, because it shows it", () => {
    const draft = { category: ["girls-t-shirts"], gender: ["women"], seller: ["grasim"] };
    const owned = getRailFacetIds("top-chips");
    const cleared = Object.fromEntries(
      Object.entries(draft).filter(([id]) => !owned.has(id)),
    );
    expect(cleared).toEqual({});
  });

  it("Variant A's Filters badge counts gender but not the category the bar reports", () => {
    const selections = {
      category: ["girls-t-shirts", "womens-t-shirts"],
      gender: ["women"],
      seller: ["grasim"],
    };
    const owned = getRailFacetIds("bottom-bar");
    const badge = Object.entries(selections).reduce(
      (sum, [id, chosen]) => sum + (owned.has(id) ? chosen.length : 0),
      0,
    );
    // Gender and seller; the two categories are the Category badge's to show.
    expect(badge).toBe(2);
  });

  it("Category multi-selects, which is why its sheet needs an Apply", () => {
    const one = toggleSelection({}, "category", "mens-casual-shirts");
    expect(toggleSelection(one, "category", "mens-casual-t-shirts")).toEqual({
      category: ["mens-casual-shirts", "mens-casual-t-shirts"],
    });
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
