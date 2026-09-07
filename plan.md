# SOLV — Filter & Sort Prototype

A runnable Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which don't exist in the product today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products and a working faceted-search engine behind the designed UI.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
```

Deploys to Vercel. The deployment is password-gated by `proxy.ts`, which fails closed — set `SITE_PASSWORD` **before** deploying, and pass `--scope bitihotra-karaks-projects`. See `progress_tracker.md`.

> **Four docs, one job each.** `CLAUDE.md` — the rules, and the only one loaded
> into every session, so keep it short. `plan.md` — the architecture.
> `docs/decisions.md` — the long-form record of every call and why.
> `progress_tracker.md` — the chronology, the backlog and the open questions.
> The deepest reasoning is in the code comments; a rule changed there must be
> changed in `CLAUDE.md` too.

---

## The four variants

Four variants over one catalog, crossing **control placement** against **starting scope**. A and B walk Home → **search `shirt`** → PLP → filter and sort; C and D drop straight inside a product vertical.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/results?q=shirt` | Filters · Sort in a floating pill above the foot (Figma `697:2658`) |
| **Variant B** | `/b` | `/b/results?q=shirt` | The same two as chips under the app bar (Figma `644:4011`), no pill |
| **Variant C** | — | `/c` | The pill, already inside one vertical |
| **Variant D** | — | `/d` | Top chips, already inside one vertical |

**A and B are reached by searching, not by a seller card** (2026-08-25): Home →
the search bar → type `shirt` → tap a suggestion. Tapping one storefront never
explained why the listing spans seven categories and eight sellers. The scope
did not move — `shirt` matches all 1,070 products, every category being a Shirt
or a T-Shirt — so every count, test and demo step below still holds.
`/seller/[sellerId]` still exists and still works; removing it is the next step.

**The rails are identical.** Category rejoined A's rail on 2026-08-19, so where Sort and Filters sit is the whole of the difference.

There is also **`/userjourney`** (2026-08-20), which is not part of the 2×2: a
single named flow through one storefront, built 1:1 from screengrabs of the live
app. See decision 28. Its controls have moved twice: onto the floating pill on
**2026-08-25** on UXR, and **back onto top chips on 2026-08-28** on the
stakeholder review, which returns the route to what its screengrabs show. A and
C keep the pill, so the A/B is still a comparison of placement alone.

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
| `638:3696` | Tile grid (frame renamed `Category`) — 68×96 cells, 56px tile, two-line label. **Superseded 2026-09-03**: Category and Brands are a column of rows |
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

**Twenty-three facets behind thirteen rail entries**, rising to eighteen inside a single product vertical — the attribute block joins and Gender leaves — the same in A, B, C and D, and seventeen in C and D, where Category goes too. `/userjourney` runs its own order and its own subset since 2026-08-28 (`JOURNEY_RAIL_ORDER`, **ten rows and sixteen** inside a vertical): Gender, Delivery Time, Offers, More Filters, Seller and Seller City dropped, and the three offer magnitudes added, which is why its rail is longer than A–D's is short. `getRail` takes a `RailPreset` name to choose between them. Each facet declares `valuesOf(product, sizes?) → string[]`, so range buckets, multi-valued delivery windows and plain checkboxes all flow through one code path. Adding a facet is one array entry. `sizes` is the current Size selection and the only selection any facet may see — Price and Margin need it because they read the pack the card is showing; every other facet ignores it.

`FACETS` is everything the engine knows about; `getRail()` is what the Filters screen displays. It takes no variant since 2026-08-19: Category left A's bottom bar and rejoined the rail, so both variants show the same thirteen rows, headed by Category then Gender — and the same eighteen inside one vertical, where Gender drops out and the attribute block joins at the end.

**Gender** stays despite every category naming its audience — it is a faster cut than ticking three tiles, and dropping it would leave `?gender=` links with no UI. But only *across* verticals: settle on one and it goes, category → gender being 1:1, so it could then only offer the single value everything in scope already has.

`getRailFacetIds()` is the set that anything mutating the draft (notably Clear Filters) must filter through, so a facet the screen doesn't show can never be cleared by it. It is kept as a filter rather than a blanket reset so it still holds if the rails ever diverge again — and since the set is read from the draft, it already excludes something in practice: a cross-vertical rail carries no Size row, and the vertical block only exists inside one. `clearSelections` in `engine.ts` is the one place the rule is written, shared by the Filters screen and its test.

