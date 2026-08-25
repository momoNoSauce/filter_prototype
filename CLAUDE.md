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
| **Variant A** | `/` | `/seller/[sellerId]` | Sort · Filters in a floating pill at the bottom (Figma `697:2658`) | live again |
| **Variant B** | `/b` | `/b/seller/[sellerId]` | The same two as chips under the app bar (Figma `644:4011`), no bottom bar | live |
| **Variant C** | — | **`/c`** | The same pill, already inside one vertical | live again |
| **Variant D** | — | **`/d`** | Top chips, already inside one vertical | live |

> **The bottom bar lost the A/B, then got it back** (2026-08-20, reversed
> 2026-08-21). The basket bar owns the foot of a SOLV listing — it is in the live
> app's own screengrab — so a **pinned, full-width** Sort · Filters bar was a
> second bar competing for the same edge, and one of the two had to give. A and C
> were parked on that, and `/userjourney/seller/kartik` moved onto top chips.
>
> Figma **`697:2658`** answers it: Sort and Filters as a **floating 240px pill**
> above the basket bar, with the listing scrolling under both. Nothing competes
> for the edge, so **A and C are live again** and the 2×2 stands. The journey stays
> on top chips — that was a separate call about which controls its screengrab
> shows, and it is now the source of truth for the card either way.
>
> **All four have a detail route** as of the same day: `/product/[productId]`
> and `/c/product/[productId]` join B's and D's, so every variant is a closed
> loop from listing to product to basket. Note A's base path is the **empty
> string** — its routes hang off `/`, the convention `HomeScreen`'s `basePath`
> already follows — so `productBasePath` is tested with `!== undefined` rather
> than for truthiness, or A's cards would silently stop navigating.

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
- **The card here is now *the* card** (2026-08-21). It arrived as
  `JourneyProductCard`, a second design for this route only — orange `#fb9805`
  cashback ribbon, outlined offer pills, `VIEW DETAILS` blue on `#f5f8ff`, no
  `Best Seller` — beside a Figma-derived card A–D kept because they were signed
  off. That note called two card designs in one prototype the thing to watch; the
  call came, **the journey is the source of truth**, and it moved to
  `components/plp/ProductCard.tsx` and replaced the other outright. `Tags.tsx`
  and its `BULK Offer` sprite pill are deleted with it — git history is where
  they live. It had already led on the blue `VIEW DETAILS`, which A–D took on
  2026-08-20.
  Two things came across so no catalog data went with the old card, the main
  catalog carrying offers and a `bestSeller` flag the journey's doesn't:
  **every offer shows** — `Free Delivery` and `Cashback` keep their artwork,
  anything else (`Bulk Offer` today) takes the same pill without an icon, in the
  offer's own casing, rather than vanishing off a card that used to name it — and
  **`Best Seller` takes the ribbon corner when the ribbon is free**, the
  screengrab having no flag because a cashback ribbon sat in that corner, which
  is an argument about the corner and not about the flag. `PlpScreen`'s `card`
  prop stays: it is how one route carried its own card for a day without a second
  copy of the screen, and the next screengrab that disagrees will want the same
  door.
- **The whole card opens the product**, not the `VIEW DETAILS` strip alone
  (corrected 2026-08-20): the strip is a signpost for buyers who haven't learnt
  that the card opens, which is how the live app behaves. A **stretched link** —
  `absolute inset-0` at `z-10`, last in the DOM, carrying the title as its
  accessible name — rather than a wrapper, because `<a>` may not wrap interactive
  content and the pack pills are buttons; they lift to `z-20`, so a pill
  re-prices the card and everything else navigates. **B and D took the same
  treatment the same day**, along with a detail route each — see *The detail
  screen is shared*. A and C stay inert, being parked.
- **`PlpScreen` took props, not a copy** — `card`, `appBar`, `aboveList`,
  `belowList`, `listClassName`. There is still one PLP screen.
- **The storefront runs `variant="top-chips"`** (2026-08-20, was `bottom-bar`).
  This is the screen that settled the question for the whole prototype: the live
  app puts the basket bar at the foot of a listing, `SHOW_CART_BAR` only hides
  ours, and two bars cannot share that edge. Flipping `SHOW_CART_BAR` back to
  `true` now costs nothing, the bottom being free.
- **`SHOW_CART_BAR = false`** in `StorefrontChrome.tsx` hides the basket bar on
  the **storefront listing**, where nothing fills a basket, so it could only
  print the screengrab's fixed ₹717. Since 2026-08-21 it no longer gates the
  detail screen — see *Adding to the basket*.
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
a basket beyond one line — `GO TO CART` goes nowhere. Men's cards still show a button-up — no men's tee render exists
in any screengrab, the same ask already open against the main catalog.

### Adding to the basket

The detail screen's stepper drives a real line (2026-08-21, from a fifth
screengrab), and it is shared, so `/userjourney`, `/b` and `/d` all have it.

- **The line is `price/pc × set size × qty`.** One set of the journey's tee is 4
  pieces at ₹360, so the first `+` is ₹1,440.
- **The basket persists, and the listing carries it too** (2026-08-21).
  `CartProvider` holds one line in the **root layout**, above the routes, so it
  survives every move in the demo — `<Link>` on the cards, `router.push` on home,
  `router.back()` on the back arrow are all client-side, and state above the
  router outlives all three. Add from a product, go back, and the listing's bar
  still carries the total. Deliberately **not** `sessionStorage`: a hard reload
  should start the demo again, and storage would have to be read in an effect to
  avoid a hydration mismatch — a bar appearing a frame late on every load, to
  solve a problem nobody has. Returning to a product restores its **pack, count
  and total**, so the stepper can't read 0 under a bar that says ₹1,440.
