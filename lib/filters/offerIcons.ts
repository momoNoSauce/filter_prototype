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
 * surface would need, so a replacement is one line here — which is what
 * `seller-offer.png` took on 2026-09-08. `cashback.png` (48×37) is now the only
 * one with no headroom above the 20px it draws at and the only one still logged
 * as wanting a vector. The facet-keyed lookup the panel used is in git history.
 *
 * They live in `public/offers/`, not `public/figma/`: they were supplied rather
 * than exported from a frame, and a folder shouldn't imply an origin the file
 * doesn't have.
 */
const ART = {
  cashback: "/offers/cashback.png",
  /*
   * **Phosphor's `SealPercent`**, supplied 2026-09-08 — a percent sign inside a
   * seal, replacing a blue parcel that read as *delivery* on the one chip that
   * means *discount*. 48×48 with alpha, as its predecessor was.
   *
   * Two things about it worth keeping. It is **one colour, and that colour is
   * the `primary` token exactly** — measured `#004FFA` across 417 of its 418
   * opaque pixels, the odd one an anti-aliased `#0050FA` — so like `price.png`
   * it is the sort of icon that *could* go through `MaskIcon` if it ever has to
   * tint. It doesn't today: the chip's selected state replaces the art with a
   * checkmark rather than recolouring it. And being from a released icon set,
   * **its vector exists upstream** rather than needing to be drawn, so the
   * "wants vectors" note against this file is closed by a download whenever
   * someone wants it.
   */
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
