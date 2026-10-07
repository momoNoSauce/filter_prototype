# Architecture

There's no backend. Two deterministic seeded catalogs feed a pure filter
engine, and everything runs client-side.

```
lib/catalog/seed.ts ──┐
                      ├─► PlpScreen ─► applyFilters / facetOptionsWithCounts / sortProducts
lib/catalog/kartik.ts ┘        │
                               ├─► FilterScreen (rail from getRail + panel, draft → commit)
                               └─► urlState (selections + sort mirrored to the query string)
```

## Modules

| Module | Does |
|---|---|
| `lib/catalog/seed.ts` | Generates the main 1,070 products from a fixed-seed PRNG |
| `lib/catalog/kartik.ts` | Generates Kartik's 540 tees on separate PRNG streams; the only products with offer magnitudes |
| `lib/catalog/products.ts` | `getCatalog()`, `STOREFRONT` |
| `lib/catalog/scope.ts` | `verticalScope(sellerId, categoryId)` — one seller × category product set for C and D |
| `lib/catalog/search.ts` | Search suggestions and `searchProducts` |
| `lib/catalog/productImage.ts` | `/products/{gender}-{kind}-{colour}.jpg`; falls back to the two Figma renders |
| `lib/filters/engine.ts` | `applyFilters`, `facetOptionsWithCounts`, `sortProducts`, `clearSelections`, `SORT_OPTIONS` |
| `lib/filters/facets.ts` | Facet registry (`FACETS`), `RANGE_FACETS`, rail orders and presets, `getRail`, `singleValuedFacets`, `settledVertical`, `dropOrphanedSelections` |
| `lib/filters/activeVariant.ts` | Picks which pack a card shows and prices, given the Size selection |
| `lib/filters/contextChips.ts` | Picks which chips the strip shows, given the selections |
| `lib/filters/panelFit.ts` | `needsSearch` (does a panel get a search field) and `sheetHeightPct` (bottom-sheet height from rail rows) |
| `lib/filters/urlState.ts` | `parseSelections`, `parseSort`, `buildQuery` |
| `lib/filters/offerIcons.ts`, `sortIcons.ts`, `styleIcons.ts` | Icon maps for offer chips, Sort sheet rows and style-filter buttons |
| `components/plp/PlpScreen.tsx` | The one listing screen, configured by `variant` and `controls` |
| `components/plp/VerticalPlp.tsx` | C/D listing config |
| `components/plp/FindItFast.tsx` | `/pvfilters` guided block |
| `components/filters/FilterScreen.tsx` | Filters rail + panel, draft/commit, Clear Filters |
| `components/filters/OptionRows.tsx` | `OptionRow`, `ThumbRow`, `SortRow`, `RangeInputs` (`TileGrid` is unused) |
| `components/journey/ProductDetail.tsx` | Product detail page for every route |
| `components/DeviceFrame.tsx` | Full-width app below 480px; 360×800 phone mockup above it |
| `components/ui/FullscreenOnTap.tsx` | On touch devices, the first tap requests fullscreen (not on iOS Safari) |

## Filter engine

- **`applyFilters(products, selections)`** ORs values within a facet and ANDs
  across facets.
- **`facetOptionsWithCounts(products, selections, facetId)`** counts each
  option against the selections of every *other* facet, leaving out the
  facet's own.
  - Options with a zero count are hidden. Selected options stay visible even at
    zero.
  - **Size** is counted by applying each option on its own with the other
    selections, `{...selections, size: [option]}`. The Size selection changes
    which pack is priced, so a plain tally would be wrong.
- **`sortProducts`**: Popularity (default, left out of the URL) · Price/pc
  low→high · Price/pc high→low · Highest Margin on MRP · Newest Products
  (`?sort=recent`). The price sorts read the active pack.
- **`clearSelections`** clears only the facets on the current rail
  (`getRailFacetIds`) plus any `clearsAlso` facets. In every variant, Clear
  Filters also resets Sort.

### Active pack (`activeVariant.ts`)

