# SOLV — Filter & Sort Prototype

A runnable Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which don't exist in the product today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products and a working faceted-search engine behind the designed UI.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
```

Deploys to Vercel. The deployment is password-gated by `proxy.ts`, which fails closed — set `SITE_PASSWORD` **before** deploying, and pass `--scope bitihotra-karaks-projects`. See `progress_tracker.md`.

---

## The two variants

Four variants over one catalog, crossing **control placement** against **starting scope**. A and B walk Home → tap *Baheti Garments* → PLP → filter and sort; C and D drop straight inside a product vertical.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/[sellerId]` | Sort · Filters pinned to the bottom (Figma `638:2836`) |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | The same two as chips under the app bar (Figma `644:4011`), no bottom bar |
| **Variant C** | — | `/c` | Bottom bar, already inside one vertical |
| **Variant D** | — | `/d` | Top chips, already inside one vertical |

**The rails are identical.** Category rejoined A's rail on 2026-08-19, so where Sort and Filters sit is the whole of the difference.

There is also **`/userjourney`** (2026-08-20), which is not part of the 2×2: a
single named flow through one storefront, built 1:1 from screengrabs of the live
app. See decision 28.

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
| `638:3696` | Tile grid (frame renamed `Category`) — 68×96 cells, 56px tile, two-line label |
| `674:4904` | Chip detail — the product-vertical chip, unselected and selected |
| `674:4904` | Chip detail — the product-vertical chip |

Design width **360px**. Tokens are mapped into `app/globals.css` under `@theme` using their Figma variable names: `primary/default #004FFA`, `primary/subtle #CCDCFE`, `text/heading #1A1C1F`, `Secondary/Orange-500 #FF7711`, `Orange-400 #FF923F`.

Fonts: **Roboto** throughout and **Inter** for button labels only (`Clear Filters`, `Show N results`). Rowdies set the GOLD wordmark and went with it on 2026-08-19.

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

**Size is the one facet counted by filtering rather than tallying**, because its selection moves which pack a product is priced by and so can push it out of another facet's band — a tally taken with Size skipped can't see that, and once offered an option labelled `(1)` that returned an empty page. Each of its thirteen options is applied **on its own** alongside the other facets' selections, which is the same own-facet-excluded question, just answered by a filter pass. Applying `selected ∪ option` instead looks equivalent and isn't: Size is OR-within-a-facet, so a union only widens, and every option would inherit the current selection's count and never fall to zero — which is precisely how kids' age bands turned up inside Women's T-Shirts on 2026-08-20.

Options that fall to zero are hidden. Anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### The active pack — `lib/filters/activeVariant.ts`

Sizes are the one thing that lives on the **pack** rather than the product, and that makes a size filter ask two questions instead of one. *Is this product in?* — yes if any of its two-to-four packs carries a selected size, which is the ordinary OR-within-a-facet rule and needs no exception. And then: *which pack is the card talking about?*

`activeVariant(product, sizes)` answers the second. Pack #1 normally; under a size filter, the leftmost pack carrying a selected size — pills run in ascending set size, so that is the smallest pack a retailer can buy their size in. Price and margin read that same pack for sorting and for the Price Range and Margin facets, so a card is ranked on the number it prints. It is kept out of both the engine and the registry because both need it and neither owns it.

### Facet registry — `lib/filters/facets.ts`

Twenty facets behind thirteen rail entries, rising to eighteen inside a single product vertical — the attribute block joins and Gender leaves — the same in both variants. Each facet declares `valuesOf(product, sizes?) → string[]`, so range buckets, multi-valued delivery windows and plain checkboxes all flow through one code path. Adding a facet is one array entry. `sizes` is the current Size selection and the only selection any facet may see — Price and Margin need it because they read the pack the card is showing; every other facet ignores it.

`FACETS` is everything the engine knows about; `getRail()` is what the Filters screen displays. It takes no variant since 2026-08-19: Category left A's bottom bar and rejoined the rail, so both variants show the same thirteen rows, headed by Category then Gender — and the same eighteen inside one vertical, where Gender drops out and the attribute block joins at the end.

**Gender** stays despite every category naming its audience — it is a faster cut than ticking three tiles, and dropping it would leave `?gender=` links with no UI. But only *across* verticals: settle on one and it goes, category → gender being 1:1, so it could then only offer the single value everything in scope already has.

