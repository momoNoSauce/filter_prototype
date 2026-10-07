@AGENTS.md

# SOLV — Filter & Sort Prototype

A Next.js 16 / React 19 / Tailwind v4 prototype of filter and sort for SOLV's
B2B commerce app. There's no backend: a seeded catalog and a pure filter engine
run entirely client-side.

- `README.md` covers setup, routes and demo scripts.
- `docs/architecture.md` explains how the engine, facets, rails and catalog work.
- `docs/backlog.md` lists open UX issues and design questions.

**When you change behaviour, update the code comment beside it and this file.**

## Commands

```bash
npm run dev      # http://localhost:3000
npm test         # vitest
npm run build    # production build + typecheck
npx eslint .     # lint — always from the repo root
```

## Routes

| Route | Catalog | `variant` | Rail preset | Notes |
|---|---|---|---|---|
| `/`, `/results?q=shirt` | main 1,070 | `bottom-bar` | `default` | Variant A — floating pill |
| `/b`, `/b/results?q=shirt` | main | `top-chips` | `default` | Variant B — chips under app bar |
| `/c` | one vertical | `bottom-bar` | `default` | Variant C (`VerticalPlp`) |
| `/d` | one vertical | `top-chips` | `default` | Variant D (`VerticalPlp`) |
| `/userjourney` → `/userjourney/seller/kartik` | Kartik 540 | `top-chips` | `journey-flat` | No style filters |
| `/pvfilters` | Kartik | `top-chips` | `journey` | `guidedPv: true` — Find It Fast block |
| `/pvfilters2` | Kartik | `top-chips` | `journey-gated` | More Filters gate — **the version going forward** |

Also: `/seller/[sellerId]`, `/b/seller/[sellerId]`,
`/c|d/seller/[sellerId]/[categoryId]`, `/search`, `/b/search`, and
`{base}/product/[productId]` for every listing.

### Route rules

- **A–D differ only in control placement and starting scope.** They share the
  card, catalog, engine, rail and sheets. Filter comes before Sort in both the
  pill and the chip bar.
- **Each route tree is a closed loop.** Keep `PlpScreen`'s `variant`,
  `HomeScreen`'s `basePath` and `AppBar`'s `homeHref` in step when you add a
  route. `productBasePath` is `""` for A, so test it with `!== undefined`.
- **Each Kartik route spells out its own `PlpScreen` props.** Don't extract a
  shared config. `PlpScreen`, `ProductDetail` and `FindItFast` stay shared;
  per-route differences are props with defaults.
- **Every Kartik route passes `homeHref`** to its detail page. `ProductDetail`
  defaults to `/userjourney`.
- **Per-route layout switches go in `PlpScreen`'s `controls` prop.** Don't add
  a new top-level prop for one. Defaults: `verticalChips: true`,
  `priceChip: true`, `rail: "default"`, and `sortInFilters`, `filterSheet`,
  `rangeInputs`, `guidedPv` all `false`. A–D pass no `controls`. All three
  Kartik routes set `verticalChips: false`, `priceChip: false`,
  `filterSheet: true` and `rangeInputs: true`.
- **Never set `guidedPv` together with `journey-flat`.** That rail has no style
  rows for the buttons to open.

## Rails (`lib/filters/facets.ts`)

`getRail(category, preset, silenced)` returns the rows the Filters screen shows.

| Preset | Order | Outside a vertical | Inside one |
|---|---|---|---|
| `default` (A–D) | `RAIL_ORDER` | 13 rows | 18 (17 in C/D, no Category) |
| `journey` | `JOURNEY_RAIL_ORDER` | 7 | 13 — style rows appear after Category |
| `journey-flat` | `JOURNEY_RAIL_ORDER` | 7 | 7 — listed in `FLAT_RAILS` |
| `journey-gated` | `JOURNEY_GATED_RAIL_ORDER` | 8 — ends with a locked More Filters row | 13 — six style rows replace it under a heading |

- `JOURNEY_RAIL_ORDER`: Price Range · Margin on MRP · MOQ · Category · Brands ·
  Seller · Seller City · [Size · Fit · Neck Type · Sleeve Type · Pattern ·
  Closure Type] · Cashback · Seller Offer · SOLV Target Scheme. Bracketed rows
  are `vertical: true`.
- `JOURNEY_GATED_RAIL_ORDER`: the same rows with Category moved below the three
  offers. The style rows follow it. The first style row carries
  `heading: "More Filters"`, rendered as a non-tappable 36px strip (13px bold
  `#323232` on `#cfcfcf`). A `gated: true` row labelled More Filters (id
  `style`) shows only while locked.
- On `/pvfilters2`, unlocking opens the Category panel and smooth-scrolls the
  rail towards it, with no scroll animation under reduced motion. The rail
  highlights `rail.id`, not `activeRail`. Don't add empty rail space to buy
  scroll room.
- **The locked More Filters row** looks like any other row and has a padlock
  after its label. It doesn't animate. Its panel shows a count line and the
  three categories as `ThumbRow`s.
