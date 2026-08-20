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

## The deployment is password-gated; localhost is not

`proxy.ts` puts HTTP Basic Auth over every request — pages, `_next` chunks and
`public/` alike, since a gate that lets the assets through isn't one. Any
username; the password is Vercel's `SITE_PASSWORD` env var and is never in the
repo. Vercel's own password protection is Pro-only and the API refuses it on
this Hobby team, which is why this is application code.

Two properties to preserve if you touch it:

- **It keys off `VERCEL`**, not `NODE_ENV`. The platform sets `VERCEL=1` and
  your machine doesn't, so `npm run dev` never prompts — and neither does a
  local `next build && next start`, which `NODE_ENV` would have caught.
- **It fails closed.** No `SITE_PASSWORD` on a deployment means 503 for
  everything, so a missing secret is loud instead of silently public. Set the
  env var *before* deploying, and note env changes only take effect on the
  next deploy.

The file is `proxy.ts`, not `middleware.ts` — the middleware convention is
deprecated in Next 16 and renamed. Same behaviour, different file and export.

## Two control variants of the same PLP

Both render the identical card, catalog, engine and sheets. **Only the controls differ**, so a preference between them is about control placement and nothing else. Don't let them drift apart in any other respect.

| | Home | PLP | Controls | |
|---|---|---|---|---|
| **Variant A** | `/` | `/seller/[sellerId]` | Sort · Filters pinned to the bottom (Figma `638:2836`) | **parked** |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | The same two as chips under the app bar (Figma `644:4011`), no bottom bar | live |
| **Variant C** | — | **`/c`** | Bottom bar, already inside one vertical | **parked** |
| **Variant D** | — | **`/d`** | Top chips, already inside one vertical | live |

> **The bottom bar lost the A/B** (2026-08-20). The basket bar owns the foot of a
> SOLV listing — it is in the live app's own screengrab — so a pinned Sort ·
> Filters bar is a second bar competing for the same edge, and one of the two has
> to give. Work is now on the **top-chip screens only: `/b`, `/d` and
> `/userjourney`**, and `/userjourney/seller/kartik` moved onto top chips the same
> day for exactly this reason.
>
> A and C are **parked, not deleted**: the routes stay live and shareable, the
> `bottom-bar` branch of `PlpScreen` stays with them, and nothing further goes
> into either. Everything below still describes all four, because a park is
> reversible and a rewrite of these notes wouldn't be.

C and D (2026-08-19) make it a **2×2**: A and B start across every category, C and D start *inside* one. `/c` and `/d` **are the listing** — one URL, no browse path in front, because the point is the state, not how you got there. Other pairs are at `/c/seller/[sellerId]/[categoryId]`; `DEMO_VERTICAL` in `scope.ts` is the one the bare URL lands on.

`VerticalMode` in `facets.ts` is the axis, and every screen takes one:

- **`filter`** (A, B) — a vertical is a facet. Category is a rail row, chips toggle it. **13 rows** across verticals; **18** inside exactly one, where the attribute block joins and Gender leaves.
- **`locked`** (C, D) — the vertical *is* the page. No Category, no Gender, no vertical chips, attribute block permanently on. **17 rows.**

**A vertical can be settled without being ticked** (2026-08-20). `settledVertical` in `facets.ts` asks whether the products *in scope* span exactly one category, not whether one was selected — so on a tee-only storefront `Gender → Women` settles a PV on its own and Size joins the rail. That is the original rationale carried through: *M in menswear is not M in womenswear* stops being true the moment one vertical is in scope, whichever control narrowed it. **Only Category and Gender may settle it** — those two decide who the garment is for, and letting a colour or price band count would make five rows appear and vanish as a buyer ticks unrelated boxes, which is what the 2026-08-19 reorder existed to stop.

Two questions had been sharing one flag, and splitting them found a bug: a Gender cut that settled a vertical took the Gender row off the rail **while its selection survived**, leaving a live filter nothing could show or undo. Whether the attribute rows *show* is about scope; whether Gender is *orphaned* is narrower — only a ticked category implies the gender. So the rail there is **19 rows**, Gender included, where a Category tick still gives 18. `getRail` and `dropOrphanedSelections` take the settled vertical as a third argument defaulting to `null`, so every prior caller is unchanged; `parseSelections` takes the page's products, or a shared `?gender=women&size=s,m,l` loses its Size on load.

C and D carry **no home button**, which gives the title room — they are titled by category and the frame's 20px was sized for a seller name.

**The two rails are now identical.** Category rejoined A's rail on 2026-08-19, so where Sort and Filters sit is the entire variable — the cleanest the A/B has been.

Separate routes rather than a query flag — chosen so each has its own shareable link and neither inherits the other's state. Switch by editing the URL.

**Each variant is a closed loop.** Hand someone `/b` and the whole journey stays in B. Three things enforce that, and all three must be kept in step when adding a route:

- `PlpScreen` takes `variant: "bottom-bar" | "top-chips"` — there is no second copy of the screen.
- `HomeScreen` takes `basePath: "" | "/b"`, so its seller cards link into the right variant.
- `AppBar` takes `homeHref`, because a hardcoded `/` silently drops a Variant B session into Variant A mid-demo.

The journey is Home → tap *Baheti Garments* → PLP → filter and sort. Variant A is the default; Variant B is the same journey with the controls moved.

## `/userjourney` — a named flow, not a fifth variant

Added 2026-08-20 and **outside the 2×2**: it demonstrates one buyer's path end to
end rather than testing a control placement. A garment seller in Imphal wants
trendy women's tees their catchment doesn't carry.

```
/userjourney                      home — banner only
/userjourney/seller/kartik        Kartik Exporters' storefront
/userjourney/product/[productId]  the detail screen
```

Home → tap the **Kartik exporters** banner → storefront → *Gender → Women* →
*Recently Added* → S/M/L → tap a card → detail.

**Source is four screengrabs of the live app, not Figma** — at 1080×2400, exactly
3× the design, so values were read off the raw pixels. They live in `userflow/`
(untracked). Where the screengrab and Figma disagree here, the screengrab wins,
as it already does for the product card.

