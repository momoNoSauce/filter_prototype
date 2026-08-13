# Progress Tracker

Last updated: 2026-08-12

Live: **https://filterprototype.vercel.app** (public, no login). Redeploy with `npx vercel --prod`.
Source: **https://github.com/cheeseKracker/filter_prototype** (private).
Local: `npm run dev` → http://localhost:3000.

> **GitHub and Vercel are not connected.** `vercel --prod` uploads straight from
> the local folder; a `git push` deploys nothing and a deploy commits nothing.
> Both have to be run. Connecting the repo at
> `vercel.com/bitihotra-karaks-projects/filter_prototype/settings/git` collapses
> this to one step — browser-only, the CLI can't do it.

> **`design/` is gitignored.** The source Figma PNGs stay local: unreleased
> design work, and nothing serves them. `public/figma/` and `public/categories/`
> stay tracked — the app needs them at runtime.

## Build log

| # | Task | Status |
|---|---|---|
| 1 | Scaffold Next.js 16 + React 19 + Tailwind v4, Figma tokens, DeviceFrame | ✅ Done |
| 2 | Catalog types + 1,070 deterministic seeded products | ✅ Done |
| 3 | Filter engine + facet registry + unit tests | ✅ Done |
| 4 | PLP shell — AppBar, GoldStrip, ProductCard, set pills, bottom bar | ✅ Done |
| 5 | Sort sheet + Gender sheet | ✅ Done |
| 6 | Filters screen — 12-facet rail, panels, live counts, draft/commit | ✅ Done |
| 7 | Home screen + navigation into the seller PLP | ✅ Done |
| 8 | Zero-results state, Figma comparison pass | ✅ Done |
| 9 | Deploy to Vercel | ✅ Done |

### Review revisions (all shipped)

- Active Sort/Gender row tints its **icon** to primary, not just the label. Sheet row dividers fixed (they were collapsing to zero width under `items-start`).
- Sort/Filter chips and applied-filter chips **removed** from the strip below the GOLD bar — reserved for contextual chips.
- Gender CTA renamed **"Clear all"**; the Filters screen keeps "Clear Filters".
- Brands moved to the **tile grid**, matching Category.
- Gender in Variant B moved **into the Filters rail** (second) as an ordinary multi-select facet, since B has no bottom bar to host it. Variant A keeps it as a single-select bottom-bar sheet. The `single` flag left the facet registry — exclusivity is a property of the control, not the facet.
- Tile grid **enlarged** to the updated Figma frame: 68×96 cells, 56px tile, fixed 36px two-line label.
- **Category tile photos** added (Unsplash).
- Tile selected state: primary ring + 50% primary veil + white check + bold label.
- Gender in Variant A is **single-select, bottom-bar only** — Apply/Clear footer dropped, tap applies and closes, absent from A's rail.
- **Sort dot** when sorted away from Popularity; Gender dot; Filters count (excludes Gender).
- **Bottom sheet enter/exit animation**, asymmetric timing, reduced-motion aware.
- **Category replaced Gender in A's bottom bar** (2026-08-13), as a *multi-select* sheet with a `Clear all` / `Show N results` footer — Gender's tap-applies-and-closes was right for one value, not for many. Category left A's rail so one facet isn't behind two controls. `getRail`/`getRailFacetIds` now take the variant instead of an `includeGender` boolean.
- **Contextual chips built** (2026-08-13), filling the strip that had been reserved and empty since the start. Product-vertical chips until a single vertical is settled; then the picked vertical stays at the head of the strip, followed by Price, Seller Offer, Cashback and Free Delivery. Both variants; in B they follow the divider the frame already draws. New `hasOffer` facet for the catch-all, `Free Shipping` renamed `Free Delivery`, and `discriminatingOptions` hides an offer every product already carries.
- **Vertical chips now come from Figma `674:4904`.** Two earlier cuts were built from a screenshot and then from the M3 spec, both wrong; the frame existed all along and should have been asked for. Actual spec: 32px on a 4px corner, circular 26.7 × 27.8 avatar, 11px two-line label, 0.5px `#4d4d4d` outline unselected, filled with a primary label and the exported `close_small` glyph when selected. Its ✕ is the only way out of a vertical without opening Filters.
  **Note the frame keeps the label when selected**, where the written instruction had said the text should go away. Followed the frame — worth confirming. **Price became a dropdown** rather than a chip per band: an anchored multi-select menu with counts, applying live, rendered at the screen root because the strip's horizontal scroll would clip it.
