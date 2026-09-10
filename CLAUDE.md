@AGENTS.md

# SOLV — Filter & Sort Prototype

A Next.js prototype of SOLV's B2B commerce app, built to demonstrate **filter
and sort**, which the real product lacks. Designs existed in Figma but weren't
clickable. This makes them work against a seeded catalog so stakeholders can try
real filter permutations.

## Where the words are

This file is loaded into every session, so it carries **rules and traps only**.
The reasoning behind them lives in two places, both read on demand:

- **The code comment beside the thing** — these files run 30–77% comment, and
  that copy is the one that cannot drift from what it describes. Read the file
  before reading either doc.
- **`docs/decisions.md`** — the long-form decision record: every call, why it
  was made, and what was rejected. Consult it before reversing anything here.

`plan.md` is the architecture narrative; `progress_tracker.md` is the
chronology, the UX backlog and the open questions for the designer.

**When you change a rule, change it in the code comment and here.** Every
contradiction this repo has grown came from updating one and not the other.

## Commands

```bash
npm run dev      # http://localhost:3000
npm test         # vitest — filter engine, seed, kartik catalog, panel fit
npm run build    # production build; also typechecks
npx eslint .     # lint — from the repo root, never a subdirectory
```

## Routes

Four variants over one catalog, crossing **control placement** against
**starting scope**. Identical card, catalog, engine, rail and sheets — *only the
controls differ*, which is the whole point of the A/B. Don't let them drift
apart in any other respect.

| | Home | PLP | Controls |
|---|---|---|---|
| **A** | `/` | `/results?q=shirt` | Filters · Sort in a floating pill (Figma `697:2658`) |
| **B** | `/b` | `/b/results?q=shirt` | The same two as chips under the app bar (`644:4011`) |
| **C** | — | `/c` | The pill, already inside one vertical |
| **D** | — | `/d` | Top chips, already inside one vertical |

**`Filter` leads and `Sort` follows** (2026-09-03), in the chip bar and in the
pill alike, where both frames draw the reverse. One order across the 2×2 on
purpose: these variants exist to compare *placement*, so a second difference
has no business in them.

A and B are reached by **searching**: Home → search bar → type `shirt` → tap a
suggestion. `shirt` matches all 1,070 products, so the scope is identical to the
`/seller/[sellerId]` route it replaced — every count and test still holds.
`/seller/[sellerId]` and `/c/seller/[s]/[cat]` still exist and still work.

**`/userjourney`** is outside the 2×2 — one buyer's named flow, built 1:1 from
screengrabs of the live app rather than from Figma. It **opens on the
storefront** (2026-09-09): `/userjourney` is a `redirect` to
`/userjourney/seller/kartik`, so the flow is listing → filter → detail. The home
beat is gone from the route but not from the tree — `JourneyHome` is still
there, with no caller, and putting it back is one `return` in
`app/userjourney/page.tsx`. Its catalog (`lib/catalog/kartik.ts`, 540 tees) is
separate from the 1,070 and invisible to A–D.

**`/pvfilters`** (2026-09-09) is a **clone of that listing on its own path**, so
product-vertical filtering can be worked on without touching a route
stakeholders have been handed. One route, no redirect — `/pvfilters` *is* the
listing, the way `/c` and `/d` are — plus its own
`/pvfilters/product/[productId]`.

**The two are deliberately separate, and must stay so.** They shared a
`KartikStorefront` component for an hour of 2026-09-09; it was reversed the same
day because `/userjourney` is about to have things *removed* from it, and a
shared config would have carried every deletion across. Each route spells out
its own props over `PlpScreen`, which is what `/` and `/b/results` already do —
**the thing that is never copied is `PlpScreen` itself**, not the prop block.
Don't re-share them, and don't "fix" the duplication. Today the two still render
byte-identical, which is a fact about this week and not a rule.

`ProductDetail` **is** still shared by both, plus B and D. Something the journey
needs *off* that screen is a prop with a default, the way `cartBadge` is — not a
fork.

Its listing departs from the documented control layout, via **one prop** —
`controls` on `PlpScreen` (`verticalChips`, `priceChip`, `sortInFilters`,
`rail`, `filterSheet`, `rangeInputs`), each field defaulting to the documented
behaviour so a route opts *out*, never in. Today that leaves the strip as
`Sort` and `Filter` plus the four offer chips; that rail in this route's own
order (`JOURNEY_RAIL_ORDER`), three rows dropped (Gender, Delivery Time, More
Filters), so its cut is **Category → Women's T-Shirts**, not Gender → Women;
Filters as a bottom sheet; and the three numeric range facets with a typed
min/max above their bands. A–D pass nothing, and neither does the journey for
`sortInFilters` — Sort went back to the strip on 2026-09-03 after six days
inside Filters. Put new per-route departures in that object rather than adding
a prop each; the reasoning is in `docs/decisions.md`.