Sizes live on packs, not products. Each product has 2–4 packs.

- A product matches a Size selection if any of its packs carries a selected
  size.
- The card shows pack #1 by default. With a Size selection, it shows the
  leftmost pack carrying a selected size.
- Price and Margin, for both filtering and sorting, read the pack the card
  shows.

## Facets and rails

- `FACETS` holds **23 facets**. Each declares `valuesOf(product, sizes?) →
  string[]`. Checkbox lists, thumbnails, range bands and multi-valued delivery
  windows all go through that one function.
  - To add a facet, add one entry to `FACETS`.
  - To add a banded facet, add one entry to `RANGE_FACETS` plus a
    `rangeFacet()` line.
- **Band facets:** Price Range, Margin on MRP, MOQ, Cashback, Seller Offer,
  SOLV Target Scheme. With `rangeInputs`, each also gets typed min/max boxes
  (`?price=150-450`, `?margin=60-`). Units: ₹ before the number, `%` and `pc`
  after.
- **Typed ranges** add two hooks to a facet: `matches` (custom test) and
  `accepts` (widens URL id validation). A facet that defines one must define
  both.
- **`getRail(category, preset, silenced)`** returns the visible rows.
  - Rows marked `vertical: true` (Size, Fit, Neck, Sleeve, Pattern, Closure)
    appear only once exactly one vertical is settled.
  - `silenced` comes from `singleValuedFacets(products)`. It hides
    `hideIfSingle` rows when the page holds one value of them.
- **`dropOrphanedSelections`** removes a selection when its control is no
  longer shown, for example a Size cut after the vertical is cleared.

| Preset | Used by | Rows (outside → inside a vertical) |
|---|---|---|
| `default` | A–D | 13 → 18 (C/D: 17) |
| `journey` | `/pvfilters` | 7 → 13 |
| `journey-flat` | `/userjourney` | 7 → 7 |
| `journey-gated` | `/pvfilters2` | 8 → 13 |

### Panels

| Panel | Used for | Render |
|---|---|---|
| `thumb` (`ThumbRow`) | Category, Brands | 44px picture, two-line name and count, whole row selects (68px footprint, `THUMB_ROW_H`) |
| `checkbox` (`OptionRow`) | Most facets | Checkbox row |
| `swatch` | Colour | Checkbox row with a 16px colour dot |
| `range` | Band facets | Checkbox rows over bands, plus typed min/max when `rangeInputs` |

- A rail row with active selections shows its count in an 18px filled circle.
- A panel that stacks several facets heads each one at 15px bold
  (`FACET_HEADING_H` = 43). Today that's only the A–D Offers row. A panel with
  a single facet has no heading.
- A panel gets a search field when `needsSearch` says its options overflow the
  visible panel height. A panel of only bands never gets one.
- With `filterSheet`, the Filters screen is a bottom sheet. Its height comes
  from `sheetHeightPct(railRows)`: between 440px and 80% of the frame.

### `/pvfilters` — Find It Fast (`controls.guidedPv`)

1. **Choose category:** picture tiles that set `category`.
2. **Choose style:** one button per `styleRows(preset)` row. Each button opens
   the Filters sheet on that row's panel, via `initialRail` on `FilterScreen`.
   A button with active selections gets a primary border and a count.

- Each step is counted against the steps above it, never below.
- Picking a different category clears the Size selection.

### `/pvfilters2` — More Filters gate (`journey-gated`)

- **Locked**, before a single category is settled: Price Range · Margin on MRP ·
  MOQ · Cashback · Seller Offer · SOLV Target Scheme · Category · More
  Filters 🔒.
  - The More Filters panel reads `6 style filters locked` and lists the three
    categories as `ThumbRow`s.
- **Unlocked**, once a category is picked from that panel or from Category:
  - The locked row is replaced by a "More Filters" heading strip, then Size ·
    Fit · Neck Type · Sleeve Type · Pattern · Closure Type.
  - The Category panel opens, and the rail scrolls towards Category.

## URL state (`urlState.ts`)