- Brands, Seller and Seller City have `hideIfSingle`. They hide when the page's
  products hold only one value (`singleValuedFacets`), which is always the case
  on Kartik.
- `FLAT_RAILS` and `gated` belong to the **preset**, not to `controls`. Both
  `getRail` and `dropOrphanedSelections` read them.

## Invariants — don't break these

- **Counting:** `facetOptionsWithCounts` counts a facet against every *other*
  facet's selections, never its own. Options at zero are hidden; selected
  options stay visible at zero. Tests cover this.
- **Size is counted by applying each option alone** (`{...selections, size:
  [option]}`), never as a union with the current selection.
- **No orphan filters.** Every selection must have a visible control. Run
  `dropOrphanedSelections` wherever selections change, and remove a facet from
  `FACETS` when you remove it from every rail. Use `clearsAlso` on
  `FilterScreen` for a facet that has a chip but no rail row.
- **Typed min/max ranges** (`rangeInputs`) commit on blur, never per keystroke.
  Typed boxes and bands are mutually exclusive per facet. An inverted range is
  refused, with a toast. A facet that overrides `matches` must also override
  `accepts`.
- **Determinism:** the catalogs come from fixed-seed PRNGs, and counts must
  match between server and client and across Node versions.
  - Shuffle with Fisher–Yates, using `length - 1` draws. **Never** use
    `Array.prototype.sort` with a random comparator.
  - Give every new per-product property its own PRNG stream (`sizeRand`,
    `attrRand` and Kartik's `offerRand` are examples).
  - Never delete a mid-sequence draw. Leave it drawn and unread, or mark it
    `retired: true`.
  - `seed.test.ts` pins the draw count. `kartik.test.ts` pins the main catalog
    at 1,070 / Girls 108 / Men 584.
- **Category → gender is 1:1** (`CATEGORIES[].gender`). Titles use `plural`, the
  gender-free noun.
- **Offer magnitudes exist only on Kartik** (Cashback ₹, Seller Offer %, SOLV
  Target Scheme ₹). Don't add them to the main catalog.

## Design source

Figma file `hdArN93DmnLu5JDB46SOwd` (`Filter-and-Sort`), section `651:4873`.
Pull specs with the Figma MCP `get_design_context`; never eyeball them.

| Node | Screen |
|---|---|
| `628:1620` | Home |
| `638:2718` | PLP base |
| `638:3659` | Filters screen (rail + panel) |
| `638:3696` | Tile grid — replaced by `ThumbRow` rows |
| `644:4435` / `644:4470` | Sort By / Gender sheets |
| `644:4011` | Sort/Filter chip bar (built Filter-first) |
| `644:4000` | Filters → Seller |
| `674:4904` | Product-vertical chip |
| `688:1687` | `SortbyIcon` — Sort sheet glyphs |
| `697:2658` | Floating pill (A and C) |

- The Kartik routes are built from live-app screengrabs (1080×2400, 3× the
  design). Where a screengrab and Figma disagree, follow the screengrab.
- Designs are 360px wide. Never stretch a Figma dimension. `DeviceFrame` renders
  full-width below 480px and in a 360×800 phone mockup above it.
- Use the `@theme` tokens in `app/globals.css`. Map `#014FFA`, `#0a57ff` and
  `rgba(21,95,255,0.2)` to `primary` / `primary/subtle`.
- Fonts: Roboto throughout, Inter for button labels.
- Icons are exact Figma exports in `public/figma/`. Never redraw them. Tint
  monochrome icons with `components/ui/MaskIcon.tsx`.
- Style-filter icons live in `public/style/`, mapped in
  `lib/filters/styleIcons.ts`. A facet missing from the map gets a grey
  placeholder.
- `design/` (reference PNGs) is gitignored. `public/figma/` and
  `public/categories/` are tracked.

## Deploy

- Vercel project `momonosauce/filter-prototype`, Git-connected. **A push to
  `main` deploys.**
- Live at https://filter-prototype-sandy.vercel.app. Basic Auth uses the
  `SITE_PASSWORD` env var (username ignored).
- `proxy.ts` (Next 16's replacement for `middleware.ts`) gates every request
  when `VERCEL` is set, and returns 503 if `SITE_PASSWORD` is missing. Set the
  env var before deploying.
- **Only commits authored by momoNoSauce build.** Commits from any other
  author show `Blocked` in Vercel. Set the identity per repo:

  ```bash
  git config user.name  momoNoSauce
  git config user.email 320892459+momoNoSauce@users.noreply.github.com
  ```

## Working style

- **Check visually before reporting a change as working.** Install Playwright
  ad hoc (`npm install --no-save playwright`), screenshot at 360px with
  `deviceScaleFactor` 2–3, then uninstall. Hide the dev overlay first:
  `page.addStyleTag({ content: 'nextjs-portal{display:none !important}' })`.
- A badge changes a button's accessible name (`Filters` → `3 Filters`), so match
  it with a regex.
- `.claude/**` is in ESLint's `globalIgnores`.
- Port 3000 may belong to another worktree's dev server. Check before trusting
  a screenshot.
