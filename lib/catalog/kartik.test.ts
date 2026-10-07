import { describe, expect, it } from "vitest";
import { KARTIK, KARTIK_CATEGORY_IDS, ZENIFIT, getKartikCatalog } from "./kartik";
import { getCatalog } from "./products";
import { CATEGORIES } from "./seed";
import { applyFilters, facetOptionsWithCounts } from "@/lib/filters/engine";
import {
  dropOrphanedSelections,
  getRail,
  settledVertical,
  singleValuedFacets,
} from "@/lib/filters/facets";
import { parseSelections } from "@/lib/filters/urlState";

const kartik = getKartikCatalog();
const labelOf = (id: string) => CATEGORIES.find((c) => c.id === id)!.label;

describe("Kartik Exporters' catalog", () => {
  it("is tees only, in three verticals, all Zenifit", () => {
    expect(kartik).toHaveLength(540);
    expect(new Set(kartik.map((p) => p.brand))).toEqual(new Set([ZENIFIT]));
    expect(new Set(kartik.map((p) => p.category))).toEqual(
      new Set(KARTIK_CATEGORY_IDS.map(labelOf)),
    );
    expect(kartik.every((p) => p.sellerId === KARTIK.id)).toBe(true);
  });

  it("carries no girls' vertical, which is what makes the journey work", () => {
    // Gender → Women has to leave exactly one PV standing, or the Size row
    // never appears and the journey's S/M/L step has nothing to tap.
    expect(kartik.some((p) => p.gender === "girls")).toBe(false);
    const women = applyFilters(kartik, { gender: ["women"] });
    expect(women.length).toBeGreaterThan(0);
    expect(new Set(women.map((p) => p.category))).toEqual(
      new Set([labelOf("womens-t-shirts")]),
    );
  });

  it("leaves the main catalog untouched", () => {
    // The whole reason Kartik generates on its own PRNG streams. If this fails,
    // every count in docs/architecture.md has moved.
    const main = getCatalog();
    expect(main).toHaveLength(1070);
    expect(applyFilters(main, { gender: ["girls"] })).toHaveLength(108);
    expect(applyFilters(main, { gender: ["men"] })).toHaveLength(584);
    expect(main.some((p) => p.brand === ZENIFIT)).toBe(false);
    expect(main.some((p) => p.sellerId === KARTIK.id)).toBe(false);
  });

  it("reproduces the screengrabs' two title quirks", () => {
    const adult = kartik.filter((p) => p.gender !== "boys");
    const kids = kartik.filter((p) => p.gender === "boys");

    // The adult line lowercases the "s" and carries its fit; the kids' line
    // title-cases it and drops the fit. Both inferred from one sample each.
    expect(adult.every((p) => !p.title.includes("Sleeves"))).toBe(true);
    expect(kids.every((p) => !p.title.includes("sleeves"))).toBe(true);
    // Kids' garments read "Unisex", the screengrab's own word for a boys' tee.
    expect(kids.every((p) => p.title.includes("Zenifit Unisex "))).toBe(true);
    expect(adult.every((p) => /Zenifit (Women|Men)'s /.test(p.title))).toBe(true);
    // Every title still names the brand first and the colour last.
    for (const p of kartik) {
      expect(p.title.startsWith(`${ZENIFIT} `)).toBe(true);
      expect(p.title.endsWith(`, ${p.colour}`)).toBe(true);
    }
  });

  it("prices a cashback amount exactly when it carries the offer", () => {
    // The table widened on 2026-09-03 so the new Cashback *range* has more
    // than two values to range over; 100 and 200 still carry the weight, the
    // screengrab showing `₹100 Cashback`.
    for (const p of kartik) {
      if (p.offers.includes("Cashback")) {
        expect([50, 100, 150, 200, 300, 500]).toContain(p.cashback);
      } else {
        expect(p.cashback).toBeUndefined();
      }
    }
  });

  it("carries a seller-offer percentage and a scheme payout, only where the offer is", () => {
    /*
     * The other two offer magnitudes (2026-09-03). Each is set exactly where
     * its offer is — a value on a product without the offer would put it in the
     * first band of a filter it has no business matching.
     */
    for (const p of kartik) {
      if (p.offers.length) expect(p.sellerOfferPct).toBeGreaterThan(0);
      else expect(p.sellerOfferPct).toBeUndefined();

      if (p.offers.includes("SOLV Target Scheme")) {
        expect([200, 500, 1000, 2000, 5000]).toContain(p.targetScheme);
      } else {
        expect(p.targetScheme).toBeUndefined();
      }
    }

    // Both are spread over their tables rather than landing on one value — a
    // range over a single figure is four bands with three of them empty.
    expect(new Set(kartik.map((p) => p.sellerOfferPct)).size).toBeGreaterThan(4);
    expect(new Set(kartik.map((p) => p.targetScheme)).size).toBeGreaterThan(4);
  });

  it("keeps the offer magnitudes off the main catalog", () => {
    /*
     * They live on their own stream *and* on their own catalog. The main
     * catalog's card prints a cashback ribbon whenever it is given an amount,
     * so a figure there would change four signed-off variants — which is why
     * the three rail rows are `/userjourney`'s and not A–D's.
     */
    const main = getCatalog();
    expect(main.some((p) => p.cashback !== undefined)).toBe(false);
    expect(main.some((p) => p.sellerOfferPct !== undefined)).toBe(false);
    expect(main.some((p) => p.targetScheme !== undefined)).toBe(false);
  });

  it("leaves the 540 and every count on it where they were", () => {
    // What a fourth PRNG stream buys: the two new draws can't re-roll anything
    // already documented. If this fails, the streams got crossed.
    expect(kartik).toHaveLength(540);
    expect(applyFilters(kartik, { gender: ["women"] })).toHaveLength(191);
    expect(applyFilters(kartik, { category: ["mens-casual-t-shirts"] })).toHaveLength(221);
    expect(applyFilters(kartik, { category: ["boys-casual-t-shirts"] })).toHaveLength(128);
  });
});

describe("a vertical settled by scope, not by a Category tick", () => {
  const women = { gender: ["women"] };

  it("is recognised when a Gender cut leaves one vertical", () => {
    expect(settledVertical(kartik, women)).toBe("womens-t-shirts");
  });

  it("is null when the Gender cut still spans several", () => {
    // Men and boys are two verticals here, so nothing is settled.
    expect(settledVertical(kartik, { gender: ["men", "boys"] })).toBeNull();
    expect(settledVertical(kartik, {})).toBeNull();
  });

  it("still honours an explicit single category", () => {
    expect(settledVertical(kartik, { category: ["womens-t-shirts"] })).toBe(
      "womens-t-shirts",
    );
    // Two ticked is not one settled.
    expect(
      settledVertical(kartik, { category: ["womens-t-shirts", "mens-casual-t-shirts"] }),
    ).toBeNull();
  });

  it("respects a category selection while scanning gender", () => {
    // Both tees ticked, then narrowed to Women — one vertical stands.
    expect(
      settledVertical(kartik, {
        category: ["womens-t-shirts", "mens-casual-t-shirts"],
        gender: ["women"],
      }),
    ).toBe("womens-t-shirts");
  });

  it("ignores facets that only narrow incidentally", () => {
    // A colour or a price band must not grow the rail by five rows — see the
    // 2026-08-19 "rail stops rearranging itself" decision.
    const oneColourOneVertical = { colour: ["black"] };
    expect(settledVertical(kartik, oneColourOneVertical)).toBeNull();
  });

  it("puts Size and the attribute block on the rail", () => {
    const settled = settledVertical(kartik, women);
    const rail = getRail(undefined, undefined, settled).map((r) => r.id);
    expect(rail).toContain("size");
    for (const id of ["fit", "pattern", "sleeve", "neck", "closure"]) {
      expect(rail).toContain(id);
    }
    // Gender keeps its row: it is the control holding this cut.
    expect(rail).toContain("gender");
  });

  it("has nothing for a Brands, Seller or Seller City row to offer", () => {
    /*
     * Why all three rows hide on this route. You are already inside one seller,
     * one brand and one city here, so none of them can do anything but name it
     * — the same dead-control test that took Gender off C and D. Measured, so
     * that a catalog change which makes them live again fails here rather than
     * silently leaving the journey three controls short.
     *
     * They left the rail by hand on 2026-09-03 and came back on 2026-09-07 as
     * `hideIfSingle`, which is the same answer arrived at from scope — and
     * which is what closes the empty Brands panel of open question 4a.
     */
    expect(facetOptionsWithCounts(kartik, {}, "seller")).toEqual([]);
    expect(facetOptionsWithCounts(kartik, {}, "sellerCity")).toEqual([
      { id: "tiruppur", label: "Tiruppur", count: kartik.length },
    ]);
    // Zenifit is not one of `BRANDS`' ten, so the panel drew nothing at all.
    expect(facetOptionsWithCounts(kartik, {}, "brand")).toEqual([]);

    const singles = singleValuedFacets(kartik);
    expect(singles).toEqual(new Set(["brand", "seller", "sellerCity"]));

    const rail = getRail(
      undefined,
      undefined,
      settledVertical(kartik, women),
      "journey",
      singles,
    ).map((r) => r.id);
    expect(rail).not.toContain("brand");
    expect(rail).not.toContain("seller");
    expect(rail).not.toContain("sellerCity");
  });
});

describe("the orphan guard no longer erases the cut that narrowed scope", () => {
  it("keeps a Gender selection that settled the vertical", () => {
    const selections = { gender: ["women"], size: ["m"], fit: ["slim-fit"] };
    const settled = settledVertical(kartik, selections);
    expect(dropOrphanedSelections(selections, undefined, settled)).toEqual(selections);
  });

  it("still drops Gender when a Category tick made it redundant", () => {
    // Unchanged behaviour: the selection was implied by the vertical.
    const selections = { category: ["womens-t-shirts"], gender: ["women"] };
    const settled = settledVertical(kartik, selections);
    expect(dropOrphanedSelections(selections, undefined, settled)).toEqual({
      category: ["womens-t-shirts"],
    });
  });

  it("drops the attributes when the Gender cut goes", () => {
    const widened = { size: ["m"], fit: ["slim-fit"] };
    const settled = settledVertical(kartik, widened);
    expect(settled).toBeNull();
    expect(dropOrphanedSelections(widened, undefined, settled)).toEqual({});

    /*
     * **`"journey-flat"` alone keeps Size** — one rule read three ways: strip a
     * cut only where something on the page could have shown it.
     *
     * `/userjourney` has no Size control in any state, so nothing is stranded.
     * `/pvfilters` and `/pvfilters2` both give Size a row once a vertical
     * settles — the guided block's Size button on one, *More Filters* on the
     * other — so a cut left behind when the buyer widens is orphaned there.
     * The garment attribute goes on all three.
     */
    expect(dropOrphanedSelections(widened, undefined, settled, "journey-flat")).toEqual({
      size: ["m"],
    });
    for (const preset of ["journey", "journey-gated"] as const) {
      expect(dropOrphanedSelections(widened, undefined, settled, preset)).toEqual({});
    }
  });

  it("round-trips a shared link whose Gender cut settles the vertical", () => {
    const params = new URLSearchParams("gender=women&size=s,m,l");
    // Without the page's products the guard can't see the settled vertical, so
    // Size is stripped — that is the old behaviour and the bug this fixes.
    expect(parseSelections(params)).toEqual({ gender: ["women"] });
    expect(parseSelections(params, undefined, kartik)).toEqual({
      gender: ["women"],
      size: ["s", "m", "l"],
    });
  });
});
