import { describe, expect, it } from "vitest";

import { getCatalog } from "./products";
import { buildVariants, mulberry32 } from "./seed";

/**
 * The catalog must be the same catalog on every engine.
 *
 * `buildVariants` once shuffled the set sizes with `sort(() => rand() - 0.5)`.
 * A comparator returning a coin flip is not a consistent ordering function, so
 * V8 may walk the array however it likes — and both the order it lands on and
 * the number of `rand()` calls it consumes are implementation-defined. Because
 * this draws from the *main* stream inside the per-product loop, a differing
 * draw count re-rolled every product after it.
 *
 * That shipped. Vercel builds on Node 24 and development runs on Node 26, and
 * the two produced different catalogs from the same seed: 55 vertical routes
 * here against 56 there, `Men` 575 against 590, five of the seven category
 * counts apart. Every test passed on the machine that wrote it.
 *
 * A test can't run two engines, so it pins the property that made the drift
 * possible instead: **how many draws a product takes must be fixed by the
 * inputs, never by a comparator's answers.**
 */
describe("the seed is engine-independent", () => {
  /** Draws per `buildVariants` call: 1 for `count`, 4 to shuffle the five set
   *  sizes, then 3 per pack — margin, breakup roll, shipping fee. */
  const expected = (count: number) => 1 + 4 + 3 * count;

  it("takes a draw count fixed by the inputs, not by comparator answers", () => {
    const run = ["S", "M", "L", "XL"];

    for (let seed = 0; seed < 400; seed += 1) {
      for (const solid of [false, true]) {
        const rand = mulberry32(seed);
        let draws = 0;
        const counted = () => {
          draws += 1;
          return rand();
        };

        const variants = buildVariants(counted, run, solid, 400, 40);
        expect(draws).toBe(expected(variants.length));
      }
    }
  });

  it("gives the same answer twice from the same seed", () => {
    // Cheap, and it would catch any hidden module-level state that made the
    // first call differ from the second.
    const once = buildVariants(mulberry32(7), ["S", "M", "L"], false, 500, 45);
    const twice = buildVariants(mulberry32(7), ["S", "M", "L"], false, 500, 45);
    expect(once).toEqual(twice);
  });

  /**
   * The counts every other test and both docs quote. They moved once when the
   * shuffle was fixed — the price of making them true everywhere rather than
   * only on the machine that measured them — and are now identical on Node 24
   * and Node 26, verified by running this suite under both.
   */
  it("holds the documented shape of the catalog", () => {
    const catalog = getCatalog();
    expect(catalog).toHaveLength(1070);

    const byCategory = Object.fromEntries(
      catalog.reduce((acc, product) => {
        acc.set(product.category, (acc.get(product.category) ?? 0) + 1);
        return acc;
      }, new Map<string, number>()),
    );

    expect(byCategory).toEqual({
      "Women's T-Shirts": 173,
      "Men's Formal Shirts": 168,
      "Men's Casual T-Shirts": 222,
      "Men's Casual Shirts": 194,
      "Girl's T-Shirts": 108,
      "Boy's Casual Shirts": 98,
      "Boy's Casual T-Shirts": 107,
    });
  });
});