- **Both bars hide on the way down and return on the way up**, sharing
  `useHideOnScroll` with the chip strip. One difference, and it is the hook's only
  argument: the strip and the pill wait `foldsBeforeHide: 1.5`, the basket bar waits for
  nothing, because getting out of the way promptly is the whole point of a bar
  that never leaves otherwise. **Both animate a collapsing slot**, height and
  transform together: translating alone left the bar's 64px of layout behind it,
  so the listing stayed short and `bg-page` showed through where the bar had
  been — which reads as a grey band clipping the last card rather than as a bar
  leaving (fixed 2026-08-21). `CART_BAR_H` is the one place the height is
  declared, since a height transition needs a figure at both ends. Note the
  detail screen at 800px tall has nothing to scroll
  once the bar is up (content 680, viewport 680, measured), so the behaviour shows
  there only on a shorter screen or a longer product.
- **`SHOW_CART_BAR` is gone.** It hid a bar whose numbers were the screengrab's;
  both screens now print a total they computed, and the constant had no callers
  left.
- **The basket bar appears with the first set** and prints that total, with
  `count={1}` — one line is all this prototype's basket holds. `SHOW_CART_BAR`
  doesn't gate it: that constant exists for a bar whose number would be fiction,
  and this one is computed. The delivery line stays **`+ ₹0 DELIVERY CHARGES`**
  at every total, as both screengrabs have it; the threshold is announced by the
  dialog, not by a charge disappearing.
- **The app-bar badge follows the basket** — nothing at 0, then `1`. The route's
  `cartBadge` is only the resting value, because a basket of 3 that the bar's
  total doesn't include makes the two disagree the moment you add anything.
- **A green `SUBTOTAL` band** appears above the pricing card once qty > 0: 8px
  inset, 22px tall, measured. **Its green is recovered arithmetic, not a
  measurement** — the band only appears in a shot with the dialog up, so the
  scrim is over it. The app bar's known `#004FFA` reads back as `rgb(7,49,140)`,
  which puts the scrim at ~44% black; inverting the band's `rgb(71,102,72)` gives
  `#7fb681`. Replace it with a straight measurement if an undimmed grab turns up.
- **`FREE_DELIVERY_MIN = 1000`** is a demo constant, not a catalog field: no
  screengrab states it and no product carries it.
- **The dialog fires on every upward crossing**, so stepping under the threshold
  and back over it congratulates you again — chosen over once-per-visit for
  demoability.
- **Two waits, not one** (2026-08-21): the tap moves the stepper at once, the
  basket answers `CART_DELAY_MS` (450ms) later, and the dialog lands
  `OFFER_DELAY_MS` (600ms) after that. The real app makes two round trips — the
  line is priced, then the promotion is evaluated — so firing both at once reads
  as one canned animation where staggering them reads as a server thinking. The
  **stepper's own number is never delayed**: a control that lags its own label
  feels broken, where a total that lags a control feels like a network. Both
  timers are per-tap and rescheduled by the next one, and cleared on unmount.
  `cartQty` is the delayed count the bar, band and badge read; `qty` is the
  stepper's.
- **`offerDue`** is why `++` from 0 to 3 still fires: the second tap crosses
  nothing, being already over, and would otherwise cancel the first tap's
  scheduled dialog. Dropping back under the threshold clears it, and switching
  pack re-bases `lastTotal` against the pack now being priced.
- **Confetti over the dialog** — 24 pieces, `z-20` above the card's `z-10`,
  falling across the whole frame rather than the card alone: a shower that stops
  at a 282px box reads as a pattern inside a panel. The table is
  **hand-written, not random**, for the same reason the catalog's seed is fixed —
  a screenshot of it is reproducible — and each piece drives one keyframe through
  inline `left`, `animation-delay`, `animation-duration` and `--drift`/`--spin`.
  Colours are the app's own: `primary`, the cashback orange, the ✕ green, the
  badge orange. It plays once, and under `prefers-reduced-motion` it is **not
  rendered at all**, a shower of falling shapes being exactly what that setting
  is for.
- **The dialog's card is the screengrab itself**, cropped to its bounding box and
  corner-clipped at 13px: the message never varies, the truck is artwork nothing
  in `public/figma/` supplies, and re-typesetting it would only invite the two to
  drift. The grey scrim pixels left in the crop's four corners are exactly what
  the radius clips. Live rather than painted: the scrim, the ✕ above the card
  (`MaskIcon` in white — `close.svg` is black, for the sheets that carry it on
  white), and an invisible button over the blue band. `animate-dialog-in/out`
  scales from 92% rather than sliding, a centred surface not having an edge to
  arrive from.
- **Not built:** the quantity badge the screengrab shows on the selected pack
  pill. `SetPills` is shared with A–D's cards, and a badge there would land on
  screens that have no basket at all.

### The detail screen is shared

`components/journey/ProductDetail` serves **`/userjourney`, `/b` and `/d`**
(2026-08-20). It is the only detail design that exists — Figma draws the home,
the PLP and the sheets, and the live app's screengrab is the only source for
this screen — so B and D reuse it rather than inventing a second one for the
same app. It is parameterised, not copied: `homeHref` keeps each variant a
closed loop, and `cartBadge` has **no default**, so the journey's `3` (its
screengrab's) stays the journey's and B and D show no badge.

Routes are `{base}/product/[productId]` for **all five paths** — `""` (A), `/b`,
`/c`, `/d`, `/userjourney` — and the cards link there through
**`productBasePath`**, a string on `PlpScreen`. A builder function was the first
try and the build rejects it outright: these pages are Server Components and
`PlpScreen` is a Client one, so a function prop cannot cross the boundary. **`""`
and `undefined` are different answers** — A's base path is genuinely empty, so the
test is `!== undefined`; left undefined, a listing's cards simply don't navigate.

The detail routes are **dynamic, not pre-rendered**: 1,070 products each would
double a build for screens a demo opens two of. The journey's is dynamic for the
same reason.