**`/userjourney` shows no vertical block at all** (2026-09-09, on request —
*this is what we are launching now*). Its `controls.rail` is
**`"journey-flat"`**, which is `JOURNEY_RAIL_ORDER` with the five garment
attribute rows switched off in *every* state: settling a vertical no longer adds
rows, and the bottom sheet no longer grows with them. A flat **7 rows and 530**
on Kartik's scope whatever the buyer ticks. **`/pvfilters` keeps `"journey"`**
and still goes 7 → 12 and 530 → 640 — that route is where product-vertical
filtering carries on, and the split is why the two listings were un-shared.
`FLAT_RAILS` is the one switch, hung off the preset because `getRail` and
`dropOrphanedSelections` must agree about it and are reached by different
callers; a disagreement there is the orphan trap, which is why
`dropOrphanedSelections` stopped branching on `byCategory` the same day. On a
flat rail a hand-written `?fit=slim` is dropped in every state.

**`/pvfilters2`** (2026-09-09) is a clone of `/pvfilters`, made **independent
from the start** — a second cut at the PV filtering, tried beside the first
rather than on top of it. It **does not pass `guidedPv`** (dropped hours after
the clone, on request), so the two are the real comparison: both reveal the
garment attributes once a vertical settles, `/pvfilters` on the listing in *Find
It Fast* and `/pvfilters2` inside the Filters sheet.

**`/pvfilters2` reveals them through a placeholder rail row** — `rail:
"journey-gated"`, the same afternoon. A **Style Filters** row sits at the **foot
of the rail**, and its panel spends the locked state saying how many are behind
it and offering the three categories as `ThumbRow`s, so unlocking is a tap
*inside the panel* rather than an instruction to go elsewhere. A row that isn't
there teaches nobody, which is the whole argument.

Four rules on it, each a correction from an earlier render:

- **It is drawn like every other row.** It shipped dimmed and read as
  unavailable, which is the one thing it is not; it then spent a day tinted
  `primary-subtle` so it would stand out, and that was reversed too — the
  ticker is doing that work, and a second fill in a column of eight made the
  rail read as two lists.
- **Its label tickers while locked** — `Style Filters → Size → Fit → Neck Type →
  Sleeve Type → Pattern → Closure Type → `**`Enable Style Filters`** and round
  again, a word every 1.8s. **One list, name first**: it shipped alternating
  name-and-filter and that read as a stutter. The lap **ends on the ask**, in
  primary and pulsing — six nouns say what is in there and one line says what to
  do about it. One word at a time, each arriving and stopping; it **stops when
  the row is open**, and never starts under `prefers-reduced-motion` (checked in
  `TickerLabel`, not left to the CSS, which can only slow travel and not stop
  words changing).
- **It leaves when the real rows arrive.** `gated` is the mirror of `vertical:
  true` and is read off `showVertical`, so ticking a category swaps the
  placeholder for **Size · Fit · Neck Type · Sleeve Type · Pattern · Closure
  Type** — **immediately after Category** (2026-09-10), where
  `JOURNEY_RAIL_ORDER` already puts the block, so the unlocked rail is exactly
  `"journey"`'s. 8 rows to 13, sheet 590 → 640. The array is therefore the
  journey rail plus one appended row; both sat at the foot for a day, and
  Category is the better anchor because unlocking already lands the panel
  there.
- **Unlocking lands on Category**, not the first row — `FilterScreen`'s rail
  fallback, so the swap and the landing happen in one render. The rail lights
  `rail.id`, not `activeRail`, or nothing would be highlighted after the swap.

**Size has a row here and nowhere else on a Kartik rail** since 2026-09-08. The
array is *derived* from `JOURNEY_RAIL_ORDER`, so a row added there lands on
both.
**Three Kartik listings now spell out their own
props over the one `PlpScreen`, and that is deliberate**: sharing them behind a
component was tried and reversed the same morning, so don't "fix" the
duplication. What stays shared is `PlpScreen`, `ProductDetail` and
`FindItFast` — screens and surfaces, parameterised; something one route wants of
them that another doesn't is a prop with a default.

