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
screengrabs of the live app rather than from Figma. Home → *Kartik exporters*
banner → storefront → filter → detail. Its catalog (`lib/catalog/kartik.ts`,
540 tees) is separate from the 1,070 and invisible to A–D.

Its listing departs from the documented control layout, via **one prop** —
`controls` on `PlpScreen` (`verticalChips`, `priceChip`, `sortInFilters`,
`rail`, `filterSheet`, `rangeInputs`), each field defaulting to the documented
behaviour so a route opts *out*, never in. Today that leaves the strip as
`Sort` and `Filter` plus the four offer chips; that rail in this route's own
order (`JOURNEY_RAIL_ORDER`), six rows dropped (Gender, Delivery Time, Offers,
More Filters, and — since the storefront *is* one seller — Seller and Seller
City), so its cut is **Category → Women's T-Shirts**, not Gender → Women;
Filters as a bottom sheet; and all three range facets with a typed min/max
above their bands. A–D pass nothing, and neither does the journey for
`sortInFilters` — Sort went back to the strip on 2026-09-03 after six days
inside Filters. Put new per-route departures in that object rather than adding
a prop each; the reasoning is in `docs/decisions.md`.

Its Filters screen is a **bottom sheet at 80%** rather than full-bleed, so the
listing stays visible behind it. That shortens the panel, so `needsSearch` takes
a viewport argument — 530 there against the full-bleed 690, giving 11 rows / 13
tiles instead of 14 / 19. A–D are untouched.

Its three **range facets** — Price Range, Margin on MRP and MOQ — each carry a
**typed min/max** (`?price=150-450`, `?margin=60-`, `?moq=5-12`) above their
bands. Per facet the two controls are exclusive, and each disables the other:
both are values on one facet, where they would otherwise OR into a wider
result. An inverted range is refused rather than filtered, with a toast on blur
naming that facet. All three are built from **one table** (`TYPED_RANGES` in
`facets.ts`) differing only in the number they compare and, in the UI, the unit
beside the box — ₹ before the number, `%` and `pc` after. They cost the facet
registry two optional hooks: **`matches`** overrides the default set-membership
test, and **`accepts`** widens `parseSelections`'s id validation. **A facet that
overrides `matches` needs `accepts` too** — without it the selection works
in-session and vanishes on reload. `parseTypedRange` gates on the first
character before its regex, because `matches` runs per product per value and
three facets now call it — the 720-walk engine test is the thing that notices.

**A facet dropped from one rail may still have a chip.** `clearsAlso` on
`FilterScreen` is how Clear Filters still reaches it — otherwise the toast says
`All filters cleared` over a lit chip.

Detail routes are `{base}/product/[productId]` for all five paths, dynamic
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
| `lib/catalog/productImage.ts` | `gender × kind × colour` → generated art, Figma renders as fallback |
| `lib/filters/engine.ts` | `applyFilters` (OR within a facet, AND across), `facetOptionsWithCounts`, `sortProducts`, `clearSelections` |
| `lib/filters/facets.ts` | The facet registry, `RAIL_ORDER`, `VerticalMode`, `settledVertical`, `dropOrphanedSelections` |
| `lib/filters/activeVariant.ts` | Which pack a card is talking about — sizes live on the pack |
| `lib/filters/contextChips.ts` | Which chips the strip carries, given the selections |
| `lib/filters/panelFit.ts` | Whether a panel overflows the fold, and so earns a search field |
| `lib/filters/urlState.ts` | State mirrored to the query string; local state stays the source of truth |
| `components/plp/PlpScreen.tsx` | **The** PLP — all five paths, parameterised, never copied |
| `components/filters/FilterScreen.tsx` | Rail + panel, draft/commit |
| `components/journey/ProductDetail.tsx` | **The** detail screen — journey, B and D |

Adding a facet is one entry in `FACETS`. Each declares
`valuesOf(product, sizes?) → string[]`, so tile grids, checkbox lists, range
buckets and multi-valued delivery windows share one code path.

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
| `638:3696` | Tile grid |
| `644:4435` / `644:4470` | Sort By / Gender sheets |
| `644:4011` | Sort/Filter chip bar — B and D's controls |
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