The known mismatch carries over — a card titled *… T-Shirts for Girls* opens a
detail screen showing the Figma button-up, four of the seven categories being
tees with no tee render. It is the same ask already open against the card.

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
| `638:3696` | Tile grid (frame renamed `Category`) — 68×96 cells, 56px tile, two-line label. **Built at 72×105 with a three-line label** since 2026-08-21, so the label can be read: see *Tile grid* |
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
- `lib/filters/panelFit.ts` — whether a Filters panel's options run past the fold, and so whether it gets a search field. Pure arithmetic over option counts, deliberately **not** a DOM measurement: the server can't measure, so a measured rule would render no field on the server and add one after hydration. Constants are the rendered sizes (690px panel, 52px row, **105px** tile row, three across); a test pins the thresholds they produce — 14 rows, **19 tiles** — so changing a height in the markup without changing it here fails loudly. The tile row was 96 and the threshold 22 until the label was raised on 2026-08-21.
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
| Bottom bar | A **floating dark pill**, Figma `697:2658` (2026-08-21) — 240 × 52, `#323232`, 1px `#d1d1d1`, 16px radius, `0 0 5.05px rgba(0,0,0,0.3)`, two halves either side of a 32px rule, each a 24px glyph over its label. It **floats over the listing** rather than taking a band off it, 12px above the basket bar or the frame's edge, and the offset transitions so it rides the bar as that slides away. The list carries a `PILL_H + 2 × PILL_GAP` spacer so the last card can clear it. **It hides with the chip strip** — the same flag, not a second one: 1.5 folds down and it slides clear of the frame by its own height plus its offset, and it returns on the first upward flick. One gesture, one moment, both controls; two thresholds would read as a stutter. This is the design that un-parked A and C; the full-width white bar (`638:2836`) it replaces is what the basket bar could not share an edge with. Two departures, both standing rules: labels at **15px** not the frame's 14, every 14px control label having moved on 2026-08-20, and the **dot and count stay**, the frame giving no way to tell a filtered list from an unfiltered one. `sort.svg` is the frame's own `SortAscending` and `funnel.svg` its `Funnel`, both black exports rendered white through `MaskIcon`.<br><br>**Sort and Filters only** (2026-08-19). The frame's first slot was Gender, then briefly Category; Category now lives in the Filters rail like every other facet. A facet behind both a bar slot and a chip kept raising questions the bar was the wrong place to answer — whether to hide the slot once a vertical was picked, which control owned the count, what Clear Filters was allowed to touch. One control, one owner |
| Category | An ordinary rail facet, **first**, in both variants. It spent 2026-08-13 to 08-19 as a multi-select bottom-bar sheet in A; that sheet and its `Clear all` / `Show N results` footer are deleted, following the `GenderSheet` precedent — when a bar slot goes, the sheet it opened goes with it. Multi-select survives, because the rail's `TileGrid` was always multi-select |
| Gender | An ordinary **multi-select** rail facet, second in both A and B, and **only while no single vertical is settled** (2026-08-19). It's a faster cut than ticking three category tiles, and dropping it outright would leave `?gender=` links with no UI — but the moment one vertical is picked it becomes a dead control, category → gender being 1:1, so it could then only offer the one value every product in scope already has. That is the same argument C and D already made by dropping it; it now applies wherever the vertical is settled, not just where the page settles it. Exclusivity was always a property of the control, never the facet, which is why there is no `single` flag in the registry |
| ~~Category sheet icon~~ | Moot since 2026-08-19. `tag.svg` was standing in for a Category glyph in the bottom bar; there is no bottom-bar Category slot any more, so nothing needs the icon and the open request for a designed one is withdrawn |
| Active row (Sort) | Three things together: label bold, label primary, **icon tints to primary** |
| Tile selected state | Primary ring + 50% primary veil over the photo + white check + bold primary label |
| Top chip strip | Carries the **contextual chips** in both variants (defined 2026-08-13, previously reserved and empty). In **B** they follow the Sort and Filter chips, after the divider `644:4011` already draws as their boundary, sharing one horizontally-scrolling row. In **A** they are the whole strip, which collapses entirely when there are no chips rather than leaving an empty white band |
| Strip hides on scroll | **Amazon's behaviour** (2026-08-21): the chip strip leaves once the buyer is **1.5 folds** into the listing *and* scrolling down, and returns on the first upward flick. Two things animate together — the slot's height collapses so the listing takes the room, and the strip slides up so it reads as leaving rather than being squashed; `prefers-reduced-motion` drops both. The height is **measured** into state (`stripH`), because a height transition needs a number at both ends and `auto` isn't one; it is `null` until after mount, which is what keeps the server's markup and the first client render identical. Thresholds are `FOLDS_BEFORE_HIDE = 1.5` against the scroller's own height, not a pixel count — **two until 2026-08-21**, cut a quarter on the report that the pill wasn't hiding, which it was, at 1,350px of a 675px fold — and `SCROLL_EPS = 4` so trackpad jitter can't flicker it. It **is** a departure for B and D, where the strip is the only route to Sort and Filters: a fold and a half to lose it, one gesture to get it back, which is the trade Amazon makes with the same controls. A's bottom bar is untouched, and applying a filter scrolls the list to the top, which brings the strip back on its own |
| Strip elevation | **Material 3 level 2, softened** (2026-08-21) — M3's own value for a top app bar with content scrolled under it, two layers so it reads as a raised surface rather than a drawn line: `0 1px 2px rgba(0,0,0,0.18)` for the edge and `0 2px 6px 2px rgba(0,0,0,0.10)` for the lift. The alphas are M3's 0.30/0.15 taken down, the spec value reading as a firm edge at 360px where the ask was for a slight lift. Two things it depends on, both easy to undo by accident: it sits on the **slot**, not on `ChipStrip`, because the slot's `overflow-hidden` — there to clip the strip as it slides away — crops a shadow cast from inside it; and the header block carries **`relative z-20`**, because the scroller is a later sibling and paints over an unpositioned shadow, which is how the first attempt shipped invisible. It drops when the strip hides and in A when the strip is empty — `stripElevated`, written against `chips.length` rather than the measured height so server and client agree. M3 would use elevation *or* a divider; this carries both, the rule having been asked for a day earlier |
| Strip rule | A **1px `hairline` (#cccccc) border under the chip strip**, edge to edge (2026-08-21). White chips on a white strip over a white listing left the controls floating with nothing to say where the band stopped. It lives on `ChipStrip` itself, so every screen that has a strip gets it from one place — B, D and `/userjourney`, and A and C by inheritance; a flag there would fork the row all of them share. `border-b` rather than a child rule, because the strip scrolls horizontally and a border doesn't scroll with its contents. In A the strip collapses when there are no chips, and the rule goes with it |
| Contextual chips | The strip answers whichever question is still open. **Not inside a single product vertical** — none picked or several — it offers the verticals. **Inside exactly one** the picked vertical *stays*, leading the strip, followed by Price then Seller Offer, Cashback and Free Delivery. Logic is in `lib/filters/contextChips.ts`, kept pure and apart from the markup because the selection rule is the interesting part; `ContextChip` is a union carrying its `kind`, since the three render very differently |
| Vertical chip | **Figma `674:4904`** — pull it, don't infer it from the M3 spec. Unselected: white, **0.5px** `#4d4d4d` border, label Roboto Medium at `black/90` and 74% opacity, the same treatment `TopChipBar`'s chips use. Selected: no border, filled, label in primary, plus the exported `close_small` glyph. **Selected keeps its label** and adds the ✕ beside it |
| Chip thumbnail | **Square-cropped and full-bleed** (2026-08-14), against the frame, which draws a circular 26.727 × 27.796 avatar inside a 6px inset. It fills the chip's whole height and sits flush to the leading edge; `overflow-hidden` on the chip clips its corners. The chip's height *is* the image size, which is what forced the scale-up below |
| Strip scale | **44px, every chip, both variants** (2026-08-14) — up from the frames' 32, so the thumbnail is large enough to identify a garment; it also puts these on the 44px touch floor. `CHIP_H` in `ContextChips.tsx` is the one number, and `TopChipBar` **imports** it rather than repeating it, because two heights in one scrolling row is the thing that looks broken. **The label box tracks the label's type size**, because it has to stay wide enough that the longest vertical name breaks to two lines rather than clamping: the frame's 68px at 11px became 76px at 12px and is **82px at 13px** (2026-08-20). `Men's Casual T-Shirts` is the name that decides it |
| Chip blues are slips | The frame exports the fill as `rgba(21,95,255,0.2)` and the label and glyph as `#0a57ff`. Both are the usual off-token slip: that fill over white is exactly `primary/subtle` (#CCDCFE), and `#0a57ff` is `primary` (#004FFA). Use the tokens. `close-small.svg` ships with `#0A57FF` baked in, so it renders through `MaskIcon` rather than an `<img>` |
| Price chip | One chip opening a **bottom sheet** over the bands, not a chip per band. It was an anchored dropdown until **2026-08-20**, when it moved onto the `Sheet` shell Sort already uses, on request — one way of opening things in the strip rather than two. **No glyph column**, unlike Sort: these are checkboxes and the box is the row's leading element, which is also why the rows are the Filters screen's own `OptionRow` — Price Range is a rail facet whose panel is a list of exactly these, and the same control in two places shouldn't be drawn twice. Counts come with them. Multi-select, each tap applying live, and it **stays open** where Sort commits and closes, Sort holding a single value; dismissal is the scrim, the ✕ or Escape, all three the shell's. The closed chip carries the state — the band's own name for one, `Price (n)` beyond that. What went with the dropdown: rendering at the screen root to escape the strip's `overflow-x-auto`, the `left`/`top` measured against the frame, the clamp keeping a right-scrolled chip's menu on screen, `MENU_WIDTH`, and `PlpScreen`'s `rootRef` |
| Seller Offer | Means *any offer at all*, and is its own facet (`hasOffer`), not a fifth option inside `offers`. Inside it, OR-within-a-facet would make Seller Offer **widen** a Cashback selection; as a separate facet they AND. It is listed in the Offers rail entry alongside `offers` — a chip-only facet would survive Clear Filters and go uncounted, with no control left to undo it once the strip changes |
| Chip icons | Supplied PNGs in a **26px `object-contain` box**, leading the chip with a **4px** gap. A box rather than a fixed height, because the three are different aspects: sizing by height left the square one 20px on its longest edge while the two landscape ones reached 26, and the longest edge is what the eye compares — half M3's 8dp, which read loose against an icon wider than the checkmark and carrying its own padding; the checkmark keeps 8px (2026-08-19). **Material 3: the checkmark replaces it when selected** rather than joining it, so the chip has one leading element in either state and the label never shifts; the 8px inset now applies whenever anything leads. They live in `public/offers/`, not `public/figma/` — the latter is Figma exports only and a folder shouldn't imply an origin the file doesn't have. All three offer chips carry art, and so does Price. The offer chips lose theirs when selected, the checkmark taking its place per M3; **Price keeps its icon in both states**, having no checkmark to make room for — its state is the fill and the label. `ChipIcon` is the one place the box is declared. The map in `ContextChips.tsx` is keyed by **facet and option**, not option alone, because Seller Offer's option id is the bare `any` — a one-word id another facet could plausibly acquire later. `cashback.png` (48×37) and `seller-offer.png` (48×48) have almost no headroom above the 20px they render at and **want vectors**; `free-delivery.png` at 416×312 has room to spare. `price.png` was replaced on **2026-08-20** with a supplied bare ₹ — 48×48, transparent, ink 27×38, drawn in `#004FFA`, which is the `primary` token exactly — where it had been a filled blue disc with a white ₹ knocked out of it. Being monochrome and on-token it is the one chip icon that could go through `MaskIcon` if it ever has to tint; it doesn't today, since the chip keeps its icon in both states and blue reads on `primary/subtle` as well as on white |
| Chips that filter nothing | The three offer chips use `discriminatingOptions`: shown only when some but **not all** products in scope carry the offer. An offer everything already has is a dead control. Deliberately **not** applied to price bands or verticals — a narrow catalog where one band holds everything would otherwise be left with an empty menu, and zero-count options already drop out |
| Chip design | **Material 3** as instructed. Offer chips are filter chips: 8dp corner, 1dp outline unselected, filled with a leading checkmark when selected, 16dp label padding dropping to 8dp beside any leading element, Medium — at **15px**, one departure from M3's 14sp, per *Type scale*. All three now carry a leading icon too — see *Chip icons*. Height departs from M3's 32dp — see *Strip scale*. Vertical chips are input chips (see above). Palette is this app's (`primary/subtle`, `primary/default`), not M3's. No counts on chip labels — they're in the Price menu, where there's room |
| One radius per row | **8px, everywhere in the top strip** (2026-08-14). The vertical chip's own 4px (Figma `674:4904`) and `TopChipBar`'s rounded-100 pills (Figma `644:4011`) both gave way to it, because all three chip kinds share one scrolling row in B and three radii a gap apart read as a mistake rather than a distinction. This settles the mismatch that was left open for the designer. Each is one value to reverse |
| The ✕ green | `#2e9e42`, chosen rather than measured: the reference was a screenshot, not a Figma node. Darker than the app's `#39B54A` deliberately, so the white glyph clears 3:1 against it — `#39B54A` would land near 2.7:1 and join the contrast problems already logged |
| Applied state cue | Carried by whichever control owns the filter. One value → a **dot** (Sort). Many → a **count** (Filters). On the top chips, **the count replaces the glyph** and the dot sits on it (2026-08-21). Three placements were tried in order: after the label, which cost the chip 21px of a horizontally scrolling strip the moment a count appeared (`Filter` 85 → 106px, measured) and made it change width as filters were applied; on the glyph, which covered the funnel and read as clutter; and in the glyph's place, which is where it stayed. A one-digit count is **3px narrower** than the icon it stands in for, two digits the same width, so the chip holds 86–89px in every state. The chip still says `Filter` beside it, so the glyph was never what carried the meaning — the number is. Sort keeps its glyph with the dot on it: one value, so there is no number to swap in. The chip's gap went 4 → 8px, the leading element now sometimes being a filled counter rather than a line glyph. Since 2026-08-19 the Filters count is simply every selected option, category included: nothing else carries a badge, so nothing is double-reported and the old exclusion is gone |
| Clear Filters | **Commits and closes** (2026-08-25). It used to edit the draft and stop there, so the button that says it clears your filters left the listing untouched behind a screen you still had to dismiss through `Show N results` — the one control on that screen whose effect you couldn't see, which is why clearing read as broken. Clearing is a complete instruction, not a partial edit: there is no half-cleared state left to refine, so a second confirmation is a step with nothing in it. It goes out through the **same `onApply`** the primary CTA uses, so `commit` drops orphans, rewrites the URL and scrolls the list to the top. Draft edits made before the tap go with it, that being what clearing means. The cost, accepted: re-picking from scratch means reopening the screen. `clearDisabled` still reads the **draft**, so the button is dead when there is nothing on screen to clear.<br><br>**It says `All filters cleared`** (also 2026-08-25). Landing on a full listing is ambiguous on its own — a buyer who has just cleared four filters and one dumped somewhere by a bug see the same screen — so the toast is the difference. `onCleared` is its own callback rather than a flag on `onApply`, because the two are different events sharing a code path: a draft the buyer built and then committed needs no narration, and stays silent. See *Which events speak* |
| Clear Filters scope | Clears only facets in `getRailFacetIds()`, read from the **draft about to be cleared** — so inside a settled vertical Size and the attribute block go too, and in C and D the page's own vertical survives, never having been a selection. That is every facet the screen shows, category included; the exception that spared category in A went with the bottom-bar slot, since wiping a filter from a screen that never showed it is a silent surprise and the screen shows it now. Expressed as a filter over the rail rather than a blanket reset, so it still holds if the rails ever diverge again — `clearSelections` in `engine.ts` is the one place it is written, shared by the screen and its test |
| Sheet motion | Asymmetric: enter 260ms `cubic-bezier(.05,.7,.1,1)` (decelerate), exit 200ms `cubic-bezier(.3,0,.8,.15)` (accelerate); scrim 200/160ms. `Sheet` owns dismissal — `onClose` fires on `animationend`, and rows and footers get the animated close via a render prop. `prefers-reduced-motion` collapses all four to 1ms |
| The Filters screen rises too | **`animate-sheet-in` / `-out`, the very same classes** (2026-08-25) — it was the one surface that appeared and vanished between frames, so a panel covering the whole app arrived with no account of where it came from. The travel is `translateY(100%)` either way and the panel is pinned to `inset-0`, so 100% *is* the frame's height and the shared keyframes need no variant. Sharing them also means one beat to tune, and the existing `prefers-reduced-motion` rule covers this screen for free where a second pair would have to remember to join it. **Measured over the full 800px** rather than assumed to survive the longer travel: enter steps 142→75→48→19→11→5→1 (decelerating), exit 12→24→41→113→148 (accelerating). It reads as a rise, not a snap, so it keeps the app's one beat rather than earning a longer one. Rising from the bottom also answers where it came from in A and C, whose pill is down there; in B and D the chip is at the top and the connection is looser, but one screen with two motions depending on which control opened it is the worse answer. `.device-screen` is `overflow: hidden`, which is what keeps the off-screen panel from spilling past the mockup |
| Sort sheet | No footer, commits on tap, because it holds one value. It is the only bottom sheet left — the Category sheet, which had the `Clear all` / `Show N results` footer because it held many, went with A's bar slot on 2026-08-19 |
| Discarded drafts | The **Filters screen** (✕) is now the only draft surface, and fires a **`Selection discarded`** toast when dismissed mid-edit. It fires **only when something would actually be lost**: untouched, or edited back to where it started, stays silent, and so does applying. The check is `sameSelections`, which treats an absent key and an empty array alike and ignores option order. The string stays a named constant so a second draft surface can't word the same event differently |
| Which events speak | Three exits, and they don't all say something (2026-08-25). **✕ mid-edit → `Selection discarded`**, a *warning*: edits vanished where nobody could see them go. **Clear Filters → `All filters cleared`**, a *confirmation*: the screen closes onto a listing that looks identical to one nobody filtered, and the toast is what names the difference. **`Show N results` → nothing**, because a buyer who built a draft and committed it is already watching the result they asked for. Same component, opposite jobs, which is why the cleared wording is flat rather than apologetic. Both strings are named constants in `PlpScreen` — and `CLEARED` covers **two** controls, the Filters footer and the zero-results state's recovery button, since they do the same thing and so must say the same thing |
| Where the discard check hangs | The Filters screen has no `Sheet` — it is full-bleed and has no scrim to own — so it carries its own `exit`, and only the ✕ passes a discard check through it; the other two commit what they hold and need no `applied` guard. It compares against a **frozen snapshot** of what the screen opened with — comparing against the live `selections` prop fails, because applying updates it while the component is still mounted |
| `exit` has two sides | The Filters screen's one way out takes `commit` and `announce`, and they sit deliberately on **different sides of the animation** (2026-08-25). `commit` runs at once, because the listing is hidden behind an opaque panel for the whole 200ms and should already show the answer when uncovered — applying after means a frame of the old list and then a jump. `announce` waits, a toast behind that panel being a toast nobody sees, and its 2,600ms no better for losing the first 200 of them. A `closing` guard sits at the top: the footer stays live while the panel travels, so a second tap would otherwise queue a second commit against a screen already leaving. **The unmount is `onAnimationEnd`**, which is why the reduced-motion rule sets 1ms rather than removing the animation — with no animation there is no end, and the panel would strand on screen forever. Verified under `prefers-reduced-motion: reduce`, all three exits |
| Toast | Not in the designs — `components/ui/Toast.tsx`, a dark pill near the bottom. Its lifetime *is* its CSS animation (`.animate-toast`, 2600ms: rise, hold, fade) and `animationend` unmounts it, so the duration lives in one place rather than in keyframes plus a `setTimeout` free to drift. Under `prefers-reduced-motion` it swaps to a fade-only keyframe **at the same duration** — collapsing to 1ms like the sheets do would make it unreadable. The wrapper centres and the pill animates, because a keyframe `transform` would otherwise wipe out a centring `-translate-x-1/2`. `clearsBottomBar` sets the offset: 72px in A to clear the bar, 24px in B, which has none. Keyed by an incrementing id in `PlpScreen` so firing twice replays the animation. **The 72 was sized for the full-width bar** and the floating pill that replaced it stands 64px off the frame, so the clearance is now **8px** — measured, not overlapping, but tight, and it matters more since 2026-08-25: a toast in A went from a rare discard to something a buyer sees every time they clear. Two dark pills 8px apart; open it up if it reads as one stack |
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
| Floating mic | `components/ui/MicFab.tsx`, on the journey home **and every PLP** (2026-08-20, on request) — the live app floats one over its listings and it is in three of the four screengrabs. **Inert and `pointer-events-none`**, so taps fall through to the card beneath: there is no voice search behind it and a button that opens nothing is worse than one that plainly does nothing. Measured at 3× rather than eyeballed — 47px circle, 2px `#023d8c` ring, 13 × 21 glyph, 20px in from the right, 78px up from the bottom of the frame. The home's own had been eyeballed at 54px and 18px up, a seventh too big and 60px too low; it takes the measured pair too, one mic being one geometry. 78px also clears both bars this app puts at a listing's foot — A and C's 72px control bar and the journey's basket bar — which is why the PLP anchors it to the frame and not to whatever sits under the list. `z-30`, below the sheets and the Filters screen |
| Sort chip glyph | **`sort.svg`** — the `SortAscending` the bottom bar already carries — not the frame's caret (2026-08-20, on request). A caret says only that something opens, where `funnel.svg` beside it names its control; and using the bar's own glyph leaves B and D differing from A and C in control *placement* alone, which is the whole point of the comparison |
| Filters panel width | **The remaining width, not a fixed 240** (2026-08-21). The frame draws 120 + 240 = 360 and both were fixed, which is exact at the design width and wrong on any phone that isn't: `DeviceFrame` renders edge to edge below 480px, so a 390 or 430px screen left 30–70px of dead white beside the tiles. The **rail keeps its designed 120** — its labels are set to it — and the panel takes the rest, which is what a native layout does and agrees with the frame at exactly 360. Everything inside is width-agnostic, so the only visible effect is bigger tiles. `panelFit.ts` still computes against a 240px panel, three tiles across at 105px: it decides what the **server** renders, and the server has no viewport. Exact at 360 and slightly optimistic beyond it — columns stay three and the square tiles grow, so rows run taller than 105 and a long panel can overflow where it said it wouldn't. The cost is a missing search field on a wide phone, on a list that still scrolls; measuring instead means no field on the server and one appearing after hydration, which is the 56px shift the rule exists to avoid |
| Filters header icon | `filter_alt.svg` at **24px**, 8px before the heading (2026-08-19). 24 is the export's own size — it went in at 18 and read as an afterthought, and downscaling resampled a thin glyph for no reason — the same glyph the Filters control carries, so the screen reads as the one that button opened. Not in the frame, which has the heading alone. Black in the export, which is the heading's colour, so no `MaskIcon` tint. B and D's chip uses `funnel.svg` instead, an inconsistency the frames already had |
| GOLD removed | The membership strip and the `GOLD Target Scheme` tag both went on 2026-08-19, with `GoldStrip.tsx`, `GoldGlyph`, the three `gold-*.svg` exports, the `.gold-text` gradient, its seven tokens and the Rowdies font. **The offer is still drawn.** `OFFERS.filter` runs its predicate once per entry, so deleting the row would have taken a `rand()` out of the middle of the sequence and re-rolled the whole catalog; it carries `retired: true` instead, is discarded after the draw, and is filtered out of the facet's options so no permanently-empty row appears. Verified: every documented count unchanged, and no product carries a GOLD offer |
| Brands panel | Uses the **same tile grid as Category**, not a checkbox list |
| Tile grid | Figma frame `Category` (`638:3696`) drawn at **72×105**, not the frame's 68×96 (2026-08-21): 56px square at radius 9.333, 3px gaps, 10px left inset, three across. **The grid changed so the label could**: 11px read as small beside its own photograph, and 11px was itself a fit to the 68px cell — `Men's Formal` measures ~66px there and clears 68 at 12px, so a two-line clamp ellipsised the third word. The cell took 4px off the insets and gap to reach 72 and the label box grew to a **fixed 45px three-line box** at 13px — reserved even for one-line labels, so tiles on a row bottom out level. Verified by DOM audit: every category and brand label sets whole, nothing clamps, nothing overflows the cell. Three across is preserved, so 10 + 72×3 + 3×2 + 6 = 238 of the panel's 240. Shared by Category and Brands in both variants; change it once. The cell is a **grid column**, not a fixed width — see *Tile grid layouts* for what happens on a phone that isn't 360px. It also moves the search-field threshold — see *Panel search field* |
| Tile grid layouts | **One responsive grid, no `layout` prop** (2026-08-21). There were two: `fixed`, the frame's left-aligned 72px cells, and `fill`, which divided a container's width and was built for the 360px Category sheet that went with A's bar slot — retained-but-unused, with a note to delete it if nothing needed it. Something did, and it turned out to be the same surface: below 480px `DeviceFrame` renders edge to edge, so on a 430px phone the panel is 310px and fixed cells stranded 70px of white beside the tiles. `auto-fill` with a **72px floor and `1fr` columns** lands on the frame's three across at the designed 240 — 10 + 72×3 + 3×2 + 6 = 238 — and spreads to fill anything wider, so the two layouts collapsed into the one that was always the answer. Columns **stretch rather than multiply** at phone widths (three 96px cells at 430px, not four 72px ones), which is the better half of the trade: the extra width goes to the label that the cell was widened for. **The tile grows with the column** — `calc(100% - 16px)`, square — since a flat 56px left 20px of air either side of a photograph at 430px; it lands on 56.67 at the designed 72.67 column, the frame's 56 within a subpixel, so 360px is unchanged. The radius went proportional with it: 9.333 of 56 is **16.667%**, the frame's corner at the design width and the same corner at any other. The cell's height is content rather than the old fixed 105, or a wider phone would clip the label |
| Reserved height vs clamp | They must live on **different elements**. Put `h-[36px]` and `line-clamp-2` on the same span and the explicit height wins, so a three-line label is cropped mid-glyph at 36 of its 39px instead of ellipsised. Wrapper reserves, inner clamps |
| Panel search field | **Earned, not declared** (2026-08-20). The `searchable` flag is deleted; the field appears only when a panel's options overflow the 690px fold, and disappears again when pruning shortens them. All five facets that used to set the flag fit whole, so it was 56px spent searching a visible list. **Colour went 10 → 20 colours** to give the screen one panel that genuinely overflows — safe for the seed because `weightedPick` draws once however long the array is, so no other draw moved and every documented count holds. Thresholds are **14 checkbox rows / 19 tiles** — 22 until the tile row grew from 96 to 105 on 2026-08-21 — computed in `panelFit.ts` rather than measured, because SSR can't measure and the client adding a field post-hydration is a 56px shift on every panel open. The query is dropped with the field, so a hidden control can't go on filtering |
| Undesigned panels | Only **Category** and **Seller** are designed — twelve of the fourteen base rail entries aren't, nor any of the five vertical-specific ones. They reuse the designed checkbox row rather than introducing sliders or swatch grids. Colour adds a 16px dot; price/margin/MOQ use bucket rows |
| Seller PLP scope | Baheti Garments is a **storefront aggregating multiple sellers** (the app bar says Baheti while the Seller facet lists other companies). Other seller pages are scoped to their own stock |
| `Offers` vs `Seller Offers` | The two filter frames disagree. Using **Offers** for the facet. Separately, `Seller Offer` is now a distinct catch-all facet — the two are not the same thing |
| Offer names | `Free Shipping` was renamed **`Free Delivery`** (2026-08-13) to match the chip vocabulary, which also changes its product-card tag. `Bulk Offer` and `GOLD Target Scheme` keep their names and stay out of the chip strip |
| Set pills | Selectable — picking a pack re-prices that card. Dots track scroll pages |
| Card format follows the live app | The product card's wording comes from a **screengrab of the shipping SOLV app** (2026-08-14), not from Figma, wherever the two disagree: `MRP/PC ₹299 \| SET of: 6` on one pipe-separated line, `PRICE/PC` in caps, and pills reading `SET OF 6` over `M/2, L/2, XL/2`. The old line, `MRP ₹390 Set Size 2pc`, never said the MRP was per piece although it always was, so it read as a pack price and made the margin look wrong. Mixed case in `MRP/PC` vs `SET of:` is the live app's own and is reproduced rather than tidied. The `+₹50 shipping fee` line under the price **went on 2026-08-20** — not a real charge, and its absence is one more thing the card now shares with the screengrab. `variant.shippingFee` is still drawn and simply unread: the `rand()` sits mid-sequence, so deleting it would re-roll the catalog |
| Price / margin block | Rebuilt from **pixel measurements** of the screengrab (2026-08-14), not eyeballed. Margin sits **10px after the price on the same baseline** (`items-baseline`), where it used to be a `flex-1` column pushing it ~40px right and bottom-aligning it to the since-removed shipping line. Title sets on a **16px** pitch, not the default 1.5/21px. The column carries **no `gap`** — its rows sit at different distances, so each has its own measured `mt-`. Verified by re-measuring our own render the same way: every gap lands within **0.3px** of the reference. Dropping the shipping line took the last `gap-[4px]` with it, that having existed only to separate the two; the 7px from `PRICE/PC` to the price and the 10px baseline gap are untouched. Re-measure rather than eyeball if you change any of it |
| Margin is blue | `--color-margin` points at **`primary`**, not the frame's `#39b54a` green. The live app renders margin in the same blue as a selected set pill. Measured `#0066ff` on an 85%-solid fill, but that screengrab's app bar is `#004ffa` exactly — our token — so `#0066ff` is a second blue a hair off brand, the same slip class as `#014ffa`, and indistinguishable at 14px. Contrast goes **2.66:1 → 6.0:1**, clearing AA. Likewise `--color-muted` is now the measured `#7f7f7f`, not `#999999`: **2.85:1 → 4.0:1**, still short of 4.5 at 12px, so it stays on the contrast list |
| `VIEW DETAILS` is blue | `primary`, not the frame's orange `#FF7711`, in **all four variants** since 2026-08-20 — the live app renders it blue and that was confirmed. **2.53:1 → 5.72:1** on the `#f8faf7` strip, clearing AA at 13px, and the last of the three inherited contrast failures to close bar the body grey. The exported chevron is *stroked* `#FF7711`, so it goes through **`MaskIcon`** rather than an `<img>` — a blue label beside an orange arrow is the failure mode, and `MaskIcon` reads only the alpha channel so the export is untouched. `--color-orange-500` **stays**: the home badge, the cart counter and the detail screen's stepper still use it, all white-on-orange or as a border |
| Type scale | **The small end was raised, not the whole scale** (2026-08-20). The type read small for 360px, and the tier that was actually failing was 9–12px — text carrying information a kirana retailer reads in poor light, which is the audience already logged against the contrast backlog. So the floor moved and the top did not: `PRICE/PC` 9 → 11, the offer tags 10 → 12 (pill 16 → 18), `SET OF n` 10 → 11, both badge counters 9/10 → 11 (box → 17), the muted `MRP/PC` line 12 → 13, every 14px control label — checkbox rows, rail rows, chips, buttons, `Show N results` — to 15, and the home activate-account card off its fractional 12.407/10.634 to 13/12. **Three things were deliberately held:** the 26px price and the title's measured 16px pitch, both pixel-measured off the live-app screengrab and already at or above it; and the app bar titles at 20/18px, which are width-capped by the longest category label (see *C/D app bar*). Scaling everything by a multiplier would have moved all three and re-opened measurements that were taken rather than chosen. **Two sites refused the raise and were commented in place** — the tile-grid label and the home seller card's stat line, both boxed by a Figma dimension rather than by the type. The tile label was raised on **2026-08-21** by doing what that note said it needed: widening the cell, not the type alone (see *Tile grid*). The seller card's `1,070 products \| 9k+ orders` still stops fitting its 152px card at 13px and stands at 12. Verified by a DOM audit over all four variants and every rail row, diffed against the baseline: no new clipping, clamping or 360px overflow anywhere. The one line it does leave is a long seller name in the 240px panel, which already truncated at 14px |
| Pack breakups | Written `size/qty`, comma-joined, and the **quantities sum to the set size** — two tests enforce both. Earlier shapes used three notations at once (`S,S`, `M×2,L×2`, and a bare `2XL` standing for ten pieces), the last of which gave a wrong answer to the only question the line exists to answer. Re-shaping the table is safe for the seed because `pick` draws **once whatever the array length**, so the rand sequence, and every documented facet count, is untouched |

**Skipped as design artefacts:** a stray `$299.99` row at the bottom of the filter rail (`638:3712`), and `Margin` being SemiBold while its eleven siblings are Medium.

## Imagery

- **Category tiles** — Unsplash stock in `public/categories/`, credited in `CREDITS.md`. Filenames match the category id (`womens-t-shirts.jpg`), fetched at 336×336 = 6× the 56px tile. All seven are **worn on a model**, because every category names its audience and at 56px a person says who it is for faster than a flat-lay does; they're also picked for seven distinct dominant colours. `boys-casual-t-shirts.jpg` carries an incidental Levi's wordmark — unreadable at tile size, noted in `CREDITS.md`.
- **Product images are generated, one per wearer × garment × colour** (2026-08-21,
  **complete: 120/120**). Only two shirt renders exist in Figma, and four of the seven
  categories are tees, so every card used to show a button-up in one of two
  colours — a Coral tee for girls arrived as a grey shirt. `productImage()` in
  `lib/catalog/productImage.ts` now resolves
  `/products/{gender}-{kind}-{colour}.jpg` and **falls back to the two Figma
  renders for anything not yet generated**, so the set can land in batches
  without a flag day and nothing ever points at a 404.
  The axis is **`gender × kind`**, six pairs (women-tee, men-tee, men-shirt,
  girls-tee, boys-tee, boys-shirt) over 20 colours = **120 files**: collapsing
  women and men into "adult" would put a man on a Women's T-Shirt card, which is
  the mismatch this removes. Made with Magnific's Nano Banana 2 Lite — model on
  seamless white, waist-up, no print or logo — at 276px wide, 3× the 92px the
  card draws, ~16KB each. `GENERATED_PRODUCT_IMAGES` is the manifest of what
  exists; regenerate it from the directory after each batch rather than editing it
  by hand. **All 1,070 products now resolve to generated art** — verified, zero on
  the fallback — and 119 of the 120 files are used, one colour/garment pair never
  being drawn. The two Figma renders stay as the fallback path, which is what
  makes a missing file harmless rather than a 404. 1.9MB for the set. Nothing here touches the seed: the image was always derived from the
  colour, never drawn.
- **Brand tiles** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced (Clearbit's API is retired; Wikipedia/Commons returned unrelated files for 7 of 8 brands). The right input is brand-supplied assets, which also avoids scraping trademarked marks.
- **Product images** — only two shirt renders exist in the Figma file, assigned by whether the colour is dark or light.

## Working style

- Verify visually before claiming something works. Playwright is not a dependency — install it ad hoc (`npm install --no-save playwright`), screenshot at 360px with `deviceScaleFactor: 2–3`, then uninstall. Hide the dev overlay first: it intercepts clicks.
  ```js
  await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
  ```
- Badged buttons change their accessible name (`Filters` becomes `3 Filters`), so use regex selectors in tests.
- Run `npx eslint .` from the repo root — the shell's working directory persists between commands and a stale `cd` produces confusing failures. `.claude/**` is in `globalIgnores` because Claude Code's worktrees there are full checkouts of this repo: without it the root command lints every worktree's copy plus its `node_modules` and reports ~24k findings from outside the working tree.
