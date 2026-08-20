import { getCatalog, STOREFRONT } from "./products";
import { CATEGORIES, SELLERS } from "./seed";
import type { Product } from "./types";

/**
 * The product set behind a vertical-scoped PLP — variants C and D.
 *
 * Both the seller and the vertical are **page scope**, not selections. The
 * seller already worked this way; the vertical joining it is what lets the
 * Category row leave the rail without leaving a filter no control can undo.
 *
 * Shared by both routes so the two can't drift, and so the pruning rule for
 * the storefront is stated once: Baheti aggregates several sellers, so it is
 * scoped by vertical alone.
 */
export function verticalScope(sellerId: string, categoryId: string) {
  const seller = SELLERS.find((s) => s.id === sellerId);
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!seller || !category) return null;

  const catalog = getCatalog();
  const products = catalog.filter(
    (p) =>
      p.category === category.label &&
      (sellerId === STOREFRONT.id || p.sellerId === sellerId),
  );

  // A seller who stocks nothing in this vertical has no page, rather than a
  // page reading "No products match" with no filter to blame it on.
  return products.length ? { seller, category, products } : null;
}

/**
 * Every seller/vertical pair that actually has stock.
 *
 * 56 pairs at most, and as of the 2026-08-20 seed fix all 56 have stock — the
 * filter is kept because it is the guarantee, not because it currently drops
 * anything. Before that fix Tiruppur Knit House, the smallest seller, carried
 * no Girl's T-Shirts and the count was 55 here while Vercel's older Node built
 * 56; that divergence is what the fix removed.
 */
export function verticalRoutes(): { sellerId: string; categoryId: string }[] {
  return SELLERS.flatMap((seller) =>
    CATEGORIES.filter((c) => verticalScope(seller.id, c.id)).map((c) => ({
      sellerId: seller.id,
      categoryId: c.id,
    })),
  );
}

/**
 * What `/c` and `/d` land on. Baheti is the storefront the whole demo walks
 * through, and Men's Formal Shirts is the richest shirt vertical — 168
 * products, every collar and closure populated.
 */
export const DEMO_VERTICAL = {
  sellerId: STOREFRONT.id,
  categoryId: "mens-formal-shirts",
} as const;

export type VerticalScope = NonNullable<ReturnType<typeof verticalScope>>;
export type { Product };
