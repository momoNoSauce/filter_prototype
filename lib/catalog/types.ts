export type Gender = "men" | "women" | "boys" | "girls";

/**
 * A purchasable pack configuration. These drive the "SET OF 6 / M/2, L/2, XL/2"
 * pills on the product card — picking one changes the price, MRP and margin
 * shown on that card.
 */
export interface Variant {
  setOf: number;
  /** The sizes this pack carries, in size order — `["M", "L", "XL"]`. */
  sizes: string[];
  /** `size/qty`, comma-joined — "M/6" or "M/2, L/2, XL/2". Sums to `setOf`. */
  sizeBreakup: string;
  /** MRP per piece — the card labels it `MRP/PC` */
  mrp: number;
  pricePerPc: number;
  marginPct: number;
  shippingFee: number;
}

export interface Product {
  id: string;
  title: string;
  image: string;
  brand: string;
  /**
   * The display label — "Men's Formal Shirts", "Girl's T-Shirts". The labels
   * name their audience, so this determines `gender` rather than varying
   * independently of it.
   */
  category: string;
  gender: Gender;
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  colour: string;
  colourHex: string;
  /**
   * No longer a filter — the Pack Type facet was removed 2026-08-19. Keep the
   * field: its draw sits in the middle of the seeded sequence, so deleting it
   * re-rolls the whole catalog and moves every documented count. It also still
   * decides pack composition, a *Solid Size Pack* carrying one size for the
   * whole carton where the others spread across the product's size run.
   */
  packType: string;
  fabric: string;
  /**
   * Attributes belonging to the product vertical rather than the catalog:
   * shirts draw collars and plackets, tees draw necklines and pullovers. The
   * Filters rail only offers them once a single vertical is settled — across
   * verticals they would mix *Spread Collar* with *Round Neck*.
   */
  fit: string;
  neck: string;
  sleeve: string;
  pattern: string;
  closure: string;
  /** Minimum order quantity, in pieces */
  moq: number;
  deliveryDays: number;
  offers: string[];
  /**
   * The rupee value on a Cashback offer, which the journey's card prints twice
   * — an orange corner ribbon and a pill under the price. Optional because only
   * Kartik's storefront carries amounts: the main catalog's cards name the
   * offer without pricing it, and inventing a figure there would change four
   * signed-off variants. Set only when `offers` includes "Cashback".
   */
  cashback?: number;
  bestSeller: boolean;
  /** Days since listing — lower is newer. Drives "Recently Added". */
  listedDaysAgo: number;
  /** Drives "Popularity" */
  popularity: number;
  variants: Variant[];
}

export interface Seller {
  id: string;
  name: string;
  city: string;
}

/**
 * The pack a card opens on, and whose price, margin and MOQ drive filter and
 * sort — **unless a size is selected**, in which case `activeVariant` moves
 * both to the first pack carrying that size. See `lib/filters/activeVariant.ts`.
 */
export function defaultVariant(product: Product): Variant {
  return product.variants[0];
}
