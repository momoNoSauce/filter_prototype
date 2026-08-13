# SOLV — Filter & Sort Prototype

A runnable Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which don't exist in the product today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products and a working faceted-search engine behind the designed UI.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
```

Deploys to Vercel with zero configuration.

---

## The two variants

Home → tap *Baheti Garments* → PLP → filter and sort. Two control layouts over that same journey:

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/[sellerId]` | Category · Sort · Filters pinned to the bottom (Figma `638:2836`); Category is a multi-select sheet and so leaves A's rail |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | Sort and Filter chips under the GOLD strip (Figma `644:4011`), no bottom bar, so Category is a Filters-rail facet instead |

Gender is a rail facet in both, so the two rails differ by exactly one row.

Card, catalog, engine and sheets are shared — one `PlpScreen` with a `variant` prop, one `HomeScreen` with a `basePath` prop. Only the controls differ, so any preference between them is about control placement and nothing else.

Separate routes rather than a query flag: each variant gets its own shareable link, neither inherits the other's state, and no switcher UI intrudes on a screen being judged.

Each variant is a **closed loop** — hand someone `/b` and the entire journey stays in B. `HomeScreen`'s seller cards and `AppBar`'s home button both route through the variant's base path rather than hardcoding `/`.

---

## Design source

Figma `Filter-and-Sort` — `hdArN93DmnLu5JDB46SOwd`, section `651:4873`. Everything was pulled via the Figma MCP (`get_design_context`), not eyeballed from screenshots.

| Node | Screen |
|---|---|
| `628:1620` | Home |
| `638:2718` | PLP base |
| `644:4435` | Sort By sheet |
| `644:4470` | Gender sheet |
| `638:3659` | Filters sheet (rail + panel) |
| `644:4011` | Sort/Filter chip bar |
| `644:4000` | Filters → Seller |

Design width **360px**. Tokens are mapped into `app/globals.css` under `@theme` using their Figma variable names: `primary/default #004FFA`, `primary/subtle #CCDCFE`, `text/heading #1A1C1F`, `Secondary/Orange-500 #FF7711`, `Orange-400 #FF923F`.

Fonts: **Roboto** throughout, **Inter** for button labels only (`Clear Filters`, `Show N results`), **Rowdies** for the GOLD wordmark — all three are in the design.

All icons and images are the exact assets exported from Figma, in `public/figma/`. Nothing was redrawn.

Reference PNG exports of the frames above sit in `design/`, which is **gitignored** — unreleased design work, and nothing in the app serves it. Don't rely on that folder being present in a fresh clone; pull frames from Figma instead. The assets the app *does* serve (`public/figma/`, `public/categories/`) are tracked and must stay that way, or a Git-triggered build would ship without images.

---

## Architecture

No backend. A deterministic seeded catalog plus a pure filter engine, all client-side, so filtering is instant.

### The engine — `lib/filters/engine.ts`

Two functions do the real work:

- **`applyFilters(products, selections, skipFacetId?)`** — OR within a facet, AND across facets.
- **`facetOptionsWithCounts(products, selections, facetId)`** — counts a facet's options against every *other* facet's selections, never its own.

That second rule is the whole thing. Counting a facet against its own selections would zero out every unselected option the moment you ticked one, and the panel would collapse. Excluding it is what makes ticking *Grasim* still show a live count for *Gagan*, while *Girls* correctly erases *Men's Formal Shirts* from Category.

Options that fall to zero are hidden. Anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### Facet registry — `lib/filters/facets.ts`

Fourteen facets behind twelve rail entries (*More Filters* stacks Fabric and Product Tags). Each facet declares `valuesOf(product) → string[]`, so range buckets, multi-valued delivery windows and plain checkboxes all flow through one code path. Adding a facet is one array entry.

`FACETS` is everything the engine knows about; `getRail(variant)` is what the Filters screen displays, which differs by variant — and differs *only* in whether it carries Category and Gender at the top.

The one row that differs is **Category**: it is the bottom bar's quick action in A, so the bar owns it there. Listing it in both places would put one facet behind two controls and double-report it, once as the Category badge and again inside the Filters count. **Gender** is in both rails — largely redundant now that every category names its audience, but a faster cut than ticking three tiles, and dropping it would leave `?gender=` links with no UI.

`getRailFacetIds(variant)` is the set that anything mutating the draft (notably Clear Filters) must filter through, so a facet the screen doesn't show can never be cleared by it.