Local React state is the source of truth. It's mirrored to the query string
with `history.pushState`, e.g. `?gender=men,boys&seller=grasim&sort=margin_desc`.
`parseSelections` drops ids a facet doesn't accept.

## Catalogs

### Main — 1,070 products (`seed.ts`)

7 categories, 4 genders, 8 sellers, 10 brands, 20 colours, 6 fabrics, 13 sizes.

| Category | Gender | Products | Price /pc |
|---|---|---|---|
| Women's T-Shirts | Women | 173 | ₹150 – ₹450 |
| Men's Formal Shirts | Men | 168 | ₹260 – ₹1,150 |
| Men's Casual T-Shirts | Men | 222 | ₹160 – ₹480 |
| Men's Casual Shirts | Men | 194 | ₹220 – ₹780 |
| Girl's T-Shirts | Girls | 108 | ₹110 – ₹320 |
| Boy's Casual Shirts | Boys | 98 | ₹150 – ₹430 |
| Boy's Casual T-Shirts | Boys | 107 | ₹110 – ₹330 |

Gender totals: Men 584 · Women 173 · Boys 205 · Girls 108.

| Size | Products | | Size | Products |
|---|---|---|---|---|
| XS | 43 | | 2-3Y | 78 |
| S | 225 | | 4-5Y | 168 |
| M | 404 | | 6-7Y | 189 |
| L | 468 | | 8-9Y | 142 |
| XL | 308 | | 10-11Y | 62 |
| 2XL | 116 | | 12-13Y | 17 |
| 3XL | 28 | | | |

- Price bands: Under ₹200 (202) · ₹200–400 (563) · ₹400–600 (149) ·
  ₹600–900 (120) · ₹900 & above (36).
- Margin bands: Upto 30% (264) · 30–45% (344) · 45–60% (337) · 60% & above (125).
- Kids' lines use age-band sizes and adults' use letter sizes. Each product has
  one contiguous size run, and its packs split that run.
- Brands and price ranges depend on the category.

### Kartik — 540 tees (`kartik.ts`)

One seller (Kartik Exporters), one brand (Zenifit), one city (Tiruppur).
Women's T-Shirts 191 · Men's Casual T-Shirts 221 · Boy's Casual T-Shirts 128.

- It's generated on its own PRNG streams, so it doesn't affect any main-catalog
  count. A fourth stream, `offerRand`, draws the offer magnitudes.
- Offer chips on the strip filter on *has offer* (yes/no). The rail rows filter
  on *amount*. The two combine with AND.

### Determinism rules

- Shuffles use Fisher–Yates with exactly `length - 1` draws. Never
  `sort(() => rand() - 0.5)`.
- Every new per-product property gets its own PRNG stream.
- Mid-sequence draws are never removed. `shippingFee` and `packType` are still
  drawn and never read.
- `seed.test.ts` pins draws per product (`1 + 4 + 3 × packs`).
  `kartik.test.ts` pins main-catalog totals.

## Assets

| Path | Contents |
|---|---|
| `public/figma/` | Exact Figma exports (icons, renders) |
| `public/categories/` | Category photos (Unsplash, credited in `CREDITS.md`) |
| `public/products/` | Generated product art, 120 files (`gender × kind × colour`), listed in `GENERATED_PRODUCT_IMAGES` |
| `public/journey/` | Kartik storefront art from live-app screengrabs |
| `public/offers/` | Offer chip icons |
| `public/style/` | Style-filter icons (size, fit, neck, sleeve, closure) |

Brand thumbnails are grey `#d9d9d9` placeholders.

## Tests

`npm test` runs 151 tests in 4 files:

- `engine.test.ts`: OR/AND, own-facet-excluded counting, Size counting, sort,
  URL round-trip, rail orders per preset, typed ranges, `hideIfSingle`.
- `seed.test.ts`: draw counts, pack splits.
- `kartik.test.ts`: Kartik catalog shape; main catalog unchanged.
- `panelFit.test.ts`: search-field thresholds, sheet height.
