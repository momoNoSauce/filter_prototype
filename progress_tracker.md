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

## Flow 1 — seller PLP with working filter & sort

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
- **Category tile photos** added (Unsplash).
- Tile selected state: primary ring + 50% primary veil + white check + bold label.
- Gender is now **single-select and bottom-bar only** — removed from the Filters rail entirely, Apply/Clear footer dropped, tap applies and closes.
- **Sort dot** when sorted away from Popularity; Gender dot; Filters count (excludes Gender).
- **Bottom sheet enter/exit animation**, asymmetric timing, reduced-motion aware.

### Verified working

- Footer count recomputes live: `Show 1,070 results` → `Show 530 results` on two sellers.
- Per-option counts recompute against other facets, not their own.
- **Facet pruning:** Girls removes *Formal Shirt* and *Ethnic Shirt* from Category (6 tiles → 4).
- Selected-but-zero options stay visible so they can be unticked.
- Gender: tap applies + closes; picking another replaces; re-tapping the active one clears.
- Clear Filters does **not** wipe Gender.
- Sort dot appears on non-default sort and clears on return to Popularity.
- Sheet motion measured frame by frame: enter decelerates (92→29→12→4px steps), exit accelerates (10→34→73→171px), then unmounts.
- URL reflects state (`?gender=girls&sort=margin_desc`); back button unwinds it.
- 26 engine tests green. Lint and typecheck clean. No console errors on any screen, local or production.

## Variant B — top chips instead of a bottom bar

An A/B of control placement, added 2026-08-12. Same card, catalog, engine and sheets; only the controls differ, so the comparison stays honest.

| | Route | Controls |
|---|---|---|
| **Variant A** | `/seller/baheti` | Gender · Sort · Filters at the bottom |
| **Variant B** | `/b/seller/baheti` | Sort + Filter chips at the top, no bottom bar, no Gender |

Switching is by URL — chosen over an on-screen toggle so nothing that isn't product chrome appears on a screen being judged.

Verified: no Gender control and no bottom bar in B; both chips open their sheets; chips carry the same active state as the bottom bar (dot for Sort, count for Filter); a stale `?gender=` from Variant A is dropped on load; Variant A is unchanged.

Open: the reference image is a *category* PLP ("Cotton Casual Shirt") with a different card — pipe-separated `MRP ₹1000 | Pack Size 1pc`, single-size pills, 4 dots, and no share icon in the app bar. Deliberately **not** built, to keep the A/B to one variable. Say if the card should change, and whether it applies to both variants.

## The search flow — results across verticals

> Originally called "flow 2"; that name now means Variant B. Referred to here as the search flow.

Blocked on designs. Engine work is done: dynamic facet pruning is native, so this should be a catalog extension (footwear verticals, a search index) plus the search results screen.

| # | Task | Status |
|---|---|---|
| 10 | Receive search-flow designs | ⛔ Blocked — awaiting Figma frames |
| 11 | Extend catalog with footwear verticals (sandals, high heels, …) | ⬜ Not started |
| 12 | Search entry point + results screen | ⬜ Not started |
| 13 | Wire the existing filter engine to search results | ⬜ Not started |

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
3. **Gender renders as a checkbox but behaves exclusively.** Deliberate (visual consistency vs. the single-select decision) but it is the one combination that misleads. Flip to genuine multi-select, or give it radio semantics.
4. **Tiles show no counts** while every checkbox row does — you can't judge whether a category is worth tapping.
5. **Hidden zero-count options** are right for the pruning demo but break the user's mental map; most Indian ecommerce greys out instead. A conscious call, not an inherited default.
6. **No loading / skeleton / stale-results state anywhere.** Filtering is instant only because the catalog is in memory; against a real API it won't be, and the prototype is quietly setting an expectation engineering can't meet.
7. **Touch targets** below guideline: sheet close X is 15px, set pills 40px (both from the design).
8. **Accessibility**, if this becomes the reference build: filter rows use `aria-pressed` where `role="checkbox"` + `aria-checked` is correct; sheets don't trap focus; the scrim is a full-viewport `<button>` announced as a giant "Close".
9. **Pagination dots under the set pills** imply snapping the free-scrolling row doesn't do.

## Facet tile imagery

- **Category** — Unsplash photos in `public/categories/`, credited in `CREDITS.md`. `ethnic-shirt.jpg` is a weak match (warm knitwear flatlay, not Indian ethnic menswear); no suitable photo was reachable without an Unsplash API key.
- **Brands** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced: Clearbit's logo API is retired, and Wikipedia/Wikimedia returned unrelated files for 7 of 8 brands. Brand-supplied assets are the right input, and avoid the trademark question of scraping logos.

## Open questions for the designer

1. **What are the contextual chips?** That strip renders nothing until defined.
2. Gender's checkbox-but-exclusive mismatch — which way do you want it resolved?
3. `Offers` vs `Seller Offers` — the two filter frames disagree; currently **Offers**.
4. Baheti Garments is treated as a storefront aggregating multiple sellers, since the app bar says Baheti while the Seller facet lists other companies. Confirm, or scope it to one seller and drop the Seller facet there.
5. A stray `$299.99` row sits at the bottom of the filter rail in Figma (`638:3712`) and was skipped as an artefact; `Margin` is SemiBold while its eleven rail siblings are Medium.
