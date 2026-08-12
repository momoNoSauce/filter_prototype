import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog/products";
import { CATEGORIES } from "@/lib/catalog/seed";
import {
  applyFilters,
  countMatching,
  facetOptionsWithCounts,
  sortProducts,
  toggleSelection,
} from "./engine";
import { buildQuery, parseSelections, parseSort } from "./urlState";
import { FACET_BY_ID, RAIL_FACET_IDS } from "./facets";
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
    // Formal Shirt and Ethnic Shirt are never made for girls.
    const all = facetOptionsWithCounts(catalog, {}, "category");
    expect(all.map((o) => o.id)).toContain("formal-shirt");

    const forGirls = facetOptionsWithCounts(catalog, { gender: ["girls"] }, "category");
    const ids = forGirls.map((o) => o.id);
    expect(ids).not.toContain("formal-shirt");
    expect(ids).not.toContain("ethnic-shirt");
    expect(ids).toContain("long-kurta-set");
  });

  it("keeps a selected option visible even when its count reaches zero", () => {
    // Girls + Formal Shirt is an empty intersection, but the user must still be
    // able to untick Formal Shirt.
    const options = facetOptionsWithCounts(
      catalog,
      { gender: ["girls"], category: ["formal-shirt"] },
      "category",
    );
    const formal = options.find((o) => o.id === "formal-shirt");
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

  it("replaces rather than accumulates on a single-select facet", () => {
    const men = toggleSelection({}, "gender", "men", true);
    expect(men).toEqual({ gender: ["men"] });
    expect(toggleSelection(men, "gender", "women", true)).toEqual({
      gender: ["women"],
    });
  });

  it("clears a single-select facet when the active option is re-tapped", () => {
    const men = toggleSelection({}, "gender", "men", true);
    expect(toggleSelection(men, "gender", "men", true)).toEqual({});
  });
});

describe("gender is bottom-bar only", () => {
  it("is single-select", () => {
    expect(FACET_BY_ID.get("gender")?.single).toBe(true);
    expect(FACET_BY_ID.get("brand")?.single).toBeFalsy();
  });

  it("is absent from the Filters rail but present in the engine", () => {
    expect(RAIL_FACET_IDS.has("gender")).toBe(false);
    expect(FACET_BY_ID.has("gender")).toBe(true);
    // Still filters, still round-trips through the URL.
    expect(countMatching(catalog, { gender: ["women"] })).toBeGreaterThan(0);
    expect(parseSelections(new URLSearchParams("gender=women"))).toEqual({
      gender: ["women"],
    });
  });

  it("survives the Filters screen's Clear, which only owns rail facets", () => {
    const draft = { gender: ["women"], seller: ["grasim"], colour: ["navy"] };
    const cleared = Object.fromEntries(
      Object.entries(draft).filter(([id]) => !RAIL_FACET_IDS.has(id)),
    );
    expect(cleared).toEqual({ gender: ["women"] });
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
