/**
 * The offers' art, in one place.
 *
 * Split out of `ContextChips` on 2026-09-07, for the reason `SORT_ICONS` moved
 * to `sortIcons.ts` on 08-28: the chip strip is no longer the only surface that
 * draws these. The Filters panel's merged *All Offers* row heads each of its
 * three band groups with the same icon the strip's chip carries, so a buyer
 * ticking `₹200 – ₹400` under a wallet is looking at the control they already
 * met at the top of the listing.
 *
 * One set of file paths, two lookups over it. `cashback.png` (48×37) and
 * `seller-offer.png` (48×48) have almost no headroom above the 20px they draw
 * at and are logged as wanting vectors — when they arrive, this is the one file
 * to edit.
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

/**
 * The three offer **magnitude** facets, for the *All Offers* panel's headings.
 *
 * Keyed by facet id alone: these are numbers on their own facets, not options
 * on a shared one. `hasOffer` and `offers` are deliberately absent — they are
 * A–D's Offers panel, where one heading is a catch-all and the other is a list
 * of five different offers, so a single icon would be labelling the wrong
 * thing. Text-only headings there; a lookup miss simply draws no art.
 */
export const OFFER_FACET_ICONS: Record<string, string> = {
  cashback: ART.cashback,
  sellerOffer: ART.sellerOffer,
  targetScheme: ART.targetScheme,
};