`getRailFacetIds()` is the set that anything mutating the draft (notably Clear Filters) must filter through, so a facet the screen doesn't show can never be cleared by it. It is kept as a filter rather than a blanket reset so it still holds if the rails ever diverge again — and since the set is read from the draft, it already excludes something in practice: a cross-vertical rail carries no Size row, and the vertical block only exists inside one. `clearSelections` in `engine.ts` is the one place the rule is written, shared by the Filters screen and its test.

Pack Type was removed as a filter on 2026-08-19 — a deliberate departure from Figma's rail. It left `FACETS` too, not just the rail, since a facet with no control would survive Clear Filters uncounted; the product field stays, because the seed draws it mid-sequence and it still decides whether a pack is one size or a spread.

Panels: Category and Brands use the tile grid (68×96 cells, 56px tile, fixed 36px two-line label reserved whether or not it's used, so a row's tiles align); Colour is a checkbox row with a 16px colour dot; Price Range, Margin and MOQ are checkbox rows over preset buckets (no slider — that would add a control the design system doesn't have); everything else is the designed checkbox row.

### State — `lib/filters/urlState.ts`

Filter state lives in the query string: `?gender=men,boys&seller=grasim&sort=margin_desc`. Local state is the source of truth and the URL is mirrored via `history.pushState`, which keeps filtering instant while still giving a working back button and shareable links to any combination.

### Catalog — `lib/catalog/`

1,070 garment products (matching the design's "Show 1,070 results"), from a fixed-seed PRNG so counts never shift between reloads or between server and client. 7 categories, 4 genders, 8 sellers, 10 brands, 20 colours, 3 pack types, 6 fabrics, 13 sizes; each product carries 2–4 pack variants driving the card's set pills.

Colour went from ten to twenty on 2026-08-20, to give the Filters screen one panel that genuinely overflows — see decision 28. Safe for the seed because `weightedPick` takes exactly one `rand()` however long the array is, so no other draw moved. (The counts it was verified against — Girls 97, Men 575, `₹900 & above` 37 — were superseded on 2026-08-20 when the set-size shuffle was fixed and the catalog re-rolled once; see *Engine-independent seed* below. The colour change itself still moved nothing.)

The seven categories come from the merchandising list and **name their audience**: Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts. Category → gender is therefore 1:1 rather than many-to-many, which makes pruning sharper, not weaker — picking *Girls* leaves one tile of seven (108 results) and *Men* leaves three (584).

| Category | Products | Price band /pc |
|---|---|---|
| Women's T-Shirts | 173 | ₹150 – ₹450 |
| Men's Formal Shirts | 168 | ₹260 – ₹1,150 |
| Men's Casual T-Shirts | 222 | ₹160 – ₹480 |
| Men's Casual Shirts | 194 | ₹220 – ₹780 |
| Girl's T-Shirts | 108 | ₹110 – ₹320 |
| Boy's Casual Shirts | 98 | ₹150 – ₹430 |
| Boy's Casual T-Shirts | 107 | ₹110 – ₹330 |

Price bands are per-category rather than one blanket rule, so kids' lines sit below adult ones and formal above casual and the Price Range facet has something to separate. Men's Formal Shirts reaches ₹1,150 to keep the top bucket (`₹900 & above`, 36 products) populated — all five price buckets and all four margin buckets are live.

Brands are category-restricted too, kids' lines carrying the fewest: Boy's Casual T-Shirts collapses the Brands grid to two tiles.

Sizes are as well, and go further — kids' lines are sized by age band (`2-3Y` … `12-13Y`) and adults' by letter (`XS` … `3XL`), so picking Girls empties the Size panel of letters and picking Men empties it of bands. Each product is made in one contiguous **run** of its vocabulary, and its packs are quantity splits of that run rather than fresh draws, which is what stops 2–4 packs unioning into near-total coverage and leaving the control with nothing to prune.

| Size | Products | | Size | Products |
|---|---|---|---|---|
| XS | 43 | | 2-3Y | 78 |
| S | 225 | | 4-5Y | 168 |
| M | 404 | | 6-7Y | 189 |
| L | 468 | | 8-9Y | 142 |
| XL | 308 | | 10-11Y | 62 |
| 2XL | 116 | | 12-13Y | 17 |
| 3XL | 28 | | | |

### Device frame — `components/DeviceFrame.tsx`

Below 480px the app renders edge to edge and reads as the real thing. At 480px and above the untouched 360×800 app sits inside a CSS phone mockup, so no Figma dimension ever has to stretch.

---

## Decisions taken where the designs were silent

Several of these were revised during review — the current state is what's listed.

| # | Question | Decision |
|---|---|---|
| 1 | Facet counts | Footer total **and** per-option counts both recompute live on every tick. Zero-count options are hidden; anything selected stays visible even at zero. |
| 2 | Sort sheet | Tapping a row applies and closes — the design has no Apply button. The first row reads **`Popularity (Default)`** since 2026-08-25: it is where every listing starts and what a bare URL means, and Sort's dot only ever says *not default* without naming what default was. The word is in the `SORT_OPTIONS` label, that string being the only thing `SortSheet` reads. |
| 3 | ~~Bottom bar slot 1~~ *(superseded 2026-08-19 — see 23)* | **Category**, replacing Gender (2026-08-13). The categories name their audience now, so gender stopped earning a control of its own. Figma's frame says Gender; this is a deliberate departure. `tag.svg` stands in as the icon — the design has no Category bar slot and so no glyph for one, and this one is already the Sort sheet's *Recently Added* icon. Wants a designed replacement. |
| 3a | ~~Category~~ *(superseded 2026-08-19 — see 23)* | **A:** a multi-select quick action in the bottom-bar sheet, with a draft and a `Clear all` / `Show N results` footer — a retailer plausibly wants Men's Casual Shirts *and* Men's Casual T-Shirts, so "tap applies and closes" would be wrong here even though it was right for Gender. Absent from A's rail, because the bar owns it. **B:** an ordinary rail facet, first. The sheet reuses the Filters screen's `TileGrid`, so cell geometry can only change in one place; being wider than the 240px panel, it wraps four across instead of three. |
| 3b | Gender | An ordinary multi-select rail facet in **both** variants — first in A's rail, second in B's, a checkbox in each. It briefly had no control in A at all, on the grounds that the categories name their audience; put back because redundant isn't useless, it is a faster cut than ticking three tiles, and `?gender=` links need somewhere to show. The single-select `GenderSheet` stayed deleted — the bottom-bar slot it lived in belongs to Category now. |
| 4 | Set pills | Selectable. Picking a pack updates that card's MRP, price/pc, margin and set size. Dots track scroll pages. |
| 16 | Contextual chips | Defined 2026-08-13, having been reserved and empty since the start. The strip below the GOLD bar answers whichever question is still open: **not inside a single product vertical** (none picked, or several) it offers the verticals; **inside exactly one** the picked vertical stays at the head of the strip — its ✕ is the way back out — followed by Price, Seller Offer, Cashback and Free Delivery. Both variants — in B after the divider `644:4011` already draws for it, in A as the whole strip, which collapses when empty. Chips write the same facets as everything else, so tapping one is just a shortcut, and the Filters badge and Category badge pick it up as they would any other route. Selection logic is pure, in `lib/filters/contextChips.ts`. |
| 17 | Seller Offer | Means *any offer at all* — its own `hasOffer` facet, not a fifth option inside `offers`, because inside it OR-within-a-facet would make Seller Offer widen a Cashback selection instead of narrowing it. Listed in the Offers rail entry so a chip-applied filter is still clearable once the strip moves on. The three offer chips appear only when some but not all products in scope carry the offer; price bands and verticals keep the plain hide-at-zero rule. `Free Shipping` was renamed `Free Delivery` to match. |
| 18 | Chip design | Material 3, as asked, in this app's palette. Offer chips are **filter chips**: 8dp corner, outline unselected, filled with a leading checkmark when selected, 14sp Medium. Vertical chips come from **Figma `674:4904`** rather than the M3 spec — a square full-bleed thumbnail against the frame's circular avatar, and the label kept when selected, with the exported `close_small` glyph beside it. *Revised twice since:* the whole strip went to **44px** on 2026-08-14, up from the frames' 32, so a thumbnail is large enough to identify a garment — `CHIP_H` is the one number and `TopChipBar` imports it. **One 8px radius across the row** settled the mismatch this row used to log: the vertical chip's 4px and the Sort/Filter pills' rounded-100 both gave way, three radii in one scrolling row reading as a mistake. Price, Seller Offer, Cashback and Free Delivery each gained a **leading icon** on 2026-08-19, in a 26px `object-contain` box; the offer chips lose theirs to the checkmark when selected, Price keeps its rupee, having no checkmark. |
| 19 | Price dropdown | One chip opening an anchored menu over the bands rather than a chip each. Multi-select with a checkbox and count per row, matching the Price Range facet in Filters; each tap applies live, the menu stays open, and there is no Apply. The closed chip carries the state — the band's name for one, `Price (n)` beyond. The menu renders at the screen root because the strip's `overflow-x-auto` would clip a child, with its position measured on open and clamped to the frame. |
| 20 | Size | Sizes live on the **pack**, not the product, so a product matches when any of its packs carries a selected size. That is the engine's ordinary OR-within-a-facet rule with no exception, so Size cost one array entry like everything else — and it means ticking M *and* L widens to their union (605) rather than narrowing to packs carrying both. Confirmed 2026-08-18 after the ALL-within-one-pack reading was put up and rejected. |
| 21 | The pack a card is judged by | Under a size filter the card opens on the **leftmost pack carrying a selected size** — pills run in ascending set size, so that is the smallest pack a retailer can buy their size in. Price and margin read that same pack for sorting and for the Price Range and Margin facets. Leaving them on pack #1 while the card printed another pack's price left `Price/pc low → high` showing 63 visibly-descending prices at `size=M,L`: not wrong, but ranked on numbers nobody can see, which reads as broken sorting. MOQ is a product field and does not move. The pill row scrolls itself to that pack, by setting `scrollLeft` rather than calling `scrollIntoView`, which would scroll every ancestor and let twenty mounting cards yank the PLP. |
| 22 | Size seed | Runs are drawn **per product**, not per pack: a garment comes in S–XL and is sold in quantity splits of that run. Drawing per pack let 2–4 packs union into near-total coverage — L in 96% of the catalog, M in 93% — so ticking a size pruned about 4% and the control was dead; runs put L at 44% and M at 38%. Kids' lines are sized by age band and adults' by letter, category-restricted the way brands and price bands already are. The runs come from their own PRNG stream, because one extra draw on the main one would have re-rolled the catalog and invalidated every count in this file. (Those counts were re-based on 2026-08-20 by the *Engine-independent seed* fix — the size runs themselves still moved nothing.) |
| 23 | Category leaves the bottom bar | Removed from A's bar on 2026-08-19 and returned to the Filters rail, first row, matching B. A facet reachable from both a bar slot and a chip kept raising questions the bar was the wrong place to settle — whether the slot should hide once a vertical was picked, which control owned the count, what Clear Filters could touch. One control, one owner. Three consequences, all wanted: the Filters badge now counts category, Clear Filters now wipes it in A, and the `CategorySheet` is deleted along with the slot that opened it, exactly as `GenderSheet` was. Multi-select survives — the rail's `TileGrid` was always multi-select. The A/B is now purely about where Sort and Filters sit, which closes backlog item 10. |
| 24 | Vertical-specific attributes | **Fit, Neck Type, Sleeve Type, Pattern, Closure Type** (2026-08-19). Shown **only inside exactly one vertical**, and **after the commercial rows** rather than interleaved beside Fabric where the reference puts them (moved 2026-08-19 — interleaved, they pushed Price Range from 6th to 12th and below the fold): across verticals a Neck Type list mixes *Spread Collar* with *Round Neck* and answers nothing. Shirts and tees draw separate vocabularies, chosen by `kind` on the category the way gender chooses the size vocabulary, and the union is the facet's option list so zero-count pruning does the separating with no special case. Leaving a vertical drops its attribute selections, or they would narrow the list uncounted with no control left to undo them. `PRODUCT_COLOR` and `AVAILABLE_SIZES` from the same request were already the `colour` and `size` rail facets, and stay there — both are useful across verticals. `FABRIC_MATERIAL` was asked for with them but is not one of them: its values don't vary by vertical, so it became an ordinary rail row beside Colour and left *More Filters*, which now holds Product Tags alone. | **Gender leaves as they arrive**, category → gender being 1:1, so inside one vertical it could only offer the value every product in scope already has — the argument C and D already made, now applied wherever the vertical is settled. Gender out and Size in cancel exactly, so Colour through Seller City hold the same index in both states. The guard that drops orphaned selections runs both ways for it and is named `dropOrphanedSelections`. |
| 25 | Vertical-scoped variants | C and D (2026-08-19) make the comparison a 2×2: A and B list every category, C and D *are* one, and the pair differ from each other only by control placement. The vertical is **page scope, not a filter** — pre-scoped products, `category` never a selection — which is what lets the Category row leave the rail without stranding a filter no control can undo. **Gender goes with it**: category → gender is 1:1, so one vertical is one gender and the row could only offer the value every product in scope already has. No vertical chip in the strip, and the attribute block always on. 17 rows. `/c` and `/d` are the listing itself — one URL, no browse path in front, since the point is the state rather than the route to it. Other seller/vertical pairs live under them. No home button: every href it could hold leads out of the variant, and dropping it buys the width the category title needs. |
| 26 | Card format follows the live app | The product card's wording comes from a **screengrab of the shipping SOLV app** (2026-08-14), not Figma, wherever the two disagree: `MRP/PC ₹299 \| SET of: 6` on one pipe-separated line, `PRICE/PC` in caps, pills reading `SET OF 6` over `M/2, L/2, XL/2`. The old line never said the MRP was per piece although it always was, so it read as a pack price and made the margin look wrong. Mixed case in `MRP/PC` vs `SET of:` is the app's own and is reproduced rather than tidied. The `+₹50 shipping fee` line went on 2026-08-20, not being a real charge — which also closes the last disagreement with the screengrab, where no such line appears. The price block was **measured** off that screengrab, which is 1080×2400 — exactly 3× the design — so every device pixel divides cleanly: margin sits 10px after the price on the same baseline, the title sets on a 16px pitch, and the column carries no uniform `gap` because its rows sit at different distances. Re-measure rather than eyeball if you change any of it. |
| 28 | The user journey | A fifth route (2026-08-20), `/userjourney`, and **a named flow rather than a variant** — it demonstrates one buyer's path end to end instead of testing a control placement. Home → the **Kartik exporters** banner → his storefront → *Gender → Women* → *Recently Added* → S/M/L → a product detail screen. Built 1:1 from four screengrabs of the live app at 1080×2400, which is exactly 3× the design, so it was measured off the raw pixels rather than eyeballed. **Kartik's catalog is separate**, 540 Zenifit tees on their own PRNG streams in three verticals, so the 1,070 and every count in this file are untouched; a test asserts it. **His three verticals exclude Girl's T-Shirts**, which is what leaves exactly one women's vertical and lets a Gender cut settle a single PV. The card is a **second design** on that route only — cashback ribbon, offer pills, blue `VIEW DETAILS` — because A–D are signed off and must not drift; the cost is two card designs in one prototype. `PlpScreen` took props (`card`, `appBar`, `aboveList`, `belowList`, `listClassName`) rather than a second copy of the screen. |
| 29 | A vertical can be settled without being ticked | The journey's blocker, fixed 2026-08-20. `inSingleVertical` tested the **category selection**, so *Gender → Women* settled nothing and Size — vertical-only since 2026-08-19 — never joined the rail: the S/M/L step had no control to tap. `settledVertical` asks about **scope** instead, so a vertical is settled when the products in scope span exactly one category, however they got that way. That is the original rationale carried through — *M in menswear is not M in womenswear* stops being true the moment one vertical is in scope, and it never mattered which control narrowed it. **Only Category and Gender may settle it**: those two decide who the garment is for, and letting a colour or price band count would make five rows appear and vanish as a buyer ticks unrelated boxes. Splitting the two questions that had shared one flag found a real bug — a Gender cut that settled a vertical was taking the Gender row off the rail while its selection survived, a live filter with nothing to show or undo it. Caught by a test. `getRail` and `dropOrphanedSelections` take the settled vertical as a third argument, defaulting to `null` so every prior caller is unchanged; `parseSelections` takes the page's products, or a shared `?gender=women&size=s,m,l` lost its Size on load. |
| 30 | Engine-independent seed | The set-size shuffle was `[...SET_SIZES].sort(() => rand() - 0.5)` — the shuffle antipattern. A comparator returning a coin flip is not a consistent ordering function, so V8 chooses both the resulting order and **how many `rand()` calls it consumes** (measured: 6, 7 or 8). Drawing from the *main* stream inside the per-product loop, a differing count re-rolled every later product. It shipped: Vercel builds on Node 24 and development ran Node 26, and the two served different catalogs from one seed — 55 vertical routes locally against 56 in production, `Men` 575 against 590, five of seven category counts apart, with every test passing on the machine that wrote it. Replaced 2026-08-20 with **Fisher–Yates, exactly `SET_SIZES.length - 1` draws whatever the values and whatever the engine**. The catalog re-rolled once — every count in this file was re-measured and is now identical on Node 24 and Node 26, with the suite run under both. `lib/catalog/seed.test.ts` pins the draw count so a comparator can't come back. **Any shuffle here must take a draw count fixed by the array's length.** |
| 27 | Margin is blue | `--color-margin` points at **`primary`**, not the frame's `#39b54a` green — the live app renders margin in the same blue as a selected set pill. Contrast goes 2.66:1 → **6.0:1**, clearing AA. Likewise `--color-muted` is the measured `#7f7f7f` rather than `#999999`: 2.85:1 → 4.0:1, still short of 4.5 at 12px, so it stays on the contrast list. |
| 28 | The search field is earned | The Filters panel's search box appeared wherever a facet set `searchable: true`, and all five that set it — Category 7 tiles, Brands 10, Colour 10, Seller 8, Seller City 8 — fit inside the panel whole. It spent 56px of a 690px fold letting you search a list already on screen. The flag is deleted (2026-08-20); the field now shows only when the options actually overflow, and **hides again when pruning shortens them** — Colour needs it across the catalog and not inside Girl's T-Shirts at 12-13Y, where five colours are left. To have something that overflows at all, the palette went from ten colours to twenty. **Decided from counts, not measured from the DOM:** `scrollHeight > clientHeight` is the literal reading, but the server can't measure, so SSR would render no field and the client would add one after hydration — a 56px shift every time a panel opened. `lib/filters/panelFit.ts` does the arithmetic both sides can do, from the rendered sizes; it works out to 14 checkbox rows or 22 tiles, and a test pins both thresholds so a row-height change in the markup can't drift away from it silently. |
| 5 | Applied-filter cue | Carried by the controls themselves, in both variants: a **dot** for anything holding one value (Sort), a **count** for anything that can hold many (Category in A, Filters always). Category is excluded from A's Filters count since it reports itself. Removable filter chips were built and then removed on request — in Variant A that strip is reserved for contextual chips, still undefined. |
| 6 | Clear Filters scope | Clears only the facets the rail owns — which, since Category rejoined it on 2026-08-19, is all of them in both variants. The exception that spared category in A went with the bottom-bar slot: it existed because clearing a filter from a screen that never displayed it is a silent surprise, and the screen displays it now. Still expressed as a filter over `getRailFacetIds()` rather than a blanket reset, so the rule holds if the rails ever diverge again — and the set is read from the **draft about to be cleared**, so a settled vertical's Size and attribute rows clear with it while C and D's page scope, never a selection, survives. `clearSelections` in `engine.ts` is the one place the rule is written. |
| 6a | Clear Filters commits | **It applies and closes** (2026-08-25), rather than editing the draft and waiting for `Show N results`. A buyer who taps a button called *Clear Filters* expects the filters gone and the listing back; what they got was a screen that looked unchanged apart from a counter, still asking to be dismissed through the CTA — the one control there whose effect they couldn't see, and the reason clearing read as broken. Clearing is a complete instruction rather than a partial edit: there is no half-cleared state left to keep refining, so holding someone to confirm it a second time is a step with nothing in it. It goes out through the same `onApply` the CTA uses, so `commit` drops orphans, rewrites the URL and scrolls the listing to the top; and the accepted cost is that re-picking from scratch means reopening the screen: one tap, against an action that previously appeared to do nothing. **It announces itself** — `All filters cleared` — because landing on a full listing is ambiguous on its own: a buyer who has just cleared four filters and one dumped there by a bug see the same screen. That makes three exits with three different voices; see decision 15. |
| 7 | Seller facet on a seller PLP | The app bar says *Baheti Garments* while the Seller facet lists Heeralal, Gagan, Grasim. Treated as a **storefront aggregating multiple sellers**, so the whole catalog is in scope there. Every other seller page is scoped to its own stock. |
| 8 | `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers**. |
| 9 | Undesigned facet panels | Only Category (tile grid, reworked 2026-08-12 to 68×96 cells with a 56px tile and a two-line label) and Seller (checkbox list) are designed. Brands was moved to the tile grid on request; the rest reuse the checkbox row rather than introducing sliders or swatch grids the design system doesn't have. Colour adds a 16px dot before the label; price/margin/MOQ use bucket rows. |
| 13 | Category ids | Declared in the catalog, not slugged from the label — slugging *Women's T-Shirts* would put `women-s-t-shirts` in the URL and in the image filename. Products store the display label and the facet maps back through `CATEGORY_ID_BY_LABEL`. |
| 14 | Product titles | Use a gender-free `plural`, so a card reads "… Casual T-Shirts for Boys" rather than "… Boy's Casual T-Shirts for Boys". Tested. |
| 10 | Zero results | Not designed. A centred "No products match" with a *Clear Filters* button. |
| 11 | Home seller cards | The design's third card is *Pawan footwear*, which has no catalog behind it, so Grasim Fabrics takes that slot and every card navigates somewhere real. Product counts are read from the catalog. |
| 12 | Sheet motion | Asymmetric — enter 260ms decelerate, exit 200ms accelerate, scrim 200/160ms, all collapsed to 1ms under `prefers-reduced-motion`. The sheet owns its own dismissal so it can animate out before unmounting. **The Filters screen joined it on 2026-08-25**, being the last surface that appeared and vanished between frames — but on its own `screen-in`/`-out`, and only after the sheets' classes were tried and rejected. Pinned to `inset-0`, their `translateY(100%)` is exactly the frame's height, and 800px of literal travel reads as an elevator ride where the same 260ms over a 300px sheet reads as a sheet. So **32px and a full fade** instead: M3's 30dp for a full-screen surface, on the app's 8px grid, at the scrim's 200/160 rather than the sheets' 260/200, because what it mostly does now is change an alpha. Alpha carries the arrival; the distance only names the direction, which is the trade `dialog-in` already makes one property over. It owns dismissal the same way, and its `exit` puts the commit before the animation and the toast after: the listing is covered while the panel is opaque and should already show the answer when revealed, where a toast behind that panel is a toast nobody sees. |
| 15 | Discarded drafts | Dismissing a draft surface without applying throws its edits away, and doing that silently reads as the filter being broken, so the Filters screen (✕) raises a **`Selection discarded`** toast. It fires only when edits would actually be lost: untouched, edited-back-to-start, and applied all stay quiet, decided by `sameSelections`. It is the only draft surface since the Category sheet went on 2026-08-19; the string stays a named constant so a second one can't word the same event differently. **A second toast joined it on 2026-08-25**, and the two are opposite jobs: `Selection discarded` is a *warning* that edits went where nobody could see them go, `All filters cleared` a *confirmation* that a listing which looks unfiltered is the answer rather than an accident. `Show N results` stays wordless — a buyer watching the result they asked for needs no narration. `CLEARED` covers both controls named *Clear Filters*, the footer and the zero-results recovery button, since they do the same thing. The toast is an addition (`components/ui/Toast.tsx`); its lifetime is its CSS animation, so the duration is declared once, and it sits 72px up in A to clear the bottom bar, 24px in B. |

**Two things in the design that were deliberately not reproduced:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and the `Margin` rail label being SemiBold while its eleven siblings are Medium. Both read as artefacts. Say the word if either was intentional.

---

## Verification

- `npm test` — 94 tests over the engine: OR-within/AND-across, own-facet-excluded counting, the Girls pruning case, selected-but-zero staying visible, sort ordering, URL round-trip, pack breakups summing to their set size, the size facet's match-and-active-pack rules, the rail order pinned in both states, and the two panel-fit thresholds with the twenty colours that exercise them.
- `npm run dev`, then Chrome DevTools at exactly 360px, and compare each screen against its Figma frame.
- Widen past 480px to confirm the phone mockup appears and the app still renders at 360.

**Demo script (Variant A):** Home → Baheti Garments → Category → tick *Men's Casual Shirts* + *Men's Casual T-Shirts* → footer reads Show 416 results → apply, and the Category badge reads 2 while Filters stays bare, because the bar reports its own → Filters → Seller → tick Grasim + Gagan → counts shrink → Show results, Filters badge reads 2 → Sort → Highest Margin → order changes and a dot appears on Sort → Filters → Clear Filters, which applies and closes on the spot: the listing returns to 1,070, the URL goes bare and every badge clears. The URL tracks every step and the back button unwinds it.

**Facet pruning (Variant B, where Category and Gender share a rail):** Filters → Gender → Girls → Category → six of the seven tiles are gone, only *Girl's T-Shirts* stands. In A the same cut is Filters → Gender → Girls, then Category from the bottom bar.

**Brand pruning (either variant):** Category → *Boy's Casual T-Shirts* → Filters → Brands → the grid drops from ten tiles to two (Killer, Monte Carlo), 107 results.
