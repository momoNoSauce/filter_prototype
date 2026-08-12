@AGENTS.md

# SOLV — Filter & Sort Prototype

A Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which the real product lacks. Designs existed in Figma but weren't clickable. This makes them work against a seeded catalog so stakeholders can try real filter permutations.

Read `plan.md` for the full architecture and `progress_tracker.md` for current state and open questions.

## Commands

```bash
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests (vitest)
npm run build    # production build; also typechecks
npx eslint .     # lint (run from repo root, not a subdirectory)
```

## Two control variants of the same PLP

Both render the identical card, catalog, engine and sheets. **Only the controls differ**, so a preference between them is about control placement and nothing else. Don't let them drift apart in any other respect.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/[sellerId]` | Gender · Sort · Filters pinned to the bottom (Figma `638:2836`) |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | Sort and Filter chips under the GOLD strip (Figma `644:4011`), no bottom bar; Gender moves into the Filters rail |

Separate routes rather than a query flag — chosen so each has its own shareable link and neither inherits the other's state. Switch by editing the URL.

**Each variant is a closed loop.** Hand someone `/b` and the whole journey stays in B. Three things enforce that, and all three must be kept in step when adding a route:

- `PlpScreen` takes `variant: "bottom-bar" | "top-chips"` — there is no second copy of the screen.
- `HomeScreen` takes `basePath: "" | "/b"`, so its seller cards link into the right variant.
- `AppBar` takes `homeHref`, because a hardcoded `/` silently drops a Variant B session into Variant A mid-demo.

The journey is Home → tap *Baheti Garments* → PLP → filter and sort. Variant A is the default; Variant B is the same journey with the controls moved.

## Design source — always pull from Figma, never eyeball

File `hdArN93DmnLu5JDB46SOwd` (`Filter-and-Sort`), section `651:4873`. Use the Figma MCP `get_design_context` (load the `figma-design-to-code` guidance first).

| Node | Screen |
|---|---|
| `628:1620` | Home |
| `638:2718` | PLP base |
| `644:4435` | Sort By sheet |
| `644:4470` | Gender sheet |
| `638:3659` | Filters sheet (rail + panel) |
| `644:4011` | Sort/Filter chip bar — Variant B's controls |
| `644:4000` | Filters → Seller |
| `638:3696` | Tile grid (frame renamed `Category`) — 68×96 cells, 56px tile, two-line label |

**Designs are 360px wide.** Never stretch a Figma dimension to fit — `DeviceFrame` renders edge-to-edge below 480px and drops the untouched 360×800 app into a phone mockup above it.

**Fonts are mixed, and that's intentional:** Roboto for everything, **Inter** for button labels (`Clear Filters`, `Show N results`), **Rowdies** for the GOLD wordmark.

Tokens live in `app/globals.css` under `@theme`, named after their Figma variables (`--color-primary` = `primary/default` `#004FFA`, etc.). The design occasionally uses `#014FFA` for active states — that's a slip; use the `#004FFA` token.

All icons/images are exact Figma exports in `public/figma/`. **Never redraw an asset.** Monochrome icons that need to change colour use `components/ui/MaskIcon.tsx` (CSS mask over a background colour) — an `<img>` can't be tinted.

`design/` holds reference PNG exports of the frames and is **gitignored** — unreleased design work, served by nothing. It may be absent in a fresh clone; pull from Figma rather than depending on it. `public/figma/` and `public/categories/` are the opposite: tracked on purpose, because the app serves them and a Git-triggered build would otherwise ship with no images.

## Architecture

No backend. Deterministic seeded catalog + pure filter engine, all client-side.

- `lib/filters/engine.ts` — `applyFilters` (OR within a facet, AND across facets) and `facetOptionsWithCounts`.
- `lib/filters/facets.ts` — facet registry. Each facet declares `valuesOf(product) → string[]`, so tile grids, checkbox lists, range buckets and multi-valued delivery windows all use one code path. Adding a facet is one array entry. `FACETS` is every facet the engine knows; `getRail(includeGender)` is what the Filters screen shows for a given variant, and `getRailFacetIds(includeGender)` is the set anything touching the draft must filter through.
- `lib/catalog/seed.ts` — 1,070 products from a fixed-seed PRNG. Determinism is load-bearing: counts must not shift between reloads or between server and client.
- `lib/filters/urlState.ts` — state mirrored to the query string via `history.pushState`; local state stays the source of truth so filtering is instant.

### The one rule that matters