**`/pvfilters` puts that growth on the listing instead** — the **Find It Fast**
block (`controls.guidedPv`, 2026-09-09, from two screengrabs of a competitor's
search results, drawn in our tokens): *choose gender* as three pictures, and
picking one unfolds **shop by style** beneath it: a button per style filter —
Size · Fit · Neck Type · Sleeve Type · Pattern · Closure Type — each opening the
Filters sheet **on that row's own panel** (`initialRail` on `FilterScreen`).
The buttons come from `styleRows(preset)`, so they are the rail's own rows and
can never claim a panel that isn't there — which is why **Size got its row back
on `JOURNEY_RAIL_ORDER`** (2026-09-10) rather than the button being hard-coded.
They **wrap and are sized to their labels**, not a fixed grid: two columns gave
`Fit` the same width as `Closure Type` and cost three rows of white. The art is
in **`public/style/`** — supplied, not exported from Figma, which is why it is
not in `public/figma/` — and goes through `MaskIcon`, each file being one
`currentColor` path. `STYLE_FACET_ICONS` maps facet id → file; **a facet not in
it keeps the grey box**, which is Pattern today, so a new icon is one file and
one line.

The gender tiles select **`category`**, not `gender` — 1:1 in this catalog, and
Category is on the rail, so the badge, the panel and Clear Filters all reach it
for free. Two rules it must keep: each step is counted against the steps *above*
it and never below (Size zeroed the Boys tile outright, back when the second
step was sizes); and picking a different vertical **clears the size cut**, sizes
being vertical-specific. `guidedPv` is the **one opt-in** field on `controls` —
it adds a surface rather than switching one off — and it must never be set
beside `"journey-flat"`, which would draw a step nothing can unfold.

**Both rails come from `JOURNEY_RAIL_ORDER`, re-ordered 2026-09-07 on request**: Price
Range · Margin on MRP · MOQ · Category · Brands · Seller · Seller City, then the
five garment attributes, then **Cashback · Seller Offer · SOLV Target Scheme at
the foot**. Fabric has no row here, and neither do Size or Colour since
2026-09-08. Three of those rows carry
`hideIfSingle` — **Brands, Seller and Seller City hide when the page
scope holds one value of them**, which Kartik's does (one brand, one seller, one
city), so that array yields **7 rows outside a vertical and 12 inside one**. It
is measured off the page's products (`singleValuedFacets`), never off the
selections: a row that came and went as boxes were ticked is the churn the
2026-08-19 reorder exists to stop. **Colour is off this rail** (2026-09-08). **Size came back on 2026-09-10**,
`vertical: true` and leading the block, so `/pvfilters`' style buttons and
`/pvfilters2`'s *Style Filters* both have a Size panel to open — and both orphan
a Size cut when the vertical goes, as A–D do. **`/userjourney` is the exception
and stays one**: `"journey-flat"` shows no vertical row in any state, and its
vertical-only set drops Size **by hand** so `?size=m` keeps applying there, the
way `?fabric=cotton` does. That per-preset split is why `dropOrphanedSelections`
and `parseSelections` take the rail preset at all.