- **`Selection discarded` toast** (2026-08-13), on **both** draft surfaces. Dismissing the Category sheet or closing the Filters screen mid-edit used to throw the draft away in silence, which reads as the filter being broken. Fires on every dismissal route and only when edits would actually be lost, decided by the shared `sameSelections`. One string across both, on request — it is one event. New `components/ui/Toast.tsx`; lifetime is the CSS animation so the duration is declared once, and the offset follows the variant (72px in A to clear the bar, 24px in B).
- **Category sheet grid rebalanced** to five across (2026-08-13). Left-aligned 68px cells fit only four in the 360px sheet and stranded an empty column at the right; a `fill` layout now divides the width instead — 8px insets, 2px column gap, cells at 67.2px. The 240px filter panel is untouched and still pixel-exact to the frame at three across, 68px. Fixing the width surfaced a real bug: `h-[36px]` and `line-clamp-2` on the same span meant the explicit height beat the clamp, so *Men's Formal Shirts* cropped mid-glyph at three lines rather than ellipsising. The reserved height moved to a wrapper; verified with an over-long label that it now ellipsises cleanly.
- **Gender moved into A's Filters rail**, heading it. It was briefly dropped from A altogether as redundant; put back because it is still a faster cut than ticking three category tiles, and `?gender=` links need somewhere to show. The two rails now differ by exactly one row, Category. The single-select `GenderSheet.tsx` stayed deleted — the bar slot it lived in belongs to Category.
- **Categories replaced** (2026-08-12) with the seven from the merchandising list — Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts. New tile photos, rebuilt brand↔category map, per-category price bands, gender-free product titles.

### Verified working