- **`lib/catalog/kartik.ts`** — 540 Zenifit tees on **their own PRNG streams**,
  in three verticals (Men's Casual T-Shirts, Women's T-Shirts, Boy's Casual
  T-Shirts). Not part of the 1,070; nothing in A–D can see it. That separation is
  the point — products in the main sequence would move every documented count. A
  test asserts 1,070 / Girls 108 / Men 584 and no Zenifit in the main catalog.
  **No Girl's T-Shirts, deliberately**: it leaves exactly one women's vertical,
  which is what lets a Gender cut settle a PV and unlock Size.
- **`JourneyProductCard`** — a **second card design, this route only**. Orange
  `#fb9805` cashback ribbon, outlined offer pills, `VIEW DETAILS` blue on
  `#f5f8ff`, no `Best Seller`. A–D keep theirs, being signed off. The cost is two
  card designs in one prototype; watch it. It led on the blue `VIEW DETAILS`,
  which A–D then took on 2026-08-20 — so that is no longer a difference.
- **`PlpScreen` took props, not a copy** — `card`, `appBar`, `aboveList`,
  `belowList`, `listClassName`. There is still one PLP screen.
- **The storefront runs `variant="top-chips"`** (2026-08-20, was `bottom-bar`).
  This is the screen that settled the question for the whole prototype: the live
  app puts the basket bar at the foot of a listing, `SHOW_CART_BAR` only hides
  ours, and two bars cannot share that edge. Flipping `SHOW_CART_BAR` back to
  `true` now costs nothing, the bottom being free.
- **`SHOW_CART_BAR = false`** in `StorefrontChrome.tsx` hides the basket bar on
  both journey screens. Kept whole rather than deleted: nothing fills a basket
  here, so it could only print the screengrab's fixed ₹717.
- The **seller header scrolls away** with the listing (it renders *inside* the
  scroller); the app bar and chip strip stay fixed.
- **`Order Again` and `Top Brands` are built** (2026-08-20), so the home screen is
  now the screengrab end to end. Both are **inert** — the products are Magic Fit's
  and match nothing in either catalog — and both are `overflow-x-hidden`, like the
  banner above them: each shows the sliver of a further card the screengrab shows,
  and a peek you can scroll to and find blank reads as a bug. The page below the
  blue is **`#f7f7f7`**, not white. Every box is measured off the screengrab at 3×
  and checked by re-measuring our own render: 148×155 product cards at a 15px
  inset, 156×159 brand tiles at 11px, both rails on the same 168px pitch. **Only
  Magic Fit's tile could be cropped** — the floating mic sits over the right
  quarter of Rangmayee's, taking the last letter of the wordmark with it, so that
  one gets the `#d9d9d9` placeholder this repo already uses for brand art it
  doesn't have. Two departures from the screengrab, both deliberate: `Margin` is
  set in `muted` where the app's own grey measures `#a1a1a1` (2.2:1), and the
  card title ellipsises on the word where Android breaks mid-word.

**Quirks reproduced rather than tidied**, per instruction: the seller name
appears three ways across two screens (`Kartik exporters` / `KARTIK EXPORTERS` /
`Kartik Exporters`); `Set of:  1` is title case and double-spaced here where the
listing card says `SET of:`; titles set `Half Sleeves` on kids' and `Half
sleeves` on adults', the adult line alone carrying its fit — a rule inferred from
**one sample each**; kids' garments read `Unisex`; `MRP/PC` is blue on the detail
screen and grey on the card; Share is absent from the storefront bar and present
on the detail bar; the search placeholder reads `"Vanadana Sarees"`.

Dropping Share is also what makes the title fit — `KARTIK EXPORTERS` truncated to
`KARTIK EXPOR…` at 20px with it in place.

**Not built, on purpose:** a second gallery image (only front renders exist) and
a working basket. Men's cards still show a button-up — no men's tee render exists
in any screengrab, the same ask already open against the main catalog.

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
| `674:4904` | Chip detail — the product-vertical chip, unselected and selected |
| `688:1687` | `SortbyIcon` — the five Sort sheet glyphs, drawn as one set |

**Designs are 360px wide.** Never stretch a Figma dimension to fit — `DeviceFrame` renders edge-to-edge below 480px and drops the untouched 360×800 app into a phone mockup above it.

**Fonts are mixed, and that's intentional:** Roboto for everything, **Inter** for button labels (`Clear Filters`, `Show N results`). Rowdies went with the GOLD branding on 2026-08-19 — it only ever set that wordmark.

Tokens live in `app/globals.css` under `@theme`, named after their Figma variables (`--color-primary` = `primary/default` `#004FFA`, etc.). The design occasionally uses `#014FFA` for active states — that's a slip; use the `#004FFA` token.

All icons/images are exact Figma exports in `public/figma/`. **Never redraw an asset.** Monochrome icons that need to change colour use `components/ui/MaskIcon.tsx` (CSS mask over a background colour) — an `<img>` can't be tinted.

`design/` holds reference PNG exports of the frames and is **gitignored** — unreleased design work, served by nothing. It may be absent in a fresh clone; pull from Figma rather than depending on it. `public/figma/` and `public/categories/` are the opposite: tracked on purpose, because the app serves them and a Git-triggered build would otherwise ship with no images.

## Architecture

No backend. Deterministic seeded catalog + pure filter engine, all client-side.

