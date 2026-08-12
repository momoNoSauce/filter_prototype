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
- **Categories replaced** (2026-08-12) with the seven from the merchandising list — Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts. New tile photos, rebuilt brand↔category map, per-category price bands, gender-free product titles.

### Verified working

- Footer count recomputes live: `Show 1,070 results` → `Show 530 results` on two sellers.
- Per-option counts recompute against other facets, not their own.
- **Facet pruning:** Girls cuts Category from 7 tiles to 1 (*Girl's T-Shirts*, 97 results); Men cuts it to 3 (575). *Boy's Casual T-Shirts* cuts Brands from 10 tiles to 2.
- Selected-but-zero options stay visible so they can be unticked.
- Gender: tap applies + closes; picking another replaces; re-tapping the active one clears.
- Clear Filters does **not** wipe Gender.
- Sort dot appears on non-default sort and clears on return to Popularity.
- Sheet motion measured frame by frame: enter decelerates (92→29→12→4px steps), exit accelerates (10→34→73→171px), then unmounts.
- URL reflects state (`?gender=girls&sort=margin_desc`); back button unwinds it.
- 27 engine tests green. Lint and typecheck clean. No console errors on any screen, local or production.

## Variant B — top chips instead of a bottom bar

An A/B of control placement, added 2026-08-12. Same card, catalog, engine and sheets; only the controls differ, so the comparison stays honest.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/baheti` | Gender · Sort · Filters at the bottom |
| **Variant B** | `/b` | `/b/seller/baheti` | Sort + Filter chips at the top, no bottom bar; Gender in the Filters rail |

Switching is by URL — chosen over an on-screen toggle so nothing that isn't product chrome appears on a screen being judged.

Each variant is a **closed loop**: hand someone `/b` and the whole journey — home, seller card, PLP, home button — stays in B. `HomeScreen` takes a `basePath`, `AppBar` takes a `homeHref`; both must be kept in step when adding routes, or a session leaks into the other variant mid-demo with no visible cause.

Verified: no bottom bar in B; both chips open their sheets; chips carry the same active vocabulary as the bottom bar (dot for Sort, count for Filter); Gender sits second in B's rail and multi-selects (`?gender=men,boys`) while A's sheet still replaces (`?gender=boys`); `/b` → seller card → `/b/seller/baheti` → home → `/b`; Variant A unchanged and equally self-contained.

Open: the reference image is a *category* PLP ("Cotton Casual Shirt") with a different card — pipe-separated `MRP ₹1000 | Pack Size 1pc`, single-size pills, 4 dots, and no share icon in the app bar. Deliberately **not** built, to keep the A/B to one variable. Say if the card should change, and whether it applies to both variants.

## UX backlog — from the design review

Ordered by consequence. None of these block a demo.

1. **Applied filters are hard to read on the PLP.** Three active filters render as one small count on a 24px icon. Scroll away and back and you can't tell what's constraining the list. The contextual-chips plan should close this — **contextual chips are still undefined; ask before building that strip.**
2. **Contrast failures**, inherited from the Figma, on the three numbers a retailer actually reads. All fail even the 3:1 large-text bar, and two are set at 9px:
   | Text | Colour | Ratio | AA needs |
   |---|---|---|---|
   | MRP / Price per pc / shipping | `#999999` | 2.85:1 | 4.5:1 |
   | `65% margin` | `#39B54A` | 2.66:1 | 4.5:1 |
   | `VIEW DETAILS` | `#FF7711` | 2.53:1 | 4.5:1 |
   Audience is kirana retailers on mid-range Android in poor light. Worth darkening before this becomes the build spec.
3. **In Variant A, Gender renders as a checkbox but behaves exclusively** (Variant B is genuinely multi-select, so this only affects A's sheet). Deliberate — visual consistency over strict semantics — but it is the one combination that misleads.
10. **The variants now differ in more than control placement.** A treats gender as a single-select quick action, B as a regular multi-select facet. Coherent per control model, but it means a stated preference for B can't be attributed to the chips alone. Worth naming when running it past people.
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
   - **Gender is now redundant as a filter.** Every category names its audience, so ticking *Girls* and ticking *Girl's T-Shirts* do the same thing. Gender still earns its place as a faster top-level cut, but it is worth deciding whether it stays a facet or becomes purely the Variant A quick action.
   - **Product card renders are button-up shirts** while four of seven categories are tees. Only two shirt renders exist in Figma; tee renders would need exporting.
1. **What are the contextual chips?** That strip renders nothing until defined.
2. Gender's checkbox-but-exclusive mismatch — which way do you want it resolved?
3. `Offers` vs `Seller Offers` — the two filter frames disagree; currently **Offers**.
4. Baheti Garments is treated as a storefront aggregating multiple sellers, since the app bar says Baheti while the Seller facet lists other companies. Confirm, or scope it to one seller and drop the Seller facet there.
5. A stray `$299.99` row sits at the bottom of the filter rail in Figma (`638:3712`) and was skipped as an artefact; `Margin` is SemiBold while its eleven rail siblings are Medium.
