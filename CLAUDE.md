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
| **Variant A** | `/` | `/seller/[sellerId]` | Category · Sort · Filters pinned to the bottom (Figma `638:2836`). Category is a multi-select sheet, so it leaves A's rail |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | Sort and Filter chips under the GOLD strip (Figma `644:4011`), no bottom bar, so Category is a Filters-rail facet instead |

Gender is a rail facet in **both**, so the two rails differ by exactly one row.

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
- `lib/filters/facets.ts` — facet registry. Each facet declares `valuesOf(product) → string[]`, so tile grids, checkbox lists, range buckets and multi-valued delivery windows all use one code path. Adding a facet is one array entry. `FACETS` is every facet the engine knows; `getRail(variant)` is what the Filters screen shows for a given variant, and `getRailFacetIds(variant)` is the set anything touching the draft must filter through. `PlpVariant` is declared here rather than in the component, because rail composition is what the variant actually decides.
- `lib/filters/contextChips.ts` — which chips the strip below the GOLD bar carries, given the current selections. Pure and shared by both variants.
- `lib/catalog/seed.ts` — 1,070 products from a fixed-seed PRNG. Determinism is load-bearing: counts must not shift between reloads or between server and client.
- `lib/filters/urlState.ts` — state mirrored to the query string via `history.pushState`; local state stays the source of truth so filtering is instant.

### The one rule that matters

`facetOptionsWithCounts` counts a facet's options against **every other facet's selections, never its own**. Counting a facet against itself would zero out every unselected option the moment you ticked one. This is what makes ticking one seller still show live counts for the others, while picking Girls correctly erases Men's Formal Shirts from Category. It's covered by tests — don't "simplify" it.

Options that fall to zero are hidden; anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### Catalog shape is deliberate

**The seven categories name their audience** — Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts (merchandising list, 2026-08-12). So category → gender is **1:1**, not many-to-many: `CATEGORIES[].gender` is a single value and the seed reads it rather than drawing one.

That keeps pruning demonstrable and sharpens it — Girls leaves **one** tile of seven (97 results), Men leaves three (575). Gender remains its own facet because each variant reaches it differently, but it is now derivable from category. Don't flatten the weights into a uniform distribution, and don't reintroduce a `genders[]` array.

Two knock-on rules, both easy to undo by accident:

- `plural` is the **gender-free** noun used in product titles, so a card reads "… Casual T-Shirts for Boys" and not "… Boy's Casual T-Shirts for Boys". A test asserts no possessive ever reaches a title.
- `priceFloor`/`priceCeil` are **per category** — kids' below adults', formal above casual. Men's Formal Shirts runs to ₹1,150 specifically to keep the top Price Range bucket (`₹900 & above`) populated; an option that can never appear is worse than no option.

Brands are category-restricted too. Kids' lines carry the fewest, which is what makes Boy's Casual T-Shirts collapse the Brands grid to two tiles.

## Decisions already made — do not re-litigate