- `lib/filters/engine.ts` — `applyFilters` (OR within a facet, AND across facets) and `facetOptionsWithCounts`.
- `lib/filters/activeVariant.ts` — which pack a card is talking about. Sizes live on the pack, so a size filter both matches products *and* moves which of their two-to-four packs is being shown and priced. Kept apart from both the engine and the registry because both need it and neither owns it; it also holds `sizeOptionId`, the one place a pack's `"3XL"` becomes an option id.
- `lib/filters/facets.ts` — facet registry. Each facet declares `valuesOf(product, sizes?) → string[]`, so tile grids, checkbox lists, range buckets and multi-valued delivery windows all use one code path. Adding a facet is one array entry. `FACETS` is every facet the engine knows; `getRail(category)` is what the Filters screen shows and `getRailFacetIds(category)` is the set anything touching the draft must filter through. Neither takes a variant — the rails are identical since 2026-08-19 — but both take the **category selection**, because the rail grows a vertical-specific block once exactly one vertical is settled. `PlpVariant` still lives here rather than in the component; it now decides only where Sort and Filters sit.
- `lib/filters/panelFit.ts` — whether a Filters panel's options run past the fold, and so whether it gets a search field. Pure arithmetic over option counts, deliberately **not** a DOM measurement: the server can't measure, so a measured rule would render no field on the server and add one after hydration. Constants are the rendered sizes (690px panel, 52px row, 96px tile row, three across); a test pins the thresholds they produce — 14 rows, 22 tiles — so changing a height in the markup without changing it here fails loudly.
- `lib/filters/contextChips.ts` — which chips the strip below the GOLD bar carries, given the current selections. Pure and shared by both variants.
- `lib/catalog/seed.ts` — 1,070 products from a fixed-seed PRNG. Determinism is load-bearing: counts must not shift between reloads, between server and client, **or between one JS engine and another** — see *The seed must not depend on the engine*.
- `lib/filters/urlState.ts` — state mirrored to the query string via `history.pushState`; local state stays the source of truth so filtering is instant.

### The seed must not depend on the engine

Added 2026-08-20, after this failed in production for real.

`buildVariants` picked its set sizes with `[...SET_SIZES].sort(() => rand() - 0.5)`.
A comparator that returns a coin flip is **not a consistent ordering function**,
so V8 is free to walk the array however it likes — which means it chooses both
the order that comes out *and* **how many `rand()` calls get consumed** (measured
here: 6, 7 or 8). That draw sits on the **main** stream inside the per-product
loop, so a different count re-rolls every product after it.

Vercel builds on **Node 24**; development runs **Node 26**. Same seed, different
answer — Node 24 shuffled to `2,6,12,10,4`, Node 26 to `6,12,2,4,10`. So the
deployed catalog was never the catalog the tests and docs described:

| | dev (Node 26) | production (Node 24) |
|---|---|---|
| Vertical routes | 55 | 56 |
| `Men` | 575 | 590 |
| Category counts | — | five of seven different |

`Girls 97` and the 1,070 total matched by luck; `Men 575` did not. Every test
passed, on the machine that wrote them.

It is now **Fisher–Yates, exactly `SET_SIZES.length - 1` draws**, whatever the
values and whatever the engine. The catalog re-rolled once as the price of that
and every documented count was re-measured; the suite runs green under Node 24
and Node 26 alike. `lib/catalog/seed.test.ts` pins the draw count per call
(`1 + 4 + 3 × packs`) so a comparator cannot come back unnoticed.

**The rule this leaves:** a shuffle here takes a draw count fixed by the array's
length, never by a comparator's answers. `Array.prototype.sort` with a random
comparator is banned outright, and any new draw still needs its own stream.

### The one rule that matters

`facetOptionsWithCounts` counts a facet's options against **every other facet's selections, never its own**. Counting a facet against itself would zero out every unselected option the moment you ticked one. This is what makes ticking one seller still show live counts for the others, while picking Girls correctly erases Men's Formal Shirts from Category. It's covered by tests — don't "simplify" it.

Options that fall to zero are hidden; anything currently selected stays visible even at zero, so a selection can never become impossible to undo.

### Catalog shape is deliberate

**The seven categories name their audience** — Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts (merchandising list, 2026-08-12). So category → gender is **1:1**, not many-to-many: `CATEGORIES[].gender` is a single value and the seed reads it rather than drawing one.

That keeps pruning demonstrable and sharpens it — Girls leaves **one** tile of seven (108 results), Men leaves three (584). Gender remains its own facet because each variant reaches it differently, but it is now derivable from category. Don't flatten the weights into a uniform distribution, and don't reintroduce a `genders[]` array.

Two knock-on rules, both easy to undo by accident:

- `plural` is the **gender-free** noun used in product titles, so a card reads "… Casual T-Shirts for Boys" and not "… Boy's Casual T-Shirts for Boys". A test asserts no possessive ever reaches a title.
- `priceFloor`/`priceCeil` are **per category** — kids' below adults', formal above casual. Men's Formal Shirts runs to ₹1,150 specifically to keep the top Price Range bucket (`₹900 & above`, 36 products) populated; an option that can never appear is worse than no option.

Brands are category-restricted too. Kids' lines carry the fewest, which is what makes Boy's Casual T-Shirts collapse the Brands grid to two tiles.

**Sizes are drawn as a run per product, not per pack.** A garment comes in S–XL and is sold in different quantity splits of that run; it does not draw a fresh size for every carton. This is what makes Size worth filtering on — measured against the old flat table, 2–4 packs unioned into near-total coverage, putting L in 96% of the catalog and M in 93%, so ticking either pruned about 4% and the control was dead. Runs put L at 44% and M at 38%, and the thirteen options span 1.6% (`12-13Y`, 17 products) to 44%.

Kids' lines are sized by **age band** (`2-3Y` … `12-13Y`), adults' by letter (`XS` … `3XL`) — category-restricted exactly the way brands and price bands are, and one more thing the 1:1 category→gender mapping buys: pick Girls and every letter size leaves the Size panel, pick Men and every age band does.

Sizes and the vertical-specific attributes each draw from **their own PRNG stream** (`sizeRand`, `attrRand`). Extra draws on the main stream would have shifted every draw after them, re-rolling the whole catalog and invalidating every count documented here; the per-pack size split reuses the slot the old breakup `pick` occupied. Both additions were verified to move nothing. **Any new per-product property needs its own stream for the same reason.** The counts they were checked against were re-based on 2026-08-20 when the set-size shuffle was fixed and the catalog re-rolled once — see *The seed must not depend on the engine*; the current figures are Girls 108, Men 584, `₹900 & above` 36.

## Decisions already made — do not re-litigate

