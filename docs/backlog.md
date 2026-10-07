# Backlog

Open items only. None of them block a demo.

## UX issues

1. **The listing doesn't name applied filters.** It shows only a count on the
   Filter control. The proposed fix is removable chips (`Black ✕`,
   `Under ₹200 ✕`, *Clear all*), not built yet.
2. **Contrast:** MRP and price-per-pc text is `#7F7F7F` at 12px, which is
   4.0:1. AA needs 4.5:1.
3. **Zero-count options are hidden**, not greyed out.
4. **No loading, skeleton or stale-results state.** Filtering is instant only
   because the catalog is in memory.
5. **Touch targets below guideline:** sheet close ✕ is 15px; set pills are 40px.
6. **The home seller card's stat line is 12px**, limited by the 152px card
   width.
7. **Accessibility:**
   - Filter rows use `aria-pressed` instead of `role="checkbox"` +
     `aria-checked`.
   - Sheets don't trap focus.
   - The scrim is a full-viewport `<button>` announced as "Close".
8. **The pagination dots under the set pills suggest snapping**, but the row
   scrolls freely.
9. **Clear Filters also resets Sort**, in every variant.
10. **Fullscreen on tap doesn't work on iOS Safari.** It would need a web app
    manifest (Add to Home Screen).

## Open design questions

1. **`/pvfilters2` locked panel copy:** the heading reads
   `6 style filters locked` under a row named *More Filters*, and the six
   filters aren't named until a category is picked.
2. **Pattern icon:** missing on the `/pvfilters` style buttons, which show a
   placeholder. To add it, put the file in `public/style/` and add one entry to
   `STYLE_FACET_ICONS`.
3. **Style button size:** currently 46px button / 34px icon / 13px label. The
   alternative is 52 / 40 / 15.
4. **Category apostrophes:** *Girl's* / *Boy's* are used as supplied. The
   alternative is *Girls'* / *Boys'*.
5. **Offers label:** the Figma frames disagree between `Offers` and
   `Seller Offers`. The build uses **Offers**.
6. **Baheti Garments on A–D** is treated as a storefront with several sellers.
   Confirm, or reduce it to one seller and remove the Seller facet there.
7. **Card details from the live app:**
   - Price is ~24px in the live app and 26px here, following Figma.
   - The live app uses both `SET of:` and `Set of:`. The build uses `SET of:`.
8. **Category-PLP reference card:** the reference shows a different card
   (`MRP ₹1000 | Pack Size 1pc`, single-size pills). Should C/D, or all four
   variants, adopt it?
9. **Seller Offer chip:** it disappears once Cashback is ticked, because every
   remaining product then has an offer.
10. **Brand logos:** brand thumbnails are placeholders until brands supply
    assets.
11. **Category photo:** `boys-casual-t-shirts.jpg` shows a small Levi's
    wordmark. Replace it if needed.
