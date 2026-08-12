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
| **Variant A** | `/` | `/seller/[sellerId]` | Gender · Sort · Filters pinned to the bottom (Figma `638:2836`) |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | Sort and Filter chips under the GOLD strip (Figma `644:4011`), no bottom bar; Gender moves into the Filters rail |

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

`FACETS` is everything the engine knows about; `getRail(includeGender)` is what the Filters screen displays, which differs by variant. `gender` is in the rail only in Variant B — in A the bottom-bar sheet owns it, and listing it in both places would let the two disagree. `getRailFacetIds(includeGender)` is the set that anything mutating the draft (notably Clear Filters) must filter through, so a facet the screen doesn't show can never be cleared by it.

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
| 3 | Gender | Reached differently per variant. **A:** a single-select quick action in the bottom-bar sheet — journey mapping found nobody shops two genders at once — so the Apply/Clear footer is gone, a tap applies and closes like Sort, and re-tapping the active row clears it. Absent from A's rail. **B:** no bottom bar, so it becomes an ordinary multi-select facet sitting second in the Filters rail. Always rendered as a checkbox, never a radio. |
| 4 | Set pills | Selectable. Picking a pack updates that card's MRP, price/pc, margin and set size. Dots track scroll pages. |
| 5 | Applied-filter cue | Carried by the controls themselves, in both variants: a **dot** for anything holding one value (Gender, Sort), a **count** for Filters, which can hold many. Gender is excluded from that count since it reports itself. Removable filter chips were built and then removed on request — in Variant A that strip is reserved for contextual chips, still undefined. |
| 6 | Clear Filters scope | Clears only the facets that variant's rail owns. In A gender survives it — clearing a filter from a screen that never displayed it would be a silent surprise. In B gender is cleared, because B shows it. |
| 7 | Seller facet on a seller PLP | The app bar says *Baheti Garments* while the Seller facet lists Heeralal, Gagan, Grasim. Treated as a **storefront aggregating multiple sellers**, so the whole catalog is in scope there. Every other seller page is scoped to its own stock. |
| 8 | `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers**. |
| 9 | Undesigned facet panels | Only Category (tile grid, reworked 2026-08-12 to 68×96 cells with a 56px tile and a two-line label) and Seller (checkbox list) are designed. Brands was moved to the tile grid on request; the rest reuse the checkbox row rather than introducing sliders or swatch grids the design system doesn't have. Colour adds a 16px dot before the label; price/margin/MOQ use bucket rows. |
| 13 | Category ids | Declared in the catalog, not slugged from the label — slugging *Women's T-Shirts* would put `women-s-t-shirts` in the URL and in the image filename. Products store the display label and the facet maps back through `CATEGORY_ID_BY_LABEL`. |
| 14 | Product titles | Use a gender-free `plural`, so a card reads "… Casual T-Shirts for Boys" rather than "… Boy's Casual T-Shirts for Boys". Tested. |
| 10 | Zero results | Not designed. A centred "No products match" with a *Clear Filters* button. |
| 11 | Home seller cards | The design's third card is *Pawan footwear*, which has no catalog behind it, so Grasim Fabrics takes that slot and every card navigates somewhere real. Product counts are read from the catalog. |
| 12 | Sheet motion | Asymmetric — enter 260ms decelerate, exit 200ms accelerate, scrim 200/160ms, all collapsed to 1ms under `prefers-reduced-motion`. The sheet owns its own dismissal so it can animate out before unmounting. |

**Two things in the design that were deliberately not reproduced:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and the `Margin` rail label being SemiBold while its eleven siblings are Medium. Both read as artefacts. Say the word if either was intentional.

---

## Verification

- `npm test` — 20 tests over the engine: OR-within/AND-across, own-facet-excluded counting, the Girls pruning case, selected-but-zero staying visible, sort ordering, URL round-trip.
- `npm run dev`, then Chrome DevTools at exactly 360px, and compare each screen against its Figma frame.
- Widen past 480px to confirm the phone mockup appears and the app still renders at 360.

**Demo script:** Home → Baheti Garments → Filters → Seller → tick Grasim + Gagan → footer drops 1,070 → 530 and other facets' counts shrink → Show results, Filters badge reads 2 → Sort → Highest Margin → order changes and a dot appears on Sort → Gender → Girls → sheet slides away, dot appears on Gender → Filters → Category → six of the seven tiles are gone, only *Girl's T-Shirts* stands → Clear Filters (Gender survives; its dot stays) → Gender → tap Girls again to clear. The URL tracks every step and the back button unwinds it.

For the brand-pruning version: Filters → Category → *Boy's Casual T-Shirts* → Brands → the grid drops from ten tiles to two (Killer, Monte Carlo), 117 results.
