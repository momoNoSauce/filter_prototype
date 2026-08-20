import { describe, expect, it } from "vitest";
import { KARTIK, KARTIK_CATEGORY_IDS, ZENIFIT, getKartikCatalog } from "./kartik";
import { getCatalog } from "./products";
import { CATEGORIES } from "./seed";
import { applyFilters } from "@/lib/filters/engine";
import {
  dropOrphanedSelections,
  getRail,
  settledVertical,
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
    // every count in plan.md and progress_tracker.md has moved.
    const main = getCatalog();
    expect(main).toHaveLength(1070);
    expect(applyFilters(main, { gender: ["girls"] })).toHaveLength(97);
    expect(applyFilters(main, { gender: ["men"] })).toHaveLength(575);
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
    for (const p of kartik) {
      if (p.offers.includes("Cashback")) expect([100, 200]).toContain(p.cashback);
      else expect(p.cashback).toBeUndefined();
    }
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