`facetOptionsWithCounts` counts a facet's options against **every other facet's selections, never its own**. Counting a facet against itself would zero out every unselected option the moment you ticked one. This is what makes ticking one seller still show live counts for the others, while picking Girls correctly erases Formal Shirt from Category. It's covered by tests — don't "simplify" it.

Options that fall to zero are hidden; anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### Catalog shape is deliberate

Category × gender is restricted so pruning is demonstrable: Formal Shirt and Ethnic Shirt are never made for girls, Long Kurta Set only for women and girls. Don't flatten this into a uniform distribution.

## Decisions already made — do not re-litigate

| Area | Decision |
|---|---|
| Default sort | **Popularity**, and omitted from the URL (bare URL = Popularity) |
| Sort sheet | Tap applies **and closes** — no Apply button in the design |
| Gender | Reached differently per variant, and behaves accordingly. **A:** a single-select quick action in the bottom-bar sheet (journey mapping: nobody shops two genders at once) — tap applies and closes, re-tapping the active row clears it, and it is absent from A's rail. **B:** no bottom bar, so it becomes an ordinary **multi-select** facet, second in the Filters rail. Exclusivity is a property of the control, not the facet — there is no `single` flag in the registry. |
| Gender control | Always a **checkbox**, never a radio — consistent with every other facet. In A that means a checkbox behaving exclusively; a known mismatch, flagged to the designer |
| Active row (Sort/Gender) | Three things together: label bold, label primary, **icon tints to primary** |
| Tile selected state | Primary ring + 50% primary veil over the photo + white check + bold primary label |
| Top chip strip | In **A** it is empty and reserved for **contextual chips** (undefined — ask before filling it); the `644:4011` chips and the applied-filter chips were both removed from A on request. In **B** that same strip carries the Sort and Filter chips |
| Applied state cue | Carried by whichever control owns the filter. One value → a **dot** (Sort always; Gender in A). Many → a **count** (Filters). In A the count excludes gender because the bottom bar reports it; in B it includes gender, because the Filters screen owns it |
| Clear Filters scope | Clears only facets in `getRailFacetIds(variant)`. In A that spares gender — wiping a filter from a screen that never showed it is a silent surprise. In B it clears gender too, because B displays it |
| Sheet motion | Asymmetric: enter 260ms `cubic-bezier(.05,.7,.1,1)` (decelerate), exit 200ms `cubic-bezier(.3,0,.8,.15)` (accelerate); scrim 200/160ms. `Sheet` owns dismissal — `onClose` fires on `animationend`, and rows get the animated close via a render prop. `prefers-reduced-motion` collapses all four to 1ms |
| Brands panel | Uses the **same tile grid as Category**, not a checkbox list |
| Tile grid | Figma frame `Category` (`638:3696`): 68×96 cells, 56px square at radius 9.333, 4px gaps, 14px left inset, three across. The label is a **fixed 36px two-line box** — reserved even for one-line labels, so tiles on a row bottom out level — and long labels clamp at two lines rather than truncating on one. Shared by Category and Brands in both variants; change it once. |
| Undesigned panels | Ten of twelve facets aren't designed. They reuse the designed checkbox row rather than introducing sliders or swatch grids. Colour adds a 16px dot; price/margin/MOQ use bucket rows |
| Seller PLP scope | Baheti Garments is a **storefront aggregating multiple sellers** (the app bar says Baheti while the Seller facet lists other companies). Other seller pages are scoped to their own stock |
| `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers** |
| Set pills | Selectable — picking a pack re-prices that card. Dots track scroll pages |

**Skipped as design artefacts:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and `Margin` being SemiBold while its eleven siblings are Medium.

## Imagery

- **Category tiles** — Unsplash stock in `public/categories/`, credited in `CREDITS.md`. `ethnic-shirt.jpg` is a known weak match (knitwear flatlay, not Indian ethnic menswear).
- **Brand tiles** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced (Clearbit's API is retired; Wikipedia/Commons returned unrelated files for 7 of 8 brands). The right input is brand-supplied assets, which also avoids scraping trademarked marks.
- **Product images** — only two shirt renders exist in the Figma file, assigned by whether the colour is dark or light.

## Working style

- Verify visually before claiming something works. Playwright is not a dependency — install it ad hoc (`npm install --no-save playwright`), screenshot at 360px with `deviceScaleFactor: 2–3`, then uninstall. Hide the dev overlay first: it intercepts clicks.
  ```js
  await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
  ```
- Badged buttons change their accessible name (`Filters` becomes `3 Filters`), so use regex selectors in tests.
- Run `npx eslint .` from the repo root — the shell's working directory persists between commands and a stale `cd` produces confusing failures.