| Area | Decision |
|---|---|
| Default sort | **Popularity**, and omitted from the URL (bare URL = Popularity) |
| Sort options | Popularity · Recently Added · Price/pc low→high · **Price/pc high→low** · Highest Margin. High→low added 2026-08-19 in all four variants — one `SORT_OPTIONS` entry, one `sortProducts` case, since every variant reads the same list. Both price sorts read the pack the card prints, not pack #1. **Arrow direction is the magnitude, not the list**: up for low→high, since the prices ascend as you read down — Figma names the up-arrow glyph `low to high`, so the frame agrees. Swap the two paths if it should describe list order instead |
| Sort sheet glyphs | All five come from Figma **`688:1687`** (`SortbyIcon`), exported to `public/figma/icons/sort-*.svg` (2026-08-19). They are **drawn as a set at one weight**, so the sheet takes the whole set and borrows nothing: `recent` used to stand in `tag.svg` — the Sort sheet's own *Recently Added* glyph doing double duty — and `popularity` used to take `trend-up.svg`, a heavier cut of the same trending arrow that the PLP owns. The pair of supplied price PNGs in `public/sort/` are superseded and that folder is gone. `sort-percent.svg` currently matches the library's `percent.svg` byte for byte and is **still its own file**: the set is the unit that gets reweighted, so a redraw has to land in one place rather than depend on a coincidence between two glyphs with different owners. They run through `MaskIcon`, which reads only the alpha channel, so a black glyph still tints to primary on the active row. `sort-new.svg` is the one assembled by hand — its Figma frame is a vector plus a live text layer, so it has no single vector-layer export; the frame export carries the exact paths for both, including the outlined `NEW`, and only the section background behind it was dropped. Its badge is a two-contour ring, so the counter stays transparent and the wordmark reads through the mask |
| Sort sheet | Tap applies **and closes** — no Apply button in the design |
| Bottom bar | **Sort and Filters only** (2026-08-19). The frame's first slot was Gender, then briefly Category; Category now lives in the Filters rail like every other facet. A facet behind both a bar slot and a chip kept raising questions the bar was the wrong place to answer — whether to hide the slot once a vertical was picked, which control owned the count, what Clear Filters was allowed to touch. One control, one owner |
| Category | An ordinary rail facet, **first**, in both variants. It spent 2026-08-13 to 08-19 as a multi-select bottom-bar sheet in A; that sheet and its `Clear all` / `Show N results` footer are deleted, following the `GenderSheet` precedent — when a bar slot goes, the sheet it opened goes with it. Multi-select survives, because the rail's `TileGrid` was always multi-select |
| Gender | An ordinary **multi-select** rail facet, second in both A and B, and **only while no single vertical is settled** (2026-08-19). It's a faster cut than ticking three category tiles, and dropping it outright would leave `?gender=` links with no UI — but the moment one vertical is picked it becomes a dead control, category → gender being 1:1, so it could then only offer the one value every product in scope already has. That is the same argument C and D already made by dropping it; it now applies wherever the vertical is settled, not just where the page settles it. Exclusivity was always a property of the control, never the facet, which is why there is no `single` flag in the registry |
| ~~Category sheet icon~~ | Moot since 2026-08-19. `tag.svg` was standing in for a Category glyph in the bottom bar; there is no bottom-bar Category slot any more, so nothing needs the icon and the open request for a designed one is withdrawn |
| Active row (Sort) | Three things together: label bold, label primary, **icon tints to primary** |
| Tile selected state | Primary ring + 50% primary veil over the photo + white check + bold primary label |
| Top chip strip | Carries the **contextual chips** in both variants (defined 2026-08-13, previously reserved and empty). In **B** they follow the Sort and Filter chips, after the divider `644:4011` already draws as their boundary, sharing one horizontally-scrolling row. In **A** they are the whole strip, which collapses entirely when there are no chips rather than leaving an empty white band |
| Contextual chips | The strip answers whichever question is still open. **Not inside a single product vertical** — none picked or several — it offers the verticals. **Inside exactly one** the picked vertical *stays*, leading the strip, followed by Price then Seller Offer, Cashback and Free Delivery. Logic is in `lib/filters/contextChips.ts`, kept pure and apart from the markup because the selection rule is the interesting part; `ContextChip` is a union carrying its `kind`, since the three render very differently |
| Vertical chip | **Figma `674:4904`** — pull it, don't infer it from the M3 spec. Unselected: white, **0.5px** `#4d4d4d` border, label Roboto Medium at `black/90` and 74% opacity, the same treatment `TopChipBar`'s chips use. Selected: no border, filled, label in primary, plus the exported `close_small` glyph. **Selected keeps its label** and adds the ✕ beside it |
| Chip thumbnail | **Square-cropped and full-bleed** (2026-08-14), against the frame, which draws a circular 26.727 × 27.796 avatar inside a 6px inset. It fills the chip's whole height and sits flush to the leading edge; `overflow-hidden` on the chip clips its corners. The chip's height *is* the image size, which is what forced the scale-up below |
| Strip scale | **44px, every chip, both variants** (2026-08-14) — up from the frames' 32, so the thumbnail is large enough to identify a garment; it also puts these on the 44px touch floor. `CHIP_H` in `ContextChips.tsx` is the one number, and `TopChipBar` **imports** it rather than repeating it, because two heights in one scrolling row is the thing that looks broken. **The label box tracks the label's type size**, because it has to stay wide enough that the longest vertical name breaks to two lines rather than clamping: the frame's 68px at 11px became 76px at 12px and is **82px at 13px** (2026-08-20). `Men's Casual T-Shirts` is the name that decides it |
| Chip blues are slips | The frame exports the fill as `rgba(21,95,255,0.2)` and the label and glyph as `#0a57ff`. Both are the usual off-token slip: that fill over white is exactly `primary/subtle` (#CCDCFE), and `#0a57ff` is `primary` (#004FFA). Use the tokens. `close-small.svg` ships with `#0A57FF` baked in, so it renders through `MaskIcon` rather than an `<img>` |
| Price chip | One chip opening a **bottom sheet** over the bands, not a chip per band. It was an anchored dropdown until **2026-08-20**, when it moved onto the `Sheet` shell Sort already uses, on request — one way of opening things in the strip rather than two. **No glyph column**, unlike Sort: these are checkboxes and the box is the row's leading element, which is also why the rows are the Filters screen's own `OptionRow` — Price Range is a rail facet whose panel is a list of exactly these, and the same control in two places shouldn't be drawn twice. Counts come with them. Multi-select, each tap applying live, and it **stays open** where Sort commits and closes, Sort holding a single value; dismissal is the scrim, the ✕ or Escape, all three the shell's. The closed chip carries the state — the band's own name for one, `Price (n)` beyond that. What went with the dropdown: rendering at the screen root to escape the strip's `overflow-x-auto`, the `left`/`top` measured against the frame, the clamp keeping a right-scrolled chip's menu on screen, `MENU_WIDTH`, and `PlpScreen`'s `rootRef` |
| Seller Offer | Means *any offer at all*, and is its own facet (`hasOffer`), not a fifth option inside `offers`. Inside it, OR-within-a-facet would make Seller Offer **widen** a Cashback selection; as a separate facet they AND. It is listed in the Offers rail entry alongside `offers` — a chip-only facet would survive Clear Filters and go uncounted, with no control left to undo it once the strip changes |
| Chip icons | Supplied PNGs in a **26px `object-contain` box**, leading the chip with a **4px** gap. A box rather than a fixed height, because the three are different aspects: sizing by height left the square one 20px on its longest edge while the two landscape ones reached 26, and the longest edge is what the eye compares — half M3's 8dp, which read loose against an icon wider than the checkmark and carrying its own padding; the checkmark keeps 8px (2026-08-19). **Material 3: the checkmark replaces it when selected** rather than joining it, so the chip has one leading element in either state and the label never shifts; the 8px inset now applies whenever anything leads. They live in `public/offers/`, not `public/figma/` — the latter is Figma exports only and a folder shouldn't imply an origin the file doesn't have. All three offer chips carry art, and so does Price. The offer chips lose theirs when selected, the checkmark taking its place per M3; **Price keeps its icon in both states**, having no checkmark to make room for — its state is the fill and the label. `ChipIcon` is the one place the box is declared. The map in `ContextChips.tsx` is keyed by **facet and option**, not option alone, because Seller Offer's option id is the bare `any` — a one-word id another facet could plausibly acquire later. `cashback.png` (48×37) and `seller-offer.png` (48×48) have almost no headroom above the 20px they render at and **want vectors**; `free-delivery.png` at 416×312 has room to spare |
| Chips that filter nothing | The three offer chips use `discriminatingOptions`: shown only when some but **not all** products in scope carry the offer. An offer everything already has is a dead control. Deliberately **not** applied to price bands or verticals — a narrow catalog where one band holds everything would otherwise be left with an empty menu, and zero-count options already drop out |
| Chip design | **Material 3** as instructed. Offer chips are filter chips: 8dp corner, 1dp outline unselected, filled with a leading checkmark when selected, 16dp label padding dropping to 8dp beside any leading element, Medium — at **15px**, one departure from M3's 14sp, per *Type scale*. All three now carry a leading icon too — see *Chip icons*. Height departs from M3's 32dp — see *Strip scale*. Vertical chips are input chips (see above). Palette is this app's (`primary/subtle`, `primary/default`), not M3's. No counts on chip labels — they're in the Price menu, where there's room |
| One radius per row | **8px, everywhere in the top strip** (2026-08-14). The vertical chip's own 4px (Figma `674:4904`) and `TopChipBar`'s rounded-100 pills (Figma `644:4011`) both gave way to it, because all three chip kinds share one scrolling row in B and three radii a gap apart read as a mistake rather than a distinction. This settles the mismatch that was left open for the designer. Each is one value to reverse |
| The ✕ green | `#2e9e42`, chosen rather than measured: the reference was a screenshot, not a Figma node. Darker than the app's `#39B54A` deliberately, so the white glyph clears 3:1 against it — `#39B54A` would land near 2.7:1 and join the contrast problems already logged |
| Applied state cue | Carried by whichever control owns the filter. One value → a **dot** (Sort). Many → a **count** (Filters). Since 2026-08-19 the Filters count is simply every selected option, category included: nothing else carries a badge, so nothing is double-reported and the old exclusion is gone |
| Clear Filters scope | Clears only facets in `getRailFacetIds()`, which is now every facet in both variants — category included. The exception that spared category in A went with the bottom-bar slot: it existed because wiping a filter from a screen that never showed it is a silent surprise, and the screen shows it now. The rule stays expressed as a filter over the rail rather than a blanket reset, so it still holds if the rails ever diverge again |
| Sheet motion | Asymmetric: enter 260ms `cubic-bezier(.05,.7,.1,1)` (decelerate), exit 200ms `cubic-bezier(.3,0,.8,.15)` (accelerate); scrim 200/160ms. `Sheet` owns dismissal — `onClose` fires on `animationend`, and rows and footers get the animated close via a render prop. `prefers-reduced-motion` collapses all four to 1ms |
| Sort sheet | No footer, commits on tap, because it holds one value. It is the only bottom sheet left — the Category sheet, which had the `Clear all` / `Show N results` footer because it held many, went with A's bar slot on 2026-08-19 |
| Discarded drafts | The **Filters screen** (✕) is now the only draft surface, and fires a **`Selection discarded`** toast when dismissed mid-edit. It fires **only when something would actually be lost**: untouched, or edited back to where it started, stays silent, and so does applying. The check is `sameSelections`, which treats an absent key and an empty array alike and ignores option order. The string stays a named constant so a second draft surface can't word the same event differently |
| Where the discard check hangs | The Filters screen has no `Sheet`: its ✕ and its `Show N results` are separate handlers, so only the ✕ checks and no `applied` ref is needed. It compares against a **frozen snapshot** of what the screen opened with — comparing against the live `selections` prop fails, because applying updates it while the component is still mounted |
| Toast | Not in the designs — `components/ui/Toast.tsx`, a dark pill near the bottom. Its lifetime *is* its CSS animation (`.animate-toast`, 2600ms: rise, hold, fade) and `animationend` unmounts it, so the duration lives in one place rather than in keyframes plus a `setTimeout` free to drift. Under `prefers-reduced-motion` it swaps to a fade-only keyframe **at the same duration** — collapsing to 1ms like the sheets do would make it unreadable. The wrapper centres and the pill animates, because a keyframe `transform` would otherwise wipe out a centring `-translate-x-1/2`. `clearsBottomBar` sets the offset: 72px in A to clear the bar, 24px in B, which has none. Keyed by an incrementing id in `PlpScreen` so firing twice replays the animation |
| Size | Lives on the **pack**, not the product, so a product matches when *any* of its packs carries a selected size. That is plain OR-within-a-facet with no engine exception, which is why Size costs one array entry like everything else. Ticking M **and** L therefore *widens* — 605 products, the union of 404 and 468 — rather than narrowing to packs carrying both. Settled 2026-08-18; the ALL-within-one-pack reading was put up and rejected |
| The active pack | Under a size filter the card opens on the **leftmost pack carrying a selected size**. Pills run in ascending set size, so that is the smallest pack a retailer can buy their size in — the low-commitment default. Price and margin read **that same pack** for sort and for the Price Range and Margin facets, not pack #1: ranking on a pack the card doesn't print left `Price/pc low → high` showing 63 visibly-descending prices at `size=M,L`. MOQ is a product field and doesn't move. Lives in `activeVariant.ts` |
| `valuesOf` sees one selection | `valuesOf(product, sizes?)` — the Size selection is the **only** selection any facet may see, and only Price and Margin use it. Passing the one selection that can move a value, rather than the whole set, keeps that dependency visible instead of letting any facet quietly depend on any other. **Size is counted by applying each option, not by tallying it** — every other facet can be tallied in one pass, because one facet's value doesn't depend on another's selections, and Size is the one that breaks that. Tallying it with Size skipped counted products that fall out the moment the pack moves, so the panel could offer an option labelled `(1)` and hand back an empty page (measured 2026-08-19: pack #1 at ₹610 sat inside the price band, the pack carrying the size was ₹575 and outside it). Thirteen options, one filter pass each, a couple of milliseconds. **Each option is applied on its own** — `{...selections, size: [option]}`, replacing the current Size selection rather than joining it. It briefly counted `selected ∪ option` instead, on the reasoning that this is what a tap delivers; because Size is OR-within-a-facet a union can only widen, so once any size was ticked every option inherited that selection's count, nothing could reach zero, and hide-at-zero stopped firing — Women's T-Shirts with S ticked offered `2-3Y` (fixed 2026-08-20). The count now means what it does everywhere else: how many products carry this value, own facet excluded. The empty-page guarantee survives it, since a union can only return more than the option alone. Three tests hold it: the count equals the option applied alone, no vertical shows the other's size vocabulary once one is ticked, and a random walk asserting a visible option can never lead to zero results |
| Size | **Vertical-only** (2026-08-19) — shown just like Fit and Neck Type, and cleared with them when the vertical goes. A size means nothing across verticals: M in menswear is not M in womenswear, so one M row spanning both would merge two garments' measurements behind a single checkbox. It is the same argument the catalog already makes by splitting kids' age bands from adult letters, carried the rest of the way. It keeps its slot beside Brands and Colour rather than joining the block, reading as a garment basic. A bare `?size=` with no vertical is ignored. Figma's rail predates the facet, and the whole rail is now ordered after a reference apparel PLP rather than the frame — see *Rail order* |
| Solid Size Pack | Now genuinely one size for the whole carton, which that pack type always claimed on the card and the old flat table never honoured. Every other type spreads across a window of the run, middle sizes taking the remainder as a real size curve does — capped at **four sizes**, because a seven-size `whitespace-nowrap` breakup runs past the 360px frame and can then only ever show one end of itself |
| Pack pill scroll | The pill row scrolls itself to the selected pack by setting `scrollLeft` — deliberately **not** `scrollIntoView`, which walks up and scrolls every ancestor container, so twenty mounting cards would each yank the PLP. Instant rather than smooth for the same reason. A pill wider than the row aligns to its **left** edge, since the breakup reads left to right |
| Manual pack pick | Outranks the size filter, but only until the filter moves the answer — at that point the card is pricing a pack the retailer no longer asked for, and holding it would contradict the list it sits in |
| Pack Type | **Removed as a filter** (2026-08-19) — a departure from Figma's rail, which carries it. The `packType` **field stays**: its draw sits mid-sequence, so deleting it re-rolls the catalog and moves every documented count, and it still decides pack composition — a *Solid Size Pack* carries one size for the whole carton where the others spread across the product's size run. Removed from `FACETS` as well as the rail, not just the rail: a facet with no control left would survive Clear Filters and go uncounted, the same trap the `hasOffer` rail entry exists to avoid. `?packType=` is now ignored |
| Vertical-specific attributes | **Fit · Neck Type · Sleeve Type · Pattern · Closure Type** (2026-08-19). They join the rail **only inside exactly one product vertical** — across verticals a Neck Type list offers *Spread Collar* beside *Round Neck*, which answers no question anyone is asking while still choosing between shirts and tees. They sit **after Seller City**, trailing the commercial rows — the rail goes 13 rows → 18. `PRODUCT_COLOR` and `AVAILABLE_SIZES` from the same request were already the `colour` and `size` rail facets and were left where they are, since both are useful across verticals |
| Fabric | An ordinary rail row beside Colour, and **out of *More Filters*** (2026-08-19) — it was briefly in both, which is one facet behind two controls. Asked for alongside the vertical-specific attributes but deliberately not one of them: its values don't vary by vertical, since Cotton and Denim mean the same on a shirt as on a tee, where a collar has no tee equivalent at all. So it stays visible whether or not a vertical is settled, and doesn't get dropped by `dropOrphanedSelections`. *More Filters* now holds Product Tags alone |
| Two attribute vocabularies | Shirts draw collars and plackets, tees draw necklines and pullovers — `kind: "shirt" \| "tee"` on the category picks between them, exactly as gender picks the size vocabulary. The facet's options are the union of both and zero-count options drop out on their own, so picking a shirt clears the necklines and picking a tee clears the collars with no special case |
| Orphaned selections | **The guard runs both ways** (2026-08-19), because two sets trade places across the single-vertical line: leaving one drops its **attribute** selections, and entering one drops the **gender** selection. Either way the rows have left the rail, and a filter still narrowing the list with nothing to show or undo it is the trap the `hasOffer` rail entry exists to avoid — it would survive Clear Filters and go uncounted. Dropping Gender on the way in is free, category → gender being 1:1: the selection was implied by the vertical, so the result set doesn't move. The one case where it *does* move is a contradiction (`?category=girls-t-shirts&gender=men`), where it **resolves** an empty page rather than causing one. `dropOrphanedSelections` — renamed from `dropOrphanedAttributes`, which no longer described it — runs wherever selections change: `commit` in `PlpScreen` (a chip tap can cross the line), the Filters screen's `toggle`, and `parseSelections`, since a hand-written URL was never reachable by clicking. C and D's `?gender=` strip folded into it, replacing an ad-hoc `params.delete` in `PlpScreen`: one owner, and the rule was never specific to those pages |
| Rail order | Follows a **reference apparel PLP** (screengrabbed 2026-08-19), not the Figma frame, which sequenced these rows before most of them existed and has no opinion on the ten it never drew: Category · Gender · Brands · Size · Colour · Fabric · Price · Margin · MOQ · Delivery · Offers · Seller · Seller City · *[vertical block]* · More Filters. Departures, all where the reference has no equivalent — **Category and Gender lead**, ahead of Brands: the reference has no category filter at all, being already inside one (exactly C and D, where both rows go), and puts Gender fourth; together they settle who the garment is for, which comes before picking a label off it. **Neck Type and Closure Type** trail the three attributes the reference does carry; **Margin** sits with Price; **Seller/Seller City** land with the commercial filters; **More Filters** stays last. One ordered `RAIL_ORDER` array with `only`/`vertical`/`notVertical` flags, not a base plus insertions — slicing around a block was what would quietly misplace a row. Pinned by a test in full |
| The block trails the commercial rows | **A departure from the reference** (2026-08-19), which interleaves Fit, Pattern and Sleeve Type up beside Fabric. Interleaved, five rows arriving mid-rail pushed **Price Range from 6th to 12th** and below the fold, so picking a vertical handed back a rail the buyer hadn't learned — the complaint that prompted this. The block moved past Seller City instead, which holds every commercial row still. **Gender leaving and Size arriving then cancel exactly**, so Colour through Seller City sit at the *same index* in both states — ten rows that don't move, with Brands the only one that shifts, up one into Gender's slot. Size stayed put rather than joining the block: it reads as a garment basic beside Brands and Colour, and moving it would have re-broken the alignment it now provides. A test pins the held indices, not just the sequence |
| Vertical as scope, not filter | In C and D the vertical is **page scope**, exactly as the seller already was: `products` arrives pre-scoped and `category` is never a selection. That is what lets the Category row leave the rail without stranding a filter no control can undo. `VerticalMode` threads through `getRail`, `getRailFacetIds`, `dropOrphanedSelections`, `contextChips` and `parseSelections` — the last two matter most, since the strip must not offer a vertical it can't remove and a hand-edited `?category=` must not empty the page. |
| C/D app bar | **No home button, title at 18px.** The two travel together: dropping the button frees 36px, which the title needs because the frame's 20px was sized for a seller name — *Men's Casual T-Shirts* measures 191px against the 157px the full bar leaves, and 172px against the 193px it leaves without home. Measured, not guessed; all seven category labels fit. A and B are untouched at 20px with their home button |
| Gender in C and D | **Gone too** (2026-08-19). Category → gender is 1:1, so one vertical is one gender and the row could only offer the single value every product in scope already has — a dead control by the same test `discriminatingOptions` applies to the offer chips. `?gender=` is stripped on those pages for the same reason `?category=` is: no control to show or undo it, and the wrong audience would empty the page. C and D's rail is **17 rows** |
| Filters header icon | `filter_alt.svg` at **24px**, 8px before the heading (2026-08-19). 24 is the export's own size — it went in at 18 and read as an afterthought, and downscaling resampled a thin glyph for no reason — the same glyph the Filters control carries, so the screen reads as the one that button opened. Not in the frame, which has the heading alone. Black in the export, which is the heading's colour, so no `MaskIcon` tint. B and D's chip uses `funnel.svg` instead, an inconsistency the frames already had |
| GOLD removed | The membership strip and the `GOLD Target Scheme` tag both went on 2026-08-19, with `GoldStrip.tsx`, `GoldGlyph`, the three `gold-*.svg` exports, the `.gold-text` gradient, its seven tokens and the Rowdies font. **The offer is still drawn.** `OFFERS.filter` runs its predicate once per entry, so deleting the row would have taken a `rand()` out of the middle of the sequence and re-rolled the whole catalog; it carries `retired: true` instead, is discarded after the draw, and is filtered out of the facet's options so no permanently-empty row appears. Verified: every documented count unchanged, and no product carries a GOLD offer |
| Brands panel | Uses the **same tile grid as Category**, not a checkbox list |
| Tile grid | Figma frame `Category` (`638:3696`): 68×96 cells, 56px square at radius 9.333, 4px gaps, 14px left inset, three across. The label is a **fixed 36px two-line box** — reserved even for one-line labels, so tiles on a row bottom out level — and long labels clamp at two lines rather than truncating on one. Shared by Category and Brands in both variants; change it once. |
| Tile grid layouts | `TileGrid` takes `layout`. **`fixed`** (default) is the frame exactly, and is what the 240px filter panel uses — the only surface Figma draws, and since 2026-08-19 **the only caller**. **`fill`** divided a container's width instead (8px insets, 2px column gap, 64px floor, five across at 67.2px) and was built for the 360px Category sheet, where left-aligned 68px cells fit four and stranded an empty column; that sheet went with A's bar slot. `fill` is retained but unused — it is the answer for any wide undesigned tile surface. Delete it if none appears |
| Reserved height vs clamp | They must live on **different elements**. Put `h-[36px]` and `line-clamp-2` on the same span and the explicit height wins, so a three-line label is cropped mid-glyph at 36 of its 39px instead of ellipsised. Wrapper reserves, inner clamps |
| Panel search field | **Earned, not declared** (2026-08-20). The `searchable` flag is deleted; the field appears only when a panel's options overflow the 690px fold, and disappears again when pruning shortens them. All five facets that used to set the flag fit whole, so it was 56px spent searching a visible list. **Colour went 10 → 20 colours** to give the screen one panel that genuinely overflows — safe for the seed because `weightedPick` draws once however long the array is, so no other draw moved and every documented count holds. Thresholds are **14 checkbox rows / 22 tiles**, computed in `panelFit.ts` rather than measured, because SSR can't measure and the client adding a field post-hydration is a 56px shift on every panel open. The query is dropped with the field, so a hidden control can't go on filtering |
| Undesigned panels | Only **Category** and **Seller** are designed — twelve of the fourteen base rail entries aren't, nor any of the five vertical-specific ones. They reuse the designed checkbox row rather than introducing sliders or swatch grids. Colour adds a 16px dot; price/margin/MOQ use bucket rows |
| Seller PLP scope | Baheti Garments is a **storefront aggregating multiple sellers** (the app bar says Baheti while the Seller facet lists other companies). Other seller pages are scoped to their own stock |
| `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers** for the facet. Separately, `Seller Offer` is now a distinct catch-all facet — the two are not the same thing |
| Offer names | `Free Shipping` was renamed **`Free Delivery`** (2026-08-13) to match the chip vocabulary, which also changes its product-card tag. `Bulk Offer` and `GOLD Target Scheme` keep their names and stay out of the chip strip |
| Set pills | Selectable — picking a pack re-prices that card. Dots track scroll pages |
| Card format follows the live app | The product card's wording comes from a **screengrab of the shipping SOLV app** (2026-08-14), not from Figma, wherever the two disagree: `MRP/PC ₹299 \| SET of: 6` on one pipe-separated line, `PRICE/PC` in caps, and pills reading `SET OF 6` over `M/2, L/2, XL/2`. The old line, `MRP ₹390 Set Size 2pc`, never said the MRP was per piece although it always was, so it read as a pack price and made the margin look wrong. Mixed case in `MRP/PC` vs `SET of:` is the live app's own and is reproduced rather than tidied. The `+₹50 shipping fee` line under the price **went on 2026-08-20** — not a real charge, and its absence is one more thing the card now shares with the screengrab. `variant.shippingFee` is still drawn and simply unread: the `rand()` sits mid-sequence, so deleting it would re-roll the catalog |
| Price / margin block | Rebuilt from **pixel measurements** of the screengrab (2026-08-14), not eyeballed. Margin sits **10px after the price on the same baseline** (`items-baseline`), where it used to be a `flex-1` column pushing it ~40px right and bottom-aligning it to the since-removed shipping line. Title sets on a **16px** pitch, not the default 1.5/21px. The column carries **no `gap`** — its rows sit at different distances, so each has its own measured `mt-`. Verified by re-measuring our own render the same way: every gap lands within **0.3px** of the reference. Dropping the shipping line took the last `gap-[4px]` with it, that having existed only to separate the two; the 7px from `PRICE/PC` to the price and the 10px baseline gap are untouched. Re-measure rather than eyeball if you change any of it |
| Margin is blue | `--color-margin` points at **`primary`**, not the frame's `#39b54a` green. The live app renders margin in the same blue as a selected set pill. Measured `#0066ff` on an 85%-solid fill, but that screengrab's app bar is `#004ffa` exactly — our token — so `#0066ff` is a second blue a hair off brand, the same slip class as `#014ffa`, and indistinguishable at 14px. Contrast goes **2.66:1 → 6.0:1**, clearing AA. Likewise `--color-muted` is now the measured `#7f7f7f`, not `#999999`: **2.85:1 → 4.0:1**, still short of 4.5 at 12px, so it stays on the contrast list |
| `VIEW DETAILS` is blue | `primary`, not the frame's orange `#FF7711`, in **all four variants** since 2026-08-20 — the live app renders it blue and that was confirmed. **2.53:1 → 5.72:1** on the `#f8faf7` strip, clearing AA at 13px, and the last of the three inherited contrast failures to close bar the body grey. The exported chevron is *stroked* `#FF7711`, so it goes through **`MaskIcon`** rather than an `<img>` — a blue label beside an orange arrow is the failure mode, and `MaskIcon` reads only the alpha channel so the export is untouched. `--color-orange-500` **stays**: the home badge, the cart counter and the detail screen's stepper still use it, all white-on-orange or as a border |
| Type scale | **The small end was raised, not the whole scale** (2026-08-20). The type read small for 360px, and the tier that was actually failing was 9–12px — text carrying information a kirana retailer reads in poor light, which is the audience already logged against the contrast backlog. So the floor moved and the top did not: `PRICE/PC` 9 → 11, the offer tags 10 → 12 (pill 16 → 18), `SET OF n` 10 → 11, both badge counters 9/10 → 11 (box → 17), the muted `MRP/PC` line 12 → 13, every 14px control label — checkbox rows, rail rows, chips, buttons, `Show N results` — to 15, and the home activate-account card off its fractional 12.407/10.634 to 13/12. **Three things were deliberately held:** the 26px price and the title's measured 16px pitch, both pixel-measured off the live-app screengrab and already at or above it; and the app bar titles at 20/18px, which are width-capped by the longest category label (see *C/D app bar*). Scaling everything by a multiplier would have moved all three and re-opened measurements that were taken rather than chosen. **Two sites refused the raise and are commented in place** — the tile-grid label and the home seller card's stat line, both boxed by a Figma dimension rather than by the type: at 12px `Men's Formal` stops fitting the 68px cell and clamps to `Men's Formal…`, and `1,070 products \| 9k+ orders` stops fitting the 152px card and truncates. Raising either needs a wider cell or card, which is a change to the frame. Verified by a DOM audit over all four variants and every rail row, diffed against the baseline: no new clipping, clamping or 360px overflow anywhere. The one line it does leave is a long seller name in the 240px panel, which already truncated at 14px |
| Pack breakups | Written `size/qty`, comma-joined, and the **quantities sum to the set size** — two tests enforce both. Earlier shapes used three notations at once (`S,S`, `M×2,L×2`, and a bare `2XL` standing for ten pieces), the last of which gave a wrong answer to the only question the line exists to answer. Re-shaping the table is safe for the seed because `pick` draws **once whatever the array length**, so the rand sequence, and every documented facet count, is untouched |

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
- Run `npx eslint .` from the repo root — the shell's working directory persists between commands and a stale `cd` produces confusing failures. `.claude/**` is in `globalIgnores` because Claude Code's worktrees there are full checkouts of this repo: without it the root command lints every worktree's copy plus its `node_modules` and reports ~24k findings from outside the working tree.