**The three offer magnitudes are a row each, last on the rail** — they spent a
few hours of 2026-09-07 merged behind one *All Offers* row (a rail row may carry
several facets, and the panel heads each with its facet label, which was that
request's own sketch) and the ask reversed the same day: three types of offer,
three rows, at the foot. Last in the array, so they are last in **both** states
— the five garment attributes are `vertical: true` and arrive above them.
**They carry the typed min/max again** — dropped that morning with the merge,
which had nowhere to put three pairs of boxes, and asked back hours after the
split: the same control Price, Margin and MOQ carry, from the same table, with
the same exclusivity and the same refusal toast.

**Only a panel that stacks several facets is headed** — today just A–D's Offers
row (`hasOffer` + `offers`). The heading is 15px bold on `heading` with a
hairline rule above each group but the first, raised on 2026-09-07 from 13px
bold `#767676`, which set two sizes *below* the rows it labelled;
**`FACET_HEADING_H` is 43, measured**. A **lone panel is never headed**,
including an offer's: the rail row already names it in primary two columns to
the left, so a heading repeats it. The three offer panels carried the offer's
name and its chip art for an hour that day, while all three were merged and a
heading was the only thing telling the groups apart. The art stays in
`lib/filters/offerIcons.ts` — the chip strip is its only caller again, and it is
where a panel that wants it back should take it from.

Its Filters screen is a **bottom sheet** rather than full-bleed, so the listing
stays visible behind it. **Its height follows the rail** (`sheetHeightPct`),
capped at 80% of the frame and floored at 440: seven rows gives 530, and the
five attribute rows grow it to the capped 640 — a fixed 80% left ~110px of white
under a short rail. **On `/userjourney` that growth is gone** since the rail went
flat, so its sheet is 530 in every state; `/pvfilters` still climbs. That
shortens the panel, so `needsSearch` takes a viewport argument, computed from
the height actually rendered (`sheetPanelViewport`) — 530 at the cap against
the full-bleed 690, giving 11 rows / 9 thumbnail rows / 13 tiles instead of
14 / 12 / 19, and less again in a shrunken sheet. **A panel of nothing but
bands never earns a field** however tall it runs: the field searches labels,
and the merged Offers panel's 720px of `₹200 – ₹400` is a vocabulary you read
rather than hunt through. A–D are untouched.

Its **typed ranges** are **all six band facets** — Price Range, Margin on MRP,
MOQ, Cashback, Seller Offer and SOLV Target Scheme (`?price=150-450`,
`?margin=60-`, `?moq=5-12`, `?cashback=100-200`, `?sellerOffer=10-`) — a min/max
above each one's bands.
Per facet the two controls are exclusive, and each disables the other: both are
values on one facet, where they would otherwise OR into a wider result. An
inverted range is refused rather than filtered, with a toast on blur naming
that facet. **The boxes commit on blur, never per keystroke** (2026-09-07) —
committing each digit applied `9-`, `90-`, `900-` and moved the count before the
second box was touched, which made the designed refusal state unreachable. Every band facet is built from **one table** (`RANGE_FACETS` in
`facets.ts`) differing only in the number it compares and, in the UI, the unit
beside the box — ₹ before the number, `%` and `pc` after. `typed: false` there
is a facet with bands and no boxes; **nothing sets it today**, and it is kept
because the three offer magnitudes flipped twice on 2026-09-07 — off with the
merge that gave them one shared panel, back on when the rows split again. The
boxes cost the facet
registry two optional hooks: **`matches`** overrides the default set-membership
test, and **`accepts`** widens `parseSelections`'s id validation. **A facet
that overrides `matches` needs `accepts` too** — without it the selection works
in-session and vanishes on reload, and a facet with **neither** must have no
control that can produce a range. `parseTypedRange` gates on the first
character before its regex, because `matches` runs per product per value — the
720-walk engine test is the thing that notices.

**The offer magnitudes are journey-only, and the data is why.** Cashback,
`sellerOfferPct` and `targetScheme` are drawn in `lib/catalog/kartik.ts` — the
main catalog names its offers without pricing them, and A–D's card prints a
cashback ribbon whenever it is handed an amount, so figures there would change
four signed-off variants. The merged *Offers* row is therefore in
`JOURNEY_RAIL_ORDER` only; on A–D all three of its groups would be empty, and
A–D's own Offers row stacks `hasOffer` and `offers` — the offer *names* — as it
always did. The two
new properties take **a fourth PRNG stream** (`offerRand`) so none of Kartik's
540 counts move, and both are drawn unconditionally and kept only where the
offer is. **The chips stay binary** — they ask *is there one*, the rows ask
*how big*, on different facets, so the two AND.

**A facet dropped from one rail may still have a chip.** `clearsAlso` on
`FilterScreen` is how Clear Filters still reaches it — otherwise the toast says
`All filters cleared` over a lit chip. `hasOffer` and `offers` are that case on
the journey: the merged *Offers* row holds the magnitudes, not the names.

Detail routes are `{base}/product/[productId]` for all seven paths, dynamic
rather than pre-rendered.

**Each variant is a closed loop** — hand someone `/b` and the journey stays in
B. Three props enforce it and all three must be kept in step when adding a
route: `PlpScreen`'s `variant`, `HomeScreen`'s `basePath`, `AppBar`'s
`homeHref`. **`""` and `undefined` are different answers** for
`productBasePath` — A's base path is genuinely empty, so it is tested with
`!== undefined` or A's cards silently stop navigating.

## Architecture

No backend. Deterministic seeded catalog + pure filter engine, all client-side.

| Module | Job |
|---|---|
| `lib/catalog/seed.ts` | 1,070 products from a fixed-seed PRNG |
| `lib/catalog/scope.ts` | Vertical-scoped product sets for C and D |
| `lib/catalog/kartik.ts` | The journey's separate 540, four PRNG streams, and the only products carrying offer magnitudes |
| `lib/catalog/productImage.ts` | `gender × kind × colour` → generated art, Figma renders as fallback |
| `lib/filters/engine.ts` | `applyFilters` (OR within a facet, AND across), `facetOptionsWithCounts`, `sortProducts`, `clearSelections` |
| `lib/filters/facets.ts` | The facet registry, `RAIL_ORDER`, `RANGE_FACETS`, `VerticalMode`, `settledVertical`, `singleValuedFacets`, `dropOrphanedSelections` |
| `lib/filters/activeVariant.ts` | Which pack a card is talking about — sizes live on the pack |
| `lib/filters/contextChips.ts` | Which chips the strip carries, given the selections |
| `lib/filters/panelFit.ts` | Whether a panel overflows the fold, and so earns a search field — and how tall the bottom sheet is, from its rail |
| `lib/filters/urlState.ts` | State mirrored to the query string; local state stays the source of truth |
| `components/plp/PlpScreen.tsx` | **The** PLP — all seven paths, parameterised, never copied |
| `components/plp/VerticalPlp.tsx` | The C/D listing configuration, shared by their four routes |
| `components/plp/FindItFast.tsx` | `/pvfilters`' guided *choose gender → choose size* block |
| `components/filters/FilterScreen.tsx` | Rail + panel, draft/commit |
| `components/journey/ProductDetail.tsx` | **The** detail screen — journey, `/pvfilters`, B and D |

**23 facets** behind 13 rail rows — 18 inside a vertical, 17 in C and D, 8 on
the journey's rail and 13 inside a vertical on `/pvfilters`, which is the only
route that still opens that block. Adding a facet is one entry in
`FACETS`; a facet with bands is one entry in `RANGE_FACETS` plus a
`rangeFacet()` line, and `typed: false` there is a facet with bands and no
boxes — which is what keeps all six of those identical. Each
declares `valuesOf(product, sizes?) → string[]`, so thumbnail rows, checkbox
lists, range buckets and multi-valued delivery windows share one code path.

**Category and Brands are a column of rows**, not the frame's tile grid, since
2026-09-03 — `panel: "thumb"` and `ThumbRow`: a 44px picture, then the name and
count wrapped to two lines. **No checkbox since 2026-09-08** — the row itself
fills `primary/subtle` with a 1px `primary` border and its label in primary
bold, still multi-select. **The box is inset 8px on every side** — 8 between
two boxes as well, so the air around one reads even — with 8px of padding
inside it, and the border sits on the row in both states, merely transparent
when unselected, so nothing shifts on tap. Flex margins don't collapse, so a
row's footprint is a flat **68px** and that is `THUMB_ROW_H`. Three tiles across a 240px panel gave the
name ~72px, and one truncated line made *Men's Casual Shirts* and *Men's Casual
T-Shirts* both read `Men's Casu…`. `TileGrid` is still there with no caller.

## Rules that must not be broken

**Counting.** `facetOptionsWithCounts` counts a facet's options against **every
other facet's selections, never its own** — counting a facet against itself
zeroes every unselected option the moment you tick one. Options at zero are
hidden; anything *selected* stays visible at zero, so a selection can never
become impossible to undo. Covered by tests; don't "simplify" it.

**Size is counted by applying each option, not by tallying it** — and each
option is applied *alone* (`{...selections, size: [option]}`), never unioned
with the current selection. It is the one facet whose values move with another
facet's selections, because the active pack moves. Three tests hold this.

**The seed must not depend on the JS engine.** A shuffle takes a draw count
fixed by the array's length, never by a comparator's answers.
`Array.prototype.sort` with a random comparator is **banned outright** — it once
consumed 6, 7 or 8 draws depending on the engine, so Vercel's Node 24 built a
different catalog from dev's Node 26 and every test passed on the machine that
wrote them. `seed.test.ts` pins the draw count per call.

**Any new per-product property needs its own PRNG stream.** Extra draws on the
main stream re-roll every product after them and invalidate every documented
count. `sizeRand` and `attrRand` are the precedent. Likewise, don't *delete* a
mid-sequence draw: `shippingFee` and `packType` are still drawn and simply
unread for exactly this reason, and the retired GOLD offer carries
`retired: true` rather than leaving the array.

**Category → gender is 1:1.** All seven categories name their audience, so
`CATEGORIES[].gender` is a single value the seed reads. Don't flatten the
weights to a uniform distribution and don't reintroduce a `genders[]` array.
`plural` is the gender-free noun for titles — a test asserts no possessive ever
reaches one.

**A filter with no control to show or undo it is the trap.** It survives Clear
Filters and goes uncounted. `dropOrphanedSelections` runs wherever selections
change, and any facet removed from the rail must leave `FACETS` too.

**Never redraw an asset.** All icons are exact Figma exports in `public/figma/`.
Monochrome icons that need to change colour go through
`components/ui/MaskIcon.tsx` — an `<img>` can't be tinted.

**Designs are 360px wide; never stretch a Figma dimension to fit.**
`DeviceFrame` renders edge-to-edge below 480px and drops the untouched 360×800
app into a phone mockup above it. A fixed width that is exact at 360 strands
dead space on a 390 or 430px phone — this has bitten the Filters panel, the tile
grid and the search field.

**Use the tokens.** `app/globals.css` `@theme`, named after the Figma variables.
The design's `#014FFA`, `#0a57ff` and `rgba(21,95,255,0.2)` are all slips for
`primary` / `primary/subtle`.

## Design source

Figma file `hdArN93DmnLu5JDB46SOwd` (`Filter-and-Sort`), section `651:4873`.
Use the Figma MCP `get_design_context` (load the `figma-design-to-code`
guidance first). **Always pull; never eyeball.**

| Node | Screen |
|---|---|
| `628:1620` | Home |
| `638:2718` | PLP base |
| `638:3659` | Filters screen (rail + panel) |
| `638:3696` | Tile grid — superseded 2026-09-03 by a row per option (`ThumbRow`) |
| `644:4435` / `644:4470` | Sort By / Gender sheets |
| `644:4011` | Sort/Filter chip bar — B, D and the journey; drawn Sort-first, built Filter-first |
| `644:4000` | Filters → Seller |
| `674:4904` | The product-vertical chip |
| `688:1687` | `SortbyIcon` — the five Sort sheet glyphs |
| `697:2658` | The floating pill — A and C's controls |

Fonts are mixed on purpose: Roboto throughout, **Inter** for button labels.

**Where a live-app screengrab and Figma disagree, the screengrab wins** — that
is settled for the product card, the price/margin block and the whole
`/userjourney` route. `design/` holds reference PNGs and is **gitignored**;
`public/figma/` and `public/categories/` are tracked because the app serves
them.

## Deployment traps

**The deployment is password-gated; localhost is not.** `proxy.ts` puts HTTP
Basic Auth over every request — pages, `_next` chunks and `public/` alike. Two
properties to preserve: it **keys off `VERCEL`**, not `NODE_ENV`, so `npm run
dev` and a local `next build && next start` never prompt; and it **fails
closed**, so a deployment with no `SITE_PASSWORD` serves 503 rather than
quietly going public. Set the env var *before* deploying. The file is
`proxy.ts`, not `middleware.ts` — renamed in Next 16.

**Deploys need `--scope bitihotra-karaks-projects`.** A bare `vercel --prod`
fails with `Not authorized` and reads like an expired session.

**A hung deploy with no output is a block, not slowness.** `vercel --prod` reads
the HEAD commit's **author email** and refuses to build when it can't match it
to a Vercel-team-authorised GitHub account. Nothing in the CLI says so —
`vercel ls` reports `UNKNOWN`, `inspect --logs` prints nothing, and the URL
answers 302 because that is the password gate replying. Check the dashboard, or
ask the API for `readyStateReason`:

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=team_7RaExFdsAbYFb54kXtQVYw3h" \
  | python3 -m json.tool | grep -iE "readyState|Reason|block"
```

There are **two different blocks** and conflating them cost an hour — see
`docs/decisions.md`. `git config user.email` is the first thing to check if the
identity has changed recently.

## Working style

- **Verify visually before claiming something works.** Playwright is not a
  dependency — install ad hoc (`npm install --no-save playwright`), screenshot
  at 360px with `deviceScaleFactor: 2–3`, then uninstall. Hide the dev overlay
  first; it intercepts clicks:
  ```js
  await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
  ```
- **Re-measure rather than eyeball** anything derived from a screengrab. Sources
  are 1080×2400, exactly 3× the design.
- Badged buttons change their accessible name (`Filters` → `3 Filters`), so use
  regex selectors.
- Run `npx eslint .` from the repo root. `.claude/**` is in `globalIgnores`
  because Claude Code's worktrees there are full checkouts of this repo.
- Port 3000 may be another worktree's dev server — check before trusting a
  screenshot.
