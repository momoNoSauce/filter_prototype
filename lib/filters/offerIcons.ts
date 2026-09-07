/**
 * The offers' art, in one place.
 *
 * Split out of `ContextChips` on 2026-09-07, when the Filters panel's merged
 * *All Offers* row headed each of its three band groups with the same icon the
 * strip's chip carries — the `SORT_ICONS` precedent, a table two surfaces draw.
 * That panel lasted an hour: the magnitudes went back to a row each, the rail
 * label names each panel, and the headings and their art came off with the
 * merge.
 *
 * **The chip strip is the only caller again, and this stays the art's one
 * home.** It is data rather than markup, and the paths are what a second
 * surface would need: `cashback.png` (48×37) and `seller-offer.png` (48×48)
 * have almost no headroom above the 20px they draw at and are logged as wanting
 * vectors, so when those arrive this is the one file to edit. The
 * facet-keyed lookup the panel used is in git history.
 *
 * They live in `public/offers/`, not `public/figma/`: they were supplied rather
 * than exported from a frame, and a folder shouldn't imply an origin the file
 * doesn't have.
 */
const ART = {
  cashback: "/offers/cashback.png",
  sellerOffer: "/offers/seller-offer.png",
  /*
   * Supplied 2026-08-28, hours after the chip itself — a blue ring under an
   * orange arc, 240×240 with alpha, and the one offer icon with real headroom.
   * The old `gold-*.svg` exports were **not** used as a stand-in while it was
   * outstanding: they went with the GOLD branding on 2026-08-19, and the scheme
   * kept its name without it.
   */
  targetScheme: "/offers/solv-target-scheme.png",
  freeDelivery: "/offers/free-delivery.png",
  /*
   * Replaced on 2026-08-20 with a supplied bare ₹ — 48×48, transparent, ink
   * 27×38, drawn in `#004FFA`, which is the `primary` token exactly — where it
   * had been a filled blue disc with a white ₹ knocked out of it.
   */
  price: "/offers/price.png",
} as const;

/**
 * The strip's chips, keyed by **facet and option**.
 *
 * Both parts of the key, because Seller Offer's option id is the bare `any` —
 * it is the catch-all on its own `hasOffer` facet — and a one-word id like that
 * is exactly the sort another facet acquires later.
 */
export const OFFER_CHIP_ICONS: Record<string, string> = {
  "hasOffer:any": ART.sellerOffer,
  "offers:cashback": ART.cashback,
  "offers:free-delivery": ART.freeDelivery,
  "offers:solv-target-scheme": ART.targetScheme,
};

/** Price opens a sheet rather than toggling a value, and keeps its icon in both states. */
export const PRICE_CHIP_ICON = ART.price;
