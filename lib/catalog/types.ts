export type Gender = "men" | "women" | "boys" | "girls";

/**
 * A purchasable pack configuration. These drive the "Set of 4 / M, L, XL, 2XL"
 * pills on the product card — picking one changes the price, MRP and margin
 * shown on that card.
 */
export interface Variant {
  setOf: number;
  /** e.g. "M, L, XL, 2XL" or "XS×2,S×2" */
  sizeBreakup: string;
  /** MRP per piece */
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
  /** The product vertical — Formal Shirt, Partywear, etc. */
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
