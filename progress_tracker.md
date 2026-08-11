# Progress Tracker

Last updated: 2026-08-11

## Flow 1 — seller PLP with working filter & sort

| # | Task | Status |
|---|---|---|
| 1 | Scaffold Next.js 16 + React 19 + Tailwind v4, Figma tokens, DeviceFrame | ✅ Done |
| 2 | Catalog types + 1,070 deterministic seeded products | ✅ Done |
| 3 | Filter engine + facet registry + 20 unit tests | ✅ Done |
| 4 | PLP shell — AppBar, GoldStrip, ProductCard, set pills, bottom bar | ✅ Done |
| 5 | Sort sheet + Gender sheet | ✅ Done |
| 6 | Filters screen — 12-facet rail, panels, live counts, draft/commit | ✅ Done |
| 7 | Home screen + navigation into the seller PLP | ✅ Done |
| 8 | Quick-filter chip bar, zero-results state, Figma comparison pass | ✅ Done |
| 9 | plan.md + progress_tracker.md | ✅ Done |

### Verified working

- Footer count recomputes live: `Show 1,070 results` → `Show 530 results` on ticking two sellers.
- Per-option counts recompute against the other facets, not their own.
- **Facet pruning:** selecting Girls removes *Formal Shirt* and *Ethnic Shirt* from Category (6 tiles → 4), footer `Show 210 results`.
- Selected-but-zero options stay visible so they can be unticked.
- Sort applies on tap and reorders correctly (price ascending, margin descending).
- Gender sheet stays in sync with the Gender facet under *More Filters*.
- URL reflects state — `?gender=men,boys&sort=margin_desc` — and the back button unwinds it.
- Set pills re-price their card.
- 20/20 engine tests green. No console or page errors on any screen.

## Flow 2 — search results across verticals

Blocked on designs. Engine work is already done: dynamic facet pruning is native, so this should be a catalog extension (footwear verticals, a search index) plus the search results screen.

| # | Task | Status |
|---|---|---|
| 10 | Receive search-flow designs | ⛔ Blocked — awaiting Figma frames |
| 11 | Extend catalog with footwear verticals (sandals, high heels, …) | ⬜ Not started |
| 12 | Search entry point + results screen | ⬜ Not started |
| 13 | Wire the existing filter engine to search results | ⬜ Not started |

## Facet tile imagery

- **Category** — real stock photos from Unsplash in `public/categories/`, credited in `public/categories/CREDITS.md`. Free under the Unsplash License.
  - `ethnic-shirt.jpg` is a weak match (warm knitwear flatlay, not Indian ethnic menswear). No suitable photo was reachable without an Unsplash API key.
- **Brands** — still the design's grey `#d9d9d9` placeholders. Real company logos could not be sourced: Clearbit's logo API is retired, and Wikipedia/Wikimedia search returned unrelated files for 7 of 8 brands. The right source is brand-supplied assets, which also avoids the trademark question of scraping logos.

## Open questions for review

1. The two undesigned facet panels — colour and the price/margin/MOQ buckets — reuse the checkbox row rather than introducing swatch grids or sliders. Confirm that's the right call, or supply designs.
2. Removable filter chips and the icon count badges are additions, not in the frames. Keep, or strip back to the design exactly?
3. `Offers` vs `Seller Offers` — the two filter frames disagree; currently using **Offers**.
4. The seller PLP is treated as a storefront aggregating multiple sellers, since the app bar says *Baheti Garments* while the Seller facet lists other companies. Confirm, or scope it to one seller and drop the Seller facet here.
5. A stray `$299.99` row sits at the bottom of the filter rail in Figma (`638:3712`) and was skipped as an artefact.
