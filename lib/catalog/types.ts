export type Gender = "men" | "women" | "boys" | "girls";

/**
 * A purchasable pack configuration. These drive the "SET OF 6 / M/2, L/2, XL/2"
 * pills on the product card — picking one changes the price, MRP and margin
 * shown on that card.
 */
export interface Variant {
  setOf: number;
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
  packType: string;
  fabric: string;
  /** Minimum order quantity, in pieces */
  moq: number;
  deliveryDays: number;
  offers: string[];
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

/** The default pack — index 0 — supplies the values used for filter and sort. */
export function defaultVariant(product: Product): Variant {
  return product.variants[0];
}
