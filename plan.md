# SOLV — Filter & Sort Prototype

A runnable Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which don't exist in the product today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products and a working faceted-search engine behind the designed UI.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
```

Deploys to Vercel with zero configuration.

---

## Flows

**Flow 1 — built.** Home → tap *Baheti Garments* → seller PLP → exercise Gender / Sort / Filters in any combination.

**Flow 2 — designs pending.** Search "sandal" → results spanning multiple product verticals and genders → filtering by Gender prunes whole verticals (high heels disappears). Not built, but the engine already does this natively: in flow 1, ticking **Girls** removes *Formal Shirt* and *Ethnic Shirt* from the Category facet, because no such product exists for girls. Flow 2 is a catalog change, not an engine change.

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

---

## Architecture

No backend. A deterministic seeded catalog plus a pure filter engine, all client-side, so filtering is instant.

### The engine — `lib/filters/engine.ts`

Two functions do the real work:

- **`applyFilters(products, selections, skipFacetId?)`** — OR within a facet, AND across facets.
- **`facetOptionsWithCounts(products, selections, facetId)`** — counts a facet's options against every *other* facet's selections, never its own.

That second rule is the whole thing. Counting a facet against its own selections would zero out every unselected option the moment you ticked one, and the panel would collapse. Excluding it is what makes ticking *Grasim* still show a live count for *Gagan*, while *Girls* correctly erases *Formal Shirt* from Category.

Options that fall to zero are hidden. Anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### Facet registry — `lib/filters/facets.ts`

Fourteen facets behind twelve rail entries (*More Filters* stacks Fabric and Product Tags). Each facet declares `valuesOf(product) → string[]`, so range buckets, multi-valued delivery windows and plain checkboxes all flow through one code path. Adding a facet is one array entry.

`FACETS` is everything the engine knows about; `RAIL` is only what the Filters screen displays. `gender` is in the first and not the second — it is set exclusively from the bottom bar. `RAIL_FACET_IDS` is the set that anything mutating the draft (notably Clear Filters) must filter through, so a facet the screen doesn't show can never be cleared by it.

Panels: Category and Brands use the tile grid; Colour is a checkbox row with a 16px colour dot; Price Range, Margin and MOQ are checkbox rows over preset buckets (no slider — that would add a control the design system doesn't have); everything else is the designed checkbox row.

### State — `lib/filters/urlState.ts`

Filter state lives in the query string: `?gender=men,boys&seller=grasim&sort=margin_desc`. Local state is the source of truth and the URL is mirrored via `history.pushState`, which keeps filtering instant while still giving a working back button and shareable links to any combination.

### Catalog — `lib/catalog/`

1,070 garment products (matching the design's "Show 1,070 results"), from a fixed-seed PRNG so counts never shift between reloads or between server and client. 6 verticals, 4 genders, 8 sellers, 10 brands, 10 colours, 3 pack types, 6 fabrics; each product carries 2–4 pack variants driving the card's set pills.

Category × gender is deliberately restricted — Formal Shirt and Ethnic Shirt are never made for girls, Long Kurta Set only for women and girls — so facet pruning is visible in flow 1 rather than waiting on flow 2.

### Device frame — `components/DeviceFrame.tsx`

Below 480px the app renders edge to edge and reads as the real thing. At 480px and above the untouched 360×800 app sits inside a CSS phone mockup, so no Figma dimension ever has to stretch.

---

## Decisions taken where the designs were silent

Several of these were revised during review — the current state is what's listed.

| # | Question | Decision |
|---|---|---|
| 1 | Facet counts | Footer total **and** per-option counts both recompute live on every tick. Zero-count options are hidden; anything selected stays visible even at zero. |
| 2 | Sort sheet | Tapping a row applies and closes — the design has no Apply button. |
| 3 | Gender | **Single-select and bottom-bar only.** Journey mapping found nobody shops two genders at once, so the Apply/Clear footer is gone and a tap applies and closes, like Sort; re-tapping the active row clears it. It is deliberately absent from the Filters rail — the sheet is the only entry point — but remains in the engine, so it filters, round-trips through the URL and feeds other facets' counts. Renders as a checkbox for consistency, despite behaving exclusively. |
| 4 | Set pills | Selectable. Picking a pack updates that card's MRP, price/pc, margin and set size. Dots track scroll pages. |
| 5 | Applied-filter cue | **Bottom bar only.** The `644:4011` chip bar and the removable filter chips were both removed on request; that strip is reserved for contextual chips, still undefined. Gender and Sort each show a dot (one value each), Filters shows a count. Gender is excluded from the Filters count. |
| 6 | Clear Filters scope | Clears only the facets the rail owns. Gender survives it — clearing a filter from a screen that never displayed it would be a silent surprise. |
| 7 | Seller facet on a seller PLP | The app bar says *Baheti Garments* while the Seller facet lists Heeralal, Gagan, Grasim. Treated as a **storefront aggregating multiple sellers**, so the whole catalog is in scope there. Every other seller page is scoped to its own stock. |
| 8 | `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers**. |
| 9 | Undesigned facet panels | Only Category (tile grid) and Seller (checkbox list) are designed. Brands was moved to the tile grid on request; the rest reuse the checkbox row rather than introducing sliders or swatch grids the design system doesn't have. Colour adds a 16px dot before the label; price/margin/MOQ use bucket rows. |
| 10 | Zero results | Not designed. A centred "No products match" with a *Clear Filters* button. |
| 11 | Home seller cards | The design's third card is *Pawan footwear*, which has no catalog behind it (footwear arrives with flow 2), so Grasim Fabrics takes that slot and every card navigates somewhere real. Product counts are read from the catalog. |
| 12 | Sheet motion | Asymmetric — enter 260ms decelerate, exit 200ms accelerate, scrim 200/160ms, all collapsed to 1ms under `prefers-reduced-motion`. The sheet owns its own dismissal so it can animate out before unmounting. |

**Two things in the design that were deliberately not reproduced:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and the `Margin` rail label being SemiBold while its eleven siblings are Medium. Both read as artefacts. Say the word if either was intentional.

---

## Verification

- `npm test` — 20 tests over the engine: OR-within/AND-across, own-facet-excluded counting, the Girls pruning case, selected-but-zero staying visible, sort ordering, URL round-trip.
- `npm run dev`, then Chrome DevTools at exactly 360px, and compare each screen against its Figma frame.
- Widen past 480px to confirm the phone mockup appears and the app still renders at 360.

**Demo script:** Home → Baheti Garments → Filters → Seller → tick Grasim + Gagan → footer drops 1,070 → 530 and other facets' counts shrink → Show results, Filters badge reads 2 → Sort → Highest Margin → order changes and a dot appears on Sort → Gender → Girls → sheet slides away, dot appears on Gender → Filters → Category → *Formal Shirt* and *Ethnic Shirt* are gone → Clear Filters (Gender survives; its dot stays) → Gender → tap Girls again to clear. The URL tracks every step and the back button unwinds it.