Panels: Category and Brands use the tile grid (68×96 cells, 56px tile, fixed 36px two-line label reserved whether or not it's used, so a row's tiles align); Colour is a checkbox row with a 16px colour dot; Price Range, Margin and MOQ are checkbox rows over preset buckets (no slider — that would add a control the design system doesn't have); everything else is the designed checkbox row.

### State — `lib/filters/urlState.ts`

Filter state lives in the query string: `?gender=men,boys&seller=grasim&sort=margin_desc`. Local state is the source of truth and the URL is mirrored via `history.pushState`, which keeps filtering instant while still giving a working back button and shareable links to any combination.

### Catalog — `lib/catalog/`

1,070 garment products (matching the design's "Show 1,070 results"), from a fixed-seed PRNG so counts never shift between reloads or between server and client. 7 categories, 4 genders, 8 sellers, 10 brands, 10 colours, 3 pack types, 6 fabrics; each product carries 2–4 pack variants driving the card's set pills.

The seven categories come from the merchandising list and **name their audience**: Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts. Category → gender is therefore 1:1 rather than many-to-many, which makes pruning sharper, not weaker — picking *Girls* leaves one tile of seven (97 results) and *Men* leaves three (575).

| Category | Products | Price band /pc |
|---|---|---|
| Women's T-Shirts | 180 | ₹150 – ₹450 |
| Men's Formal Shirts | 163 | ₹260 – ₹1,150 |
| Men's Casual T-Shirts | 243 | ₹160 – ₹480 |
| Men's Casual Shirts | 169 | ₹220 – ₹780 |
| Girl's T-Shirts | 97 | ₹110 – ₹320 |
| Boy's Casual Shirts | 101 | ₹150 – ₹430 |
| Boy's Casual T-Shirts | 117 | ₹110 – ₹330 |

Price bands are per-category rather than one blanket rule, so kids' lines sit below adult ones and formal above casual and the Price Range facet has something to separate. Men's Formal Shirts reaches ₹1,150 to keep the top bucket (`₹900 & above`, 37 products) populated — all five price buckets and all four margin buckets are live.

Brands are category-restricted too, kids' lines carrying the fewest: Boy's Casual T-Shirts collapses the Brands grid to two tiles.

### Device frame — `components/DeviceFrame.tsx`

Below 480px the app renders edge to edge and reads as the real thing. At 480px and above the untouched 360×800 app sits inside a CSS phone mockup, so no Figma dimension ever has to stretch.

---

## Decisions taken where the designs were silent

Several of these were revised during review — the current state is what's listed.

| # | Question | Decision |
|---|---|---|
| 1 | Facet counts | Footer total **and** per-option counts both recompute live on every tick. Zero-count options are hidden; anything selected stays visible even at zero. |
| 2 | Sort sheet | Tapping a row applies and closes — the design has no Apply button. |
| 3 | Bottom bar slot 1 | **Category**, replacing Gender (2026-08-13). The categories name their audience now, so gender stopped earning a control of its own. Figma's frame says Gender; this is a deliberate departure. `tag.svg` stands in as the icon — the design has no Category bar slot and so no glyph for one, and this one is already the Sort sheet's *Recently Added* icon. Wants a designed replacement. |
| 3a | Category | **A:** a multi-select quick action in the bottom-bar sheet, with a draft and a `Clear all` / `Show N results` footer — a retailer plausibly wants Men's Casual Shirts *and* Men's Casual T-Shirts, so "tap applies and closes" would be wrong here even though it was right for Gender. Absent from A's rail, because the bar owns it. **B:** an ordinary rail facet, first. The sheet reuses the Filters screen's `TileGrid`, so cell geometry can only change in one place; being wider than the 240px panel, it wraps four across instead of three. |
| 3b | Gender | An ordinary multi-select rail facet in **both** variants — first in A's rail, second in B's, a checkbox in each. It briefly had no control in A at all, on the grounds that the categories name their audience; put back because redundant isn't useless, it is a faster cut than ticking three tiles, and `?gender=` links need somewhere to show. The single-select `GenderSheet` stayed deleted — the bottom-bar slot it lived in belongs to Category now. |
| 4 | Set pills | Selectable. Picking a pack updates that card's MRP, price/pc, margin and set size. Dots track scroll pages. |
| 16 | Contextual chips | Defined 2026-08-13, having been reserved and empty since the start. The strip below the GOLD bar answers whichever question is still open: **not inside a single product vertical** (none picked, or several) it offers the verticals; **inside exactly one** it offers price bands, then Seller Offer, Cashback and Free Delivery. Both variants — in B after the divider `644:4011` already draws for it, in A as the whole strip, which collapses when empty. Chips write the same facets as everything else, so tapping one is just a shortcut, and the Filters badge and Category badge pick it up as they would any other route. Selection logic is pure, in `lib/filters/contextChips.ts`. |
| 17 | Seller Offer | Means *any offer at all* — its own `hasOffer` facet, not a fifth option inside `offers`, because inside it OR-within-a-facet would make Seller Offer widen a Cashback selection instead of narrowing it. Listed in the Offers rail entry so a chip-applied filter is still clearable once the strip moves on. The three offer chips appear only when some but not all products in scope carry the offer; price bands and verticals keep the plain hide-at-zero rule. `Free Shipping` was renamed `Free Delivery` to match. |
| 18 | Chip design | Material 3 filter chips, as asked: 32dp, 8dp corner, outline unselected, filled with a leading checkmark when selected, 14sp Medium, in this app's palette. Known mismatch: M3's 8dp corner sits beside the frame's fully-rounded Sort and Filter pills in B. Labels carry no counts, per M3. |
| 5 | Applied-filter cue | Carried by the controls themselves, in both variants: a **dot** for anything holding one value (Sort), a **count** for anything that can hold many (Category in A, Filters always). Category is excluded from A's Filters count since it reports itself. Removable filter chips were built and then removed on request — in Variant A that strip is reserved for contextual chips, still undefined. |
| 6 | Clear Filters scope | Clears only the facets that variant's rail owns. In A category survives it — clearing a filter from a screen that never displayed it would be a silent surprise — while gender is cleared, because A's rail shows it. In B both are cleared. The Category sheet's own `Clear all` clears category and nothing else, by the same rule. |
| 7 | Seller facet on a seller PLP | The app bar says *Baheti Garments* while the Seller facet lists Heeralal, Gagan, Grasim. Treated as a **storefront aggregating multiple sellers**, so the whole catalog is in scope there. Every other seller page is scoped to its own stock. |
| 8 | `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers**. |
| 9 | Undesigned facet panels | Only Category (tile grid, reworked 2026-08-12 to 68×96 cells with a 56px tile and a two-line label) and Seller (checkbox list) are designed. Brands was moved to the tile grid on request; the rest reuse the checkbox row rather than introducing sliders or swatch grids the design system doesn't have. Colour adds a 16px dot before the label; price/margin/MOQ use bucket rows. |
| 13 | Category ids | Declared in the catalog, not slugged from the label — slugging *Women's T-Shirts* would put `women-s-t-shirts` in the URL and in the image filename. Products store the display label and the facet maps back through `CATEGORY_ID_BY_LABEL`. |
| 14 | Product titles | Use a gender-free `plural`, so a card reads "… Casual T-Shirts for Boys" rather than "… Boy's Casual T-Shirts for Boys". Tested. |
| 10 | Zero results | Not designed. A centred "No products match" with a *Clear Filters* button. |
| 11 | Home seller cards | The design's third card is *Pawan footwear*, which has no catalog behind it, so Grasim Fabrics takes that slot and every card navigates somewhere real. Product counts are read from the catalog. |
| 12 | Sheet motion | Asymmetric — enter 260ms decelerate, exit 200ms accelerate, scrim 200/160ms, all collapsed to 1ms under `prefers-reduced-motion`. The sheet owns its own dismissal so it can animate out before unmounting. |
| 15 | Discarded drafts | Dismissing a draft surface without applying throws its edits away, and doing that silently reads as the filter being broken. Both the Category sheet (scrim, close button, Escape) and the Filters screen (✕) now raise a **`Selection discarded`** toast — the same string on both, since it is one event and two wordings would read as two different things. It fires only when edits would actually be lost: untouched, edited-back-to-start, and applied all stay quiet, decided by `sameSelections`. The toast is an addition (`components/ui/Toast.tsx`); its lifetime is its CSS animation, so the duration is declared once, and it sits 72px up in A to clear the bottom bar, 24px in B. |

**Two things in the design that were deliberately not reproduced:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and the `Margin` rail label being SemiBold while its eleven siblings are Medium. Both read as artefacts. Say the word if either was intentional.

---

## Verification

- `npm test` — 20 tests over the engine: OR-within/AND-across, own-facet-excluded counting, the Girls pruning case, selected-but-zero staying visible, sort ordering, URL round-trip.
- `npm run dev`, then Chrome DevTools at exactly 360px, and compare each screen against its Figma frame.
- Widen past 480px to confirm the phone mockup appears and the app still renders at 360.

**Demo script (Variant A):** Home → Baheti Garments → Category → tick *Men's Casual Shirts* + *Men's Casual T-Shirts* → footer reads Show 412 results → apply, and the Category badge reads 2 while Filters stays bare, because the bar reports its own → Filters → Seller → tick Grasim + Gagan → counts shrink → Show results, Filters badge reads 2 → Sort → Highest Margin → order changes and a dot appears on Sort → Filters → Clear Filters (the two categories survive; their badge stays) → Category → Clear all. The URL tracks every step and the back button unwinds it.

**Facet pruning (Variant B, where Category and Gender share a rail):** Filters → Gender → Girls → Category → six of the seven tiles are gone, only *Girl's T-Shirts* stands. In A the same cut is Filters → Gender → Girls, then Category from the bottom bar.

**Brand pruning (either variant):** Category → *Boy's Casual T-Shirts* → Filters → Brands → the grid drops from ten tiles to two (Killer, Monte Carlo), 117 results.