Pack Type was removed as a filter on 2026-08-19 — a deliberate departure from Figma's rail. It left `FACETS` too, not just the rail, since a facet with no control would survive Clear Filters uncounted; the product field stays, because the seed draws it mid-sequence and it still decides whether a pack is one size or a spread.

Panels: Category and Brands are a **column of 60px rows** since 2026-09-03 — checkbox, 44px picture, then the name and its count wrapped to two lines (`ThumbRow`). They were the Figma tile grid until then, three across a 240px panel, which left the name ~72px and made *Men's Casual Shirts* and *Men's Casual T-Shirts* both truncate to `Men's Casu…`; `TileGrid` is retained with no caller; Colour is a checkbox row with a 16px colour dot; a rail row with anything applied carries **the number in an 18px blue circle** (since 2026-09-03 — it was a 6px dot, which said nothing about how many), which is what took the rail from the frame's 120px to 140; Price Range, Margin on MRP, MOQ and — on `/userjourney` since 2026-09-03 — the three offer magnitudes (Cashback ₹, Seller Offer %, SOLV Target Scheme ₹) are checkbox rows over preset buckets, and on `/userjourney` all six of them also carry a typed **min/max** above those bands — Price from 2026-08-28, the other five from 2026-09-03, built from one table and differing only in the number they compare and the unit beside the box (₹ leading, `%` and `pc` trailing). Per facet the two controls are mutually exclusive and each disables the other. No slider anywhere: it would add a control the design system doesn't have. Everything else is the designed checkbox row.

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

**They live in `docs/decisions.md`** — every call, why it was made, and what was
rejected, kept current.

A copy of that table used to sit here, and by 2026-08-28 roughly a dozen of its
rows were describing a prototype that no longer existed: the Price *dropdown*
that became a bottom sheet in August, the tile grid's superseded 68×96 cell, the
single 8px chip radius, "the strip below the GOLD bar" months after the GOLD bar
was deleted. None of it was wrong when written; it was a third copy of facts
that also live in the code comments and in `docs/decisions.md`, and a third copy
is the one nobody updates.

That is the same reason `CLAUDE.md` was cut down the same day. One fact, one
home — `CLAUDE.md` for the rules, this file for the architecture,
`docs/decisions.md` for the reasoning, `progress_tracker.md` for the
chronology.


## Verification

- `npm test` — 137 tests over the engine: OR-within/AND-across, own-facet-excluded counting, the Girls pruning case, selected-but-zero staying visible, sort ordering, URL round-trip, pack breakups summing to their set size, the size facet's match-and-active-pack rules, the rail order pinned in both states and for both presets, the panel-fit thresholds for the full-bleed panel and the sheet, the sheet's height against its rail, and the typed ranges' matching, counting and URL round-trip on all three range facets.
- `npm run dev`, then Chrome DevTools at exactly 360px, and compare each screen against its Figma frame.
- Widen past 480px to confirm the phone mockup appears and the app still renders at 360.

The **journey**'s own script diverged on 2026-08-28: its cut is now *Category → Women's T-Shirts* rather than *Gender → Women*, Gender having left that route's rail. Both settle the vertical identically, which is what puts Size on the rail.

**Demo script (Variant A):** Home → tap the search bar → type `shirt` → tap the first suggestion → `Show 1,070 results` → Filters → Category → tick *Men's Casual Shirts* + *Men's Casual T-Shirts* → the footer reads Show 416 results → *Show results*, and the Filters half of the pill carries a **2** on its funnel → Filters → Seller → tick Grasim + Gagan → counts shrink → *Show results*, the count reads 4 → Sort → *Highest Margin* → the order changes and a dot appears on Sort → Filters → **Clear Filters**, which applies and closes on the spot: the listing returns to 1,070, the URL goes bare, every badge clears and a toast says `All filters cleared`. The URL tracks every step and the back button unwinds it.

**Facet pruning (Variant B, where Category and Gender share a rail):** Filters → Gender → Girls → Category → six of the seven tiles are gone, only *Girl's T-Shirts* stands. In A the same cut is Filters → Gender → Girls, then Category from the bottom bar.

**Brand pruning (either variant):** Category → *Boy's Casual T-Shirts* → Filters → Brands → the grid drops from ten tiles to two (Killer, Monte Carlo), 107 results.