| Area | Decision |
|---|---|
| Default sort | **Popularity**, and omitted from the URL (bare URL = Popularity) |
| Sort sheet | Tap applies **and closes** — no Apply button in the design |
| Bottom bar slot 1 | **Category**, not Gender (2026-08-13). The categories name their audience, so gender stopped earning a control; Category is what a retailer reaches for first. Figma's frame says Gender — this is a deliberate departure |
| Category | **A:** a multi-select quick action in the bottom-bar sheet — a draft plus a `Clear all` / `Show N results` footer, because a retailer plausibly wants Men's Casual Shirts *and* Men's Casual T-Shirts. Absent from A's rail, since the bar owns it. **B:** an ordinary rail facet, first. Same `TileGrid` either way; the sheet is wider than the 240px panel, so the same 68px cells wrap four across instead of three |
| Gender | An ordinary **multi-select** rail facet in **both** variants — first in A's rail, second in B's. Largely redundant now that every category names its audience, but redundant isn't useless: it's a faster cut than ticking three category tiles, and dropping it would leave `?gender=` links with no UI. Exclusivity was always a property of the control, never the facet, which is why there is no `single` flag in the registry |
| Category sheet icon | `tag.svg`. The design has no bottom-bar Category slot and therefore no icon for one. It's an existing Figma export rather than a drawn asset, but it is also the Sort sheet's *Recently Added* icon — **wants a designed replacement** |
| Active row (Sort) | Three things together: label bold, label primary, **icon tints to primary** |
| Tile selected state | Primary ring + 50% primary veil over the photo + white check + bold primary label |
| Top chip strip | Carries the **contextual chips** in both variants (defined 2026-08-13, previously reserved and empty). In **B** they follow the Sort and Filter chips, after the divider `644:4011` already draws as their boundary, sharing one horizontally-scrolling row. In **A** they are the whole strip, which collapses entirely when there are no chips rather than leaving an empty white band |
| Contextual chips | The strip answers whichever question is still open. **Not inside a single product vertical** — none picked or several — it offers the verticals. **Inside exactly one** the picked vertical *stays*, leading the strip, followed by Price then Seller Offer, Cashback and Free Delivery. Logic is in `lib/filters/contextChips.ts`, kept pure and apart from the markup because the selection rule is the interesting part; `ContextChip` is a union carrying its `kind`, since the three render very differently |
| Vertical chip | A Material **input** chip, not a filter chip — 48px thumbnail flush to the leading edge, two-line label, and a green circular ✕ once picked. Taller than M3's 32dp because the thumbnail and a two-line label need the room. The ✕ is its own button rather than the whole chip toggling: the chip stays on the strip while its vertical is active, so "tap anywhere to remove" would drop you out of the vertical on a mis-tap. Its ✕ is the only way back out of a vertical without opening Filters |
| Price chip | One chip opening an anchored **dropdown** over the bands, not a chip per band. Multi-select with a checkbox each, matching the Price Range facet in Filters; each tap applies live and the menu stays open. The closed chip carries the state — the band's own name for one, `Price (n)` beyond that. The menu renders at the screen root, not inside the strip, because `overflow-x-auto` there would clip it; `left`/`top` are measured against the root on open and clamped so a chip scrolled right can't push it off the frame |
| Seller Offer | Means *any offer at all*, and is its own facet (`hasOffer`), not a fifth option inside `offers`. Inside it, OR-within-a-facet would make Seller Offer **widen** a Cashback selection; as a separate facet they AND. It is listed in the Offers rail entry alongside `offers` — a chip-only facet would survive Clear Filters and go uncounted, with no control left to undo it once the strip changes |
| Chips that filter nothing | The three offer chips use `discriminatingOptions`: shown only when some but **not all** products in scope carry the offer. An offer everything already has is a dead control. Deliberately **not** applied to price bands or verticals — a narrow catalog where one band holds everything would otherwise be left with an empty menu, and zero-count options already drop out |
| Chip design | **Material 3** as instructed. Offer chips are filter chips: 32dp high, 8dp corner, 1dp outline unselected, filled with an 18dp leading checkmark when selected, 16dp label padding dropping to 8dp beside the checkmark, 14sp Medium. Vertical chips are input chips (see above). Palette is this app's (`primary/subtle`, `primary/default`), not M3's. **Known mismatch:** M3's 8dp corner sits beside `TopChipBar`'s fully-rounded Figma pills in B. Following the instruction, but one line to reverse. No counts on chip labels — they're in the Price menu, where there's room |
| The ✕ green | `#2e9e42`, chosen rather than measured: the reference was a screenshot, not a Figma node. Darker than the app's `#39B54A` deliberately, so the white glyph clears 3:1 against it — `#39B54A` would land near 2.7:1 and join the contrast problems already logged |
| Applied state cue | Carried by whichever control owns the filter. One value → a **dot** (Sort). Many → a **count** (Category in A, Filters always). In A the Filters count excludes category, because the bottom bar reports it; it still counts gender, which A's rail shows |
| Clear Filters scope | Clears only facets in `getRailFacetIds(variant)`. In A that spares category — wiping a filter from a screen that never showed it is a silent surprise — but does clear gender, which A's rail displays. In B it clears both. `Clear all` in the Category sheet clears only category, by the same rule |
| Sheet motion | Asymmetric: enter 260ms `cubic-bezier(.05,.7,.1,1)` (decelerate), exit 200ms `cubic-bezier(.3,0,.8,.15)` (accelerate); scrim 200/160ms. `Sheet` owns dismissal — `onClose` fires on `animationend`, and rows and footers get the animated close via a render prop. `prefers-reduced-motion` collapses all four to 1ms |
| Sort sheet vs Category sheet | Sort has no footer and commits on tap, because it holds one value. Category has the `Clear all` / `Show N results` footer, because it holds many. That footer is the one Figma's gender frame (`644:4470`) carried before it was dropped for being single-select |
| Discarded drafts | Any draft surface dismissed without applying throws the edits away, and silence there reads as a broken filter. Both the **Category sheet** (scrim, close button, Escape) and the **Filters screen** (✕) fire the same **`Selection discarded`** toast — one string deliberately, since it is one event and two wordings would read as two different things. It fires **only when something would actually be lost**: untouched, or edited back to where it started, stays silent, and so does applying. The check is `sameSelections`, which treats an absent key and an empty array alike and ignores option order |
| Where the discard check hangs | Differs by surface, and must. `Sheet` funnels scrim, close button and Escape through one animated `onClose`, so the Category sheet checks there and needs an `applied` ref to keep the apply path quiet. The Filters screen has no `Sheet`: its ✕ and its `Show N results` are separate handlers, so only the ✕ checks and no ref is needed. Both compare against a **frozen snapshot** of what the surface opened with — comparing against the live `selections` prop fails, because applying updates it while the component is still mounted |
| Toast | Not in the designs — `components/ui/Toast.tsx`, a dark pill near the bottom. Its lifetime *is* its CSS animation (`.animate-toast`, 2600ms: rise, hold, fade) and `animationend` unmounts it, so the duration lives in one place rather than in keyframes plus a `setTimeout` free to drift. Under `prefers-reduced-motion` it swaps to a fade-only keyframe **at the same duration** — collapsing to 1ms like the sheets do would make it unreadable. The wrapper centres and the pill animates, because a keyframe `transform` would otherwise wipe out a centring `-translate-x-1/2`. `clearsBottomBar` sets the offset: 72px in A to clear the bar, 24px in B, which has none. Keyed by an incrementing id in `PlpScreen` so firing twice replays the animation |
| Brands panel | Uses the **same tile grid as Category**, not a checkbox list |
| Tile grid | Figma frame `Category` (`638:3696`): 68×96 cells, 56px square at radius 9.333, 4px gaps, 14px left inset, three across. The label is a **fixed 36px two-line box** — reserved even for one-line labels, so tiles on a row bottom out level — and long labels clamp at two lines rather than truncating on one. Shared by Category and Brands in both variants; change it once. |
| Tile grid layouts | `TileGrid` takes `layout`. **`fixed`** (default) is the frame exactly, and is what the 240px filter panel uses — the only surface Figma draws. **`fill`** is for the Category sheet, which has no frame: at 360px, left-aligned 68px cells fit four and strand a whole empty column, so cells divide the width instead (8px insets, 2px column gap, 64px floor) and five go across at 67.2px. The 56px square, the 4px row gap and the 36px label box are identical in both |
| Reserved height vs clamp | They must live on **different elements**. Put `h-[36px]` and `line-clamp-2` on the same span and the explicit height wins, so a three-line label is cropped mid-glyph at 36 of its 39px instead of ellipsised. Wrapper reserves, inner clamps |
| Undesigned panels | Ten of twelve facets aren't designed. They reuse the designed checkbox row rather than introducing sliders or swatch grids. Colour adds a 16px dot; price/margin/MOQ use bucket rows |
| Seller PLP scope | Baheti Garments is a **storefront aggregating multiple sellers** (the app bar says Baheti while the Seller facet lists other companies). Other seller pages are scoped to their own stock |
| `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers** for the facet. Separately, `Seller Offer` is now a distinct catch-all facet — the two are not the same thing |
| Offer names | `Free Shipping` was renamed **`Free Delivery`** (2026-08-13) to match the chip vocabulary, which also changes its product-card tag. `Bulk Offer` and `GOLD Target Scheme` keep their names and stay out of the chip strip |
| Set pills | Selectable — picking a pack re-prices that card. Dots track scroll pages |

**Skipped as design artefacts:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and `Margin` being SemiBold while its eleven siblings are Medium.

## Imagery

- **Category tiles** — Unsplash stock in `public/categories/`, credited in `CREDITS.md`. Filenames match the category id (`womens-t-shirts.jpg`), fetched at 336×336 = 6× the 56px tile. All seven are **worn on a model**, because every category names its audience and at 56px a person says who it is for faster than a flat-lay does; they're also picked for seven distinct dominant colours. `boys-casual-t-shirts.jpg` carries an incidental Levi's wordmark — unreadable at tile size, noted in `CREDITS.md`.
- **Product card renders don't match the T-shirt categories.** Only two shirt renders exist in Figma, and four of the seven categories are now tees, so a card titled "… Casual T-Shirts for Boys" shows a button-up. Pre-existing constraint, more visible than it was. Needs a designer to export tee renders — don't substitute stock photography on the card.
- **Brand tiles** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced (Clearbit's API is retired; Wikipedia/Commons returned unrelated files for 7 of 8 brands). The right input is brand-supplied assets, which also avoids scraping trademarked marks.
- **Product images** — only two shirt renders exist in the Figma file, assigned by whether the colour is dark or light.

## Working style

- Verify visually before claiming something works. Playwright is not a dependency — install it ad hoc (`npm install --no-save playwright`), screenshot at 360px with `deviceScaleFactor: 2–3`, then uninstall. Hide the dev overlay first: it intercepts clicks.
  ```js
  await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
  ```
- Badged buttons change their accessible name (`Filters` becomes `3 Filters`), so use regex selectors in tests.
- Run `npx eslint .` from the repo root — the shell's working directory persists between commands and a stale `cd` produces confusing failures.