- Footer count recomputes live: `Show 1,070 results` → `Show 530 results` on two sellers.
- Per-option counts recompute against other facets, not their own.
- **Facet pruning:** Girls cuts Category from 7 tiles to 1 (*Girl's T-Shirts*, 97 results); Men cuts it to 3 (575). *Boy's Casual T-Shirts* cuts Brands from 10 tiles to 2.
- Selected-but-zero options stay visible so they can be unticked.
- Category sheet in A: multi-selects, footer total tracks the draft, apply writes `?category=mens-casual-shirts,mens-casual-t-shirts` and the bar badge reads 2 while Filters stays bare.
- Contextual chips, both variants: none picked → the seven vertical chips with thumbnails; one picked → that chip leads with its ✕, then Price and the three offers; a second vertical → back to the full vertical list. Ticking Cashback correctly drops the Seller Offer chip, every remaining product having an offer.
- Price dropdown: opens anchored under its chip, ticking two bands writes `price=p-200,p-400` and the closed chip reads `Price (2)`. Girl's T-Shirts offers only the two bands its ₹110–320 range reaches; Men's Formal Shirts keeps `₹900 & above`. Anchoring clamps to the frame when the chip has scrolled right.
- The green ✕ removes the vertical and leaves other filters standing — `price=…` survives, and stays reachable because Price Range is a rail facet in both variants.
- Discard toast on the Category sheet, all seven cases: scrim / close X / Escape after a selection each toast; untouched dismiss, tick-then-untick, and apply each stay silent; the toast clears itself by 3.2s.
- Discard toast on the Filters screen, both variants: edit then ✕ toasts; untouched ✕, `Show N results`, and tick-then-Clear-Filters (net zero) each stay silent. In B it sits 24px off the bottom, there being no bar to clear.
- A's rail is Gender plus the eleven common entries; B's is the same list with Category added on top. Exactly one row apart.
- Clear Filters does **not** wipe Category in A (the bar owns it) but does wipe Gender (the rail shows it); the Category sheet's `Clear all` wipes only Category.
- Sort dot appears on non-default sort and clears on return to Popularity.
- Sheet motion measured frame by frame: enter decelerates (92→29→12→4px steps), exit accelerates (10→34→73→171px), then unmounts.
- URL reflects state (`?gender=girls&sort=margin_desc`); back button unwinds it.
- 27 engine tests green. Lint and typecheck clean. No console errors on any screen, local or production.

## Variant B — top chips instead of a bottom bar

An A/B of control placement, added 2026-08-12. Same card, catalog, engine and sheets; only the controls differ, so the comparison stays honest.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/baheti` | Category · Sort · Filters at the bottom; Gender heads the Filters rail |
| **Variant B** | `/b` | `/b/seller/baheti` | Sort + Filter chips at the top, no bottom bar; Category and Gender both in the Filters rail |

Switching is by URL — chosen over an on-screen toggle so nothing that isn't product chrome appears on a screen being judged.

Each variant is a **closed loop**: hand someone `/b` and the whole journey — home, seller card, PLP, home button — stays in B. `HomeScreen` takes a `basePath`, `AppBar` takes a `homeHref`; both must be kept in step when adding routes, or a session leaks into the other variant mid-demo with no visible cause.

Verified: no bottom bar in B; both chips open their sheets; chips carry the same active vocabulary as the bottom bar (dot for Sort, count for Filter); Gender sits second in B's rail and multi-selects (`?gender=men,boys`) while A's sheet still replaces (`?gender=boys`); `/b` → seller card → `/b/seller/baheti` → home → `/b`; Variant A unchanged and equally self-contained.

Open: the reference image is a *category* PLP ("Cotton Casual Shirt") with a different card — pipe-separated `MRP ₹1000 | Pack Size 1pc`, single-size pills, 4 dots, and no share icon in the app bar. Deliberately **not** built, to keep the A/B to one variable. Say if the card should change, and whether it applies to both variants.

## UX backlog — from the design review

Ordered by consequence. None of these block a demo.

1. **Applied filters are hard to read on the PLP.** Three active filters render as one small count on a 24px icon. Scroll away and back and you can't tell what's constraining the list. *Partly closed 2026-08-13:* the contextual chips are defined and built, and a selected chip shows its own state inline — but only for the facets the strip currently offers, so a seller or delivery filter is still just a number on an icon.
2. **Contrast failures**, inherited from the Figma, on the three numbers a retailer actually reads. All fail even the 3:1 large-text bar, and two are set at 9px:
   | Text | Colour | Ratio | AA needs |
   |---|---|---|---|
   | MRP / Price per pc / shipping | `#999999` | 2.85:1 | 4.5:1 |
   | `65% margin` | `#39B54A` | 2.66:1 | 4.5:1 |
   | `VIEW DETAILS` | `#FF7711` | 2.53:1 | 4.5:1 |
   Audience is kirana retailers on mid-range Android in poor light. Worth darkening before this becomes the build spec.
10. **The variants still differ in more than control placement, but by less than they did.** The gap is now one facet: A reaches Category from the bottom bar, B from the rail. Everything else, Gender included, is identical. A stated preference for B is closer to being about the chips alone than at any earlier point, though not purely so.
    *Resolved along the way:* A's checkbox-that-behaves-exclusively Gender mismatch is gone — Gender is an ordinary multi-select rail facet in both variants now, so no control claims exclusivity anywhere.
4. **Tiles show no counts** while every checkbox row does — you can't judge whether a category is worth tapping.
5. **Hidden zero-count options** are right for the pruning demo but break the user's mental map; most Indian ecommerce greys out instead. A conscious call, not an inherited default.
6. **No loading / skeleton / stale-results state anywhere.** Filtering is instant only because the catalog is in memory; against a real API it won't be, and the prototype is quietly setting an expectation engineering can't meet.
7. **Touch targets** below guideline: sheet close X is 15px, set pills 40px (both from the design).
8. **Accessibility**, if this becomes the reference build: filter rows use `aria-pressed` where `role="checkbox"` + `aria-checked` is correct; sheets don't trap focus; the scrim is a full-viewport `<button>` announced as a giant "Close".
9. **Pagination dots under the set pills** imply snapping the free-scrolling row doesn't do.

## Facet tile imagery

- **Category** — Unsplash photos in `public/categories/`, credited in `CREDITS.md`. Re-shot 2026-08-12 for the seven new categories: all worn on a model, since each category names its audience and at 56px a person reads faster than a flat-lay, and picked for seven distinct dominant colours. `boys-casual-t-shirts.jpg` carries an incidental Levi's wordmark, unreadable at tile size — swap it if it bothers anyone.
- **Brands** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced: Clearbit's logo API is retired, and Wikipedia/Wikimedia returned unrelated files for 7 of 8 brands. Brand-supplied assets are the right input, and avoid the trademark question of scraping logos.

## Open questions for the designer

0. **Three things fell out of the new category list** (2026-08-12), none blocking:
   - **Apostrophes are inconsistent** — "Men's" and "Women's" are plural possessives, but "Girl's" and "Boy's" are singular. Set verbatim as supplied rather than silently corrected; say the word and they become "Girls'" / "Boys'".
   - ~~**Gender is now redundant as a filter.**~~ Settled 2026-08-13: kept as a rail facet in **both** variants, since it is still a faster cut than ticking three category tiles. A's bottom-bar slot went to Category instead.
   - **Product card renders are button-up shirts** while four of seven categories are tees. Only two shirt renders exist in Figma; tee renders would need exporting.
1. ~~**What are the contextual chips?**~~ **Answered and built 2026-08-13.** Product-vertical chips until a single vertical is settled, then price bands, Seller Offer, Cashback and Free Delivery. Two things to confirm now that it is on screen: the M3 8dp corner sits beside the frame's rounded Sort/Filter pills in B — say if the pill should win; and *Seller Offer* meaning "any offer" makes it disappear once Cashback is ticked, because every remaining product then has an offer. Correct per the rule, but worth seeing before it is settled.
2. **A Category glyph for the bottom bar.** The frame's first slot was Gender (`wc.svg`); it now holds Category and is borrowing `tag.svg`, which is also the Sort sheet's *Recently Added* icon. An exported Category icon would settle it.
3. `Offers` vs `Seller Offers` — the two filter frames disagree; currently **Offers**.
4. Baheti Garments is treated as a storefront aggregating multiple sellers, since the app bar says Baheti while the Seller facet lists other companies. Confirm, or scope it to one seller and drop the Seller facet there.
5. A stray `$299.99` row sits at the bottom of the filter rail in Figma (`638:3712`) and was skipped as an artefact; `Margin` is SemiBold while its eleven rail siblings are Medium.
