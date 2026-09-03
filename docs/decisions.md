# Decision record — SOLV filter prototype

The long-form version of every call made here, kept out of `CLAUDE.md` so it
isn't loaded into context on every session. `CLAUDE.md` carries the rules; this
carries the reasoning behind them, and `progress_tracker.md` carries the
chronology and the open backlog.

**The reasoning also lives beside the code it governs** — these files run 30–77%
comment, and that copy is the one that can't drift from what it describes. Read
the file before reading this.

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

## The commit email is load-bearing for deploys

`vercel --prod` reads the **HEAD commit's author email** and refuses to build
when it can't match it to a GitHub account:

> The deployment was blocked because the commit email … could not be matched to
> a GitHub account.

It cost about an hour on 2026-08-25. The repo had just moved from
`cheeseKracker` to `momoNoSauce`, and `user.email` was set to that account's
noreply address (`320892459+momoNoSauce@users.noreply.github.com`) so GitHub
would credit the right owner. GitHub does — the API confirms `momoNoSauce` —
but **Vercel could not resolve it**, and every deploy after that commit was
blocked while every one before finished in 24s.

**The failure is silent and looks like slowness, which is the trap.** The CLI
hangs with no output. `vercel ls` reports `UNKNOWN` with no duration and
`Builds: . [0ms]`. `vercel inspect --logs` prints the same `UNKNOWN` and no log.
The deployment URL even answers 302 like a healthy one, because that is the
protection layer replying before the app. Nothing anywhere says "blocked" — that
text is only in the **dashboard**. Vercel's status page said all systems
operational, which it was.

So: **when a deploy hangs with no output, check the dashboard before theorising**
— and check `git config user.email` first if the identity has changed recently.

**There are two different blocks, and conflating them cost an hour.** Both are
about the git author's email, and they fail for unrelated reasons:

| commit email | block | cause |
|---|---|---|
| `320892459+momoNoSauce@users.noreply.github.com` | *"could not be matched to a GitHub account"* | the noreply form; GitHub resolves it, Vercel doesn't |
| `bitihotra.karak@jumbotail.com` | **`TEAM_ACCESS_REQUIRED`** | matches GitHub fine — it just isn't a member of the Vercel team |
| `m23ldx002@iitj.ac.in` | none, builds in ~23s | it is the Vercel account's own address |

The second one's exact words, which is the fix in one line:

> Git author `bitihotra.karak@jumbotail.com` must have access to the team
> *Bitihotra Karak's projects* on Vercel to create deployments.

That is a guard against outside contributors consuming build minutes, and it is
**not** the "match a GitHub account" rule — reasoning from the first error to the
second produced the wrong conclusion here, that no `momoNoSauce` address could
ever deploy. It can. **Add the address to the Vercel account**
(vercel.com/account → Email → add and verify), and then commit email, GitHub
credit and Vercel all agree. No seat cost: an extra address on an existing
account, not a new member.

Standing on `m23ldx002@iitj.ac.in` until that is done, so deploys work and
commits credit `cheeseKracker` — a known, accepted wrong attribution.

**How to read a blocked deploy, because none of this is visible from the CLI.**
`vercel ls` says `UNKNOWN` with no duration, `inspect` says `Builds: . [0ms]`,
`inspect --logs` prints nothing, and the deployment URL answers 302 like a
healthy one — that is the password gate, not the app. So a blocked deploy is
indistinguishable from a slow one. Ask the API, which says it outright:

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=team_7RaExFdsAbYFb54kXtQVYw3h" \
  | python3 -m json.tool | grep -iE "readyState|Reason|block"
```

`readyStateReason` carries the sentence. Reach for that before theorising about
build queues or checking Vercel's status page — both were tried here and both
were dead ends.

## A and B are reached by searching, not by a seller card

Changed 2026-08-25. The journey was Home → tap *Baheti Garments* → PLP. It is
now **Home → tap the search bar → type `shirt` → tap a suggestion → PLP**,
which is how a buyer actually reaches a mixed catalog: tapping one storefront
never explained why the listing spans seven categories and eight sellers.

```
/search            /b/search            the search screen
/results?q=shirt   /b/results?q=shirt   the listing
```

**The swap moved nothing.** `shirt` matches **all 1,070** products, every
category being a Shirt or a T-Shirt, so the scope is byte-identical to what
`/seller/baheti` gave — every facet count, every test, the whole demo script
still holds. That is what made this a framing change rather than a rebuild, and
it is worth checking again before anyone changes the default query.

**Source is two screengrabs at 1080×2400** — exactly 3× the design, like the
journey's — so everything was measured off raw pixels:

| | measured | built |
|---|---|---|
| blue bar | 46.7 | **47**, `#004FFA` |
| search field | 221 × 31.3 at x 58.3 | **flex-1** × 31, x 58 |
| rows | 149 + 3 divider | **50** + 1px `#ebebeb` |
| leading glyph | 19.3 at x 13.7 | **20** at 14 |
| label | starts 54.7, `#333333` | 21 after the glyph |
| trailing ↖ | 11.7, `#b3b3b3` | **12**, 14 from the right |

**The field flexes rather than sitting at its measured 221.** Below 480px
`DeviceFrame` renders edge to edge, so a fixed width strands 30–70px of blue on
a 390 or 430px phone — the trap the Filters panel fell into on 2026-08-21. The
margins are the measured ones, so it is exactly 221 at 360.

**Two states, one row component.** Empty: history rows under `Type to search`.
Typed: the history dial becomes a magnifier, a ✕ appears in the field, and the
rows become autocomplete. `shirt` reproduces the screengrab's eight verbatim and
in order, including the green `Category Store` under `shirt fabric` — but they
come from a substring filter over a vocabulary, not a lookup, so any other query
still gets a plausible answer instead of an empty panel.

**Three deliberate departures:**

- **Labels at 15px where the grab measures 13** (reconciled across three rows
  via Roboto's ascender/descender metrics, so the 13 is solid). The 2026-08-20
  pass raised this app's small end on purpose, and the vertical chips were
  raised to 15 hours earlier on exactly the "too small on a phone" complaint.
  A new screen at 13 invites it straight back.
- **`Category Store` is `#2f7a78`, measured `#6a9b9b`** — 2.9:1 on white against
  4.9:1. Same call the sheet's ✕ green got, and for the same reason.
- **The glyphs are drawn here, not exported.** `back.svg`, `search.svg` and the
  mic and camera PNGs all exist and are all the wrong colour, weight or shape
  for this bar; the history dial and the fill-in arrow have no export anywhere,
  being Android's rather than SOLV's, and no Figma frame draws this screen.
  Replace them the moment a frame supplies any. The ↖ points **up and left**, at
  the field it fills — up and right would read as "go there", the opposite
  instruction.

**Both icons in the bar are inert**, like the floating mic: there is no camera
search and no voice search behind them.

**The results app bar carries the query as its title** and is otherwise the
standard `AppBar`. No screengrab of the results screen was supplied — if the
live app keeps the search field up there instead, that is the one thing to
change.

**`/seller/[sellerId]` still exists and still works.** Removing it is the stated
next step and was deliberately not done here.

## Four control variants of the same PLP

Both render the identical card, catalog, engine and sheets. **Only the controls differ**, so a preference between them is about control placement and nothing else. Don't let them drift apart in any other respect.

| | Home | PLP | Controls | |
|---|---|---|---|---|
| **Variant A** | `/` | `/results?q=shirt` | Filters · Sort in a floating pill at the bottom (Figma `697:2658`) | live |
| **Variant B** | `/b` | `/b/results?q=shirt` | The same two as chips under the app bar (Figma `644:4011`), no bottom bar | live |
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
> for the edge, so **A and C are live again** and the 2×2 stands. The journey
> spent five days on top chips and **moved onto the pill on 2026-08-25**, on
> UXR — see the storefront bullet under `/userjourney`. It is the source of
> truth for the card either way.
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

The journey is Home → tap the search bar → type `shirt` → tap a suggestion → PLP → filter and sort (changed 2026-08-25; see *A and B are reached by searching*). Variant A is the default; Variant B is the same journey with the controls moved.

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
- **Six control departures, one prop.** `controls` on `PlpScreen` carries
  them — `verticalChips: false`, `priceChip: false`, `rail: "journey"`,
  `filterSheet: true`, `rangeInputs: true`, all from the 2026-08-28 review and
  all on this route. `sortInFilters: true` was the sixth until **2026-09-03**,
  when Sort was asked back onto the chip strip beside Filter; the flag and its
  plumbing stay, and nothing passes them today. One object rather than a
  boolean per note, because they are one idea (which controls this listing
  surfaces and where) and a prop per stakeholder remark is how a shared screen
  grows a dozen of them. Every field defaults to the documented behaviour, so a
  route opts *out*, never in, and A–D pass nothing. What is left in the strip is
  **`Sort` and `Filter`, then the four offer chips**.
- **Filters is a bottom sheet here, not a full-bleed panel.** A full-bleed
  panel is the one surface in this app that takes the buyer off the page they
  were on: they tick four things against a listing they can no longer see, and
  the only report of what changed is a count in the footer. At **80%** of the
  frame — 640 of 800 — the app bar, the chip strip and the top of the first
  card stay visible, so filtering reads as happening *to* something. 80% was
  chosen from both ends: much taller and the context is a sliver, much shorter
  and the rail shows too few of its 60px rows to navigate. A percentage rather
  than a pixel height, `DeviceFrame` being `100dvh` on a phone. The scrim is a
  real exit and goes through the same discard-checking path as the ✕, so
  dismissing mid-edit still says `Selection discarded`.
- **Gender left the rail, so the journey's cut is Category now.** The
  documented flow was *Gender → Women*; it is **Category → Women's T-Shirts**,
  which settles the vertical identically — Kartik carries exactly three
  verticals and one of them is women's — and so still unlocks Size. The demo
  script changed with it; nothing else about the flow did.
- **The storefront runs `variant="top-chips"`** — since **2026-08-28**, on the
  stakeholder review, and this is the third placement it has held.

  It began on top chips (2026-08-20) because the basket bar owns the foot of
  this listing and a *pinned, full-width* Sort/Filters bar was a second bar
  fighting for the same edge — true of `638:2836`, and the journey is where
  that was concrete, being the one screen here with a basket bar at all. Figma
  `697:2658` removed that objection on 2026-08-21 with a pill floating 12px
  *above* the basket bar, which is what un-parked A and C; `pillBottom` reads
  `CART_BAR_H`. On **2026-08-25** it moved onto the pill, on UXR reading the
  bottom placement as testing better, which outranked "its screengrab shows top
  chips".

  **2026-08-28 reverses that on a stakeholder's call.** The research is not
  withdrawn and the pill is not at fault; the decision is that the
  demonstration flow should show what the live app shows, so the route is 1:1
  with its screengrabs again in behaviour as well as pixels. A and C keep the
  pill, which is what still makes this a *placement* A/B rather than two
  different screens. If it moves a fourth time, the thing to re-check is the
  toast — see the *Toast* row.
- **The storefront listing now carries the basket bar too.** `SHOW_CART_BAR`
  hid it here while the number would have been the screengrab's fixed ₹717;
  the bar computes its own total since 2026-08-21 and the constant is deleted —
  see *Adding to the basket*.
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
a basket beyond one line — `GO TO CART` goes nowhere. **Men's cards still show a
button-up**, no men's tee render existing in any screengrab, so `kartikImage`
falls back to the Figma shirt. This route is now the *only* place that mismatch
survives — the main catalog closed it on 2026-08-21 with generated art, which
this catalog deliberately doesn't share, its images being cropped from the live
app rather than generated. It doesn't touch the journey itself, which ends in
womenswear.

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

**The tee/shirt mismatch is closed here.** The detail screen renders
`product.image`, which is `productImage()`'s generated art for the main catalog
(2026-08-21), so a card titled *… T-Shirts for Girls* now opens a girl's tee.
Only the journey's men's tees still fall back to the Figma shirt — see
*`/userjourney`*.

## Design source — always pull from Figma, never eyeball

File `hdArN93DmnLu5JDB46SOwd` (`Filter-and-Sort`), section `651:4873`. Use the Figma MCP `get_design_context` (load the `figma-design-to-code` guidance first).

| Node | Screen |
|---|---|
| `628:1620` | Home |
| `638:2718` | PLP base |
| `644:4435` | Sort By sheet |
| `644:4470` | Gender sheet |
| `638:3659` | Filters sheet (rail + panel) |
| `644:4011` | Sort/Filter chip bar — B's and D's controls; drawn Sort-first, built Filter-first since 2026-09-03 |
| `644:4000` | Filters → Seller |
| `638:3696` | Tile grid (frame renamed `Category`) — 68×96 cells, 56px tile, two-line label. Built at 72×105 with a three-line label from 2026-08-21, and **superseded on 2026-09-03**, Category and Brands moving to a column of rows: see *Category and Brands as rows* |
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
- `lib/filters/facets.ts` — facet registry. Each facet declares `valuesOf(product, sizes?) → string[]`, so thumbnail rows, checkbox lists, range buckets and multi-valued delivery windows all use one code path. Adding a facet is one array entry. `FACETS` is every facet the engine knows; `getRail(category)` is what the Filters screen shows and `getRailFacetIds(category)` is the set anything touching the draft must filter through. Neither takes a variant — the rails are identical since 2026-08-19 — but both take the **category selection**, because the rail grows a vertical-specific block once exactly one vertical is settled. `PlpVariant` still lives here rather than in the component; it now decides only where Sort and Filters sit.
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
| Default sort | **Popularity**, and omitted from the URL (bare URL = Popularity). The sheet **says so** since 2026-08-25 — the row reads `Popularity (Default)`, because Sort's dot only reports *not default* and never named what default was, so a buyer three sorts deep had no way back to the untouched state. It is in the `SORT_OPTIONS` label rather than a flag on the row: that string is the only thing `SortSheet` reads, and a flag would need markup to render it, for one word on one option that never moves |
| Sort options | Popularity · Recently Added · Price/pc low→high · **Price/pc high→low** · Highest Margin. High→low added 2026-08-19 in all four variants — one `SORT_OPTIONS` entry, one `sortProducts` case, since every variant reads the same list. Both price sorts read the pack the card prints, not pack #1. **Arrow direction is the magnitude, not the list**: up for low→high, since the prices ascend as you read down — Figma names the up-arrow glyph `low to high`, so the frame agrees. Swap the two paths if it should describe list order instead |
| Sort sheet glyphs | All five come from Figma **`688:1687`** (`SortbyIcon`), exported to `public/figma/icons/sort-*.svg` (2026-08-19). They are **drawn as a set at one weight**, so the sheet takes the whole set and borrows nothing: `recent` used to stand in `tag.svg` — the Sort sheet's own *Recently Added* glyph doing double duty — and `popularity` used to take `trend-up.svg`, a heavier cut of the same trending arrow that the PLP owns. The pair of supplied price PNGs in `public/sort/` are superseded and that folder is gone. `sort-percent.svg` currently matches the library's `percent.svg` byte for byte and is **still its own file**: the set is the unit that gets reweighted, so a redraw has to land in one place rather than depend on a coincidence between two glyphs with different owners. They run through `MaskIcon`, which reads only the alpha channel, so a black glyph still tints to primary on the active row. `sort-new.svg` is the one assembled by hand — its Figma frame is a vector plus a live text layer, so it has no single vector-layer export; the frame export carries the exact paths for both, including the outlined `NEW`, and only the section background behind it was dropped. Its badge is a two-contour ring, so the counter stays transparent and the wordmark reads through the mask |
| Sort sheet | Tap applies **and closes** — no Apply button in the design<br><br>~~**`/userjourney` has no sheet at all**~~ (2026-08-28, **reversed 2026-09-03**): Sort spent six days inside the Filters screen as the first row of its rail, with no chip and no sheet on that route, and is now a chip on the strip again as B and D have it and as the live app's own bar shows it. A–D were unchanged throughout. See *Sort inside the Filters screen*. |
| Bottom bar | A **floating dark pill**, Figma `697:2658` (2026-08-21) — 240 × 52, `#323232`, 1px `#d1d1d1`, 16px radius, `0 0 5.05px rgba(0,0,0,0.3)`, two halves either side of a 32px rule, each a 24px glyph over its label. It **floats over the listing** rather than taking a band off it, 12px above the basket bar or the frame's edge, and the offset transitions so it rides the bar as that slides away. The list carries a `PILL_H + 2 × PILL_GAP` spacer so the last card can clear it. **It hides with the chip strip** — the same flag, not a second one: 1.5 folds down and it slides clear of the frame by its own height plus its offset, and it returns on the first upward flick. One gesture, one moment, both controls; two thresholds would read as a stutter. This is the design that un-parked A and C; the full-width white bar (`638:2836`) it replaces is what the basket bar could not share an edge with. Three departures. **Filters is the left half and Sort the right** (2026-09-03, on request), against the frame's own order, and taken on the chip bar at the same time: the 2×2 exists to compare where these two controls *sit*, so a pill ordered against the chips would put a second difference into it — and Filter first is the order the pair is used in, narrowing a listing before ranking what is left. The other two are standing rules: labels at **15px** not the frame's 14, every 14px control label having moved on 2026-08-20, and the **dot and count stay**, the frame giving no way to tell a filtered list from an unfiltered one. `sort.svg` is the frame's own `SortAscending` and `funnel.svg` its `Funnel`, both black exports rendered white through `MaskIcon`.<br><br>**Sort and Filters only** (2026-08-19). The frame's first slot was Gender, then briefly Category; Category now lives in the Filters rail like every other facet. A facet behind both a bar slot and a chip kept raising questions the bar was the wrong place to answer — whether to hide the slot once a vertical was picked, which control owned the count, what Clear Filters was allowed to touch. One control, one owner |
| Category | An ordinary rail facet, **first**, in both variants. It spent 2026-08-13 to 08-19 as a multi-select bottom-bar sheet in A; that sheet and its `Clear all` / `Show N results` footer are deleted, following the `GenderSheet` precedent — when a bar slot goes, the sheet it opened goes with it. Multi-select survives, because the rail's `TileGrid` was always multi-select |
| Gender | An ordinary **multi-select** rail facet, second in both A and B, and **only while no single vertical is settled** (2026-08-19). It's a faster cut than ticking three category tiles, and dropping it outright would leave `?gender=` links with no UI — but the moment one vertical is picked it becomes a dead control, category → gender being 1:1, so it could then only offer the one value every product in scope already has. That is the same argument C and D already made by dropping it; it now applies wherever the vertical is settled, not just where the page settles it. Exclusivity was always a property of the control, never the facet, which is why there is no `single` flag in the registry |
| ~~Category sheet icon~~ | Moot since 2026-08-19. `tag.svg` was standing in for a Category glyph in the bottom bar; there is no bottom-bar Category slot any more, so nothing needs the icon and the open request for a designed one is withdrawn |
| Active row (Sort) | Three things together: label bold, label primary, **icon tints to primary** |
| Tile selected state | Primary ring + 50% primary veil over the photo + white check + bold primary label |
| Top chip strip | Carries the **contextual chips** in both variants (defined 2026-08-13, previously reserved and empty). In **B** they follow the Sort and Filter chips, after the divider `644:4011` already draws as their boundary, sharing one horizontally-scrolling row. In **A** they are the whole strip, which collapses entirely when there are no chips rather than leaving an empty white band |
| Strip hides on scroll | **Amazon's behaviour** (2026-08-21): the chip strip leaves once the buyer is **1.5 folds** into the listing *and* scrolling down, and returns on the first upward flick. Two things animate together — the slot's height collapses so the listing takes the room, and the strip slides up so it reads as leaving rather than being squashed; `prefers-reduced-motion` drops both. The height is **measured** into state (`stripH`), because a height transition needs a number at both ends and `auto` isn't one; it is `null` until after mount, which is what keeps the server's markup and the first client render identical. Thresholds are `FOLDS_BEFORE_HIDE = 1.5` against the scroller's own height, not a pixel count — **two until 2026-08-21**, cut a quarter on the report that the pill wasn't hiding, which it was, at 1,350px of a 675px fold — and `SCROLL_EPS = 4` so trackpad jitter can't flicker it. It **is** a departure for B and D, where the strip is the only route to Sort and Filters: a fold and a half to lose it, one gesture to get it back, which is the trade Amazon makes with the same controls. A's bottom bar is untouched, and applying a filter scrolls the list to the top, which brings the strip back on its own |
| Strip elevation | **Material 3 level 2, softened** (2026-08-21) — M3's own value for a top app bar with content scrolled under it, two layers so it reads as a raised surface rather than a drawn line: `0 1px 2px rgba(0,0,0,0.18)` for the edge and `0 2px 6px 2px rgba(0,0,0,0.10)` for the lift. The alphas are M3's 0.30/0.15 taken down, the spec value reading as a firm edge at 360px where the ask was for a slight lift. Two things it depends on, both easy to undo by accident: it sits on the **slot**, not on `ChipStrip`, because the slot's `overflow-hidden` — there to clip the strip as it slides away — crops a shadow cast from inside it; and the header block carries **`relative z-20`**, because the scroller is a later sibling and paints over an unpositioned shadow, which is how the first attempt shipped invisible. It drops when the strip hides and in A when the strip is empty — `stripElevated`, written against `chips.length` rather than the measured height so server and client agree. M3 would use elevation *or* a divider; this carries both, the rule having been asked for a day earlier<br><br>**Taken down again on 2026-08-28**, on the report that it still read as too much. The alphas are now halved twice from the spec — M3's 0.30/0.15 → 0.18/0.10 on 08-21 → **0.09/0.05** — and the ambient layer's **2px spread is gone**, which is what was casting a visible grey band under the strip rather than a lift. It can go this light precisely because the elevation was never the only thing marking the edge: the 1px `hairline` rule on `ChipStrip` arrived the same day. M3 would use one or the other and this app was asked for both, so with the rule saying *where the band stops*, the shadow only has to say *that it is above the listing* |
| Strip rule | A **1px `hairline` (#cccccc) border under the chip strip**, edge to edge (2026-08-21). White chips on a white strip over a white listing left the controls floating with nothing to say where the band stopped. It lives on `ChipStrip` itself, so every screen that has a strip gets it from one place — B, D and `/userjourney`, and A and C by inheritance; a flag there would fork the row all of them share. `border-b` rather than a child rule, because the strip scrolls horizontally and a border doesn't scroll with its contents. In A the strip collapses when there are no chips, and the rule goes with it |
| Contextual chips | The strip answers whichever question is still open. **Not inside a single product vertical** — none picked or several — it offers the verticals. **Inside exactly one** the picked vertical *stays*, leading the strip, followed by Price then Seller Offer, Cashback and Free Delivery. Logic is in `lib/filters/contextChips.ts`, kept pure and apart from the markup because the selection rule is the interesting part; `ContextChip` is a union carrying its `kind`, since the three render very differently.<br><br>**`/userjourney` opts out of verticals entirely** (2026-08-28, on the stakeholder review): `verticalChips={false}` on `PlpScreen`, so that strip is Price · Seller Offer · Cashback · Free Delivery from the first paint — the chips that would otherwise wait behind a vertical being settled. A buyer already inside a storefront hasn't come to choose a garment type. **The picked chip goes too**, not just the offered ones, so the strip carries no vertical in any state; the cost, accepted on the call, is that after *Gender → Women* nothing on the listing names the cut and the Filters count badge is the only report of it. That is a knowing regression of UX backlog item 1. **A and B keep their chips** and C and D never had any, so the 2×2 is untouched and this is the journey's second behavioural departure. It is deliberately **not** `locked` mode, which would also take Category and Gender off the rail — Gender is this journey's central cut and what settles the vertical that puts Size there. A test pins both halves: no vertical chip with nothing picked, and none with one picked |
| Vertical chip | **Figma `674:4904`** — pull it, don't infer it from the M3 spec. Unselected: white, a **1px** `#4d4d4d` border, label Roboto Medium at `black/90` and 74% opacity, the same treatment `TopChipBar`'s chips use. The frame says **0.5px** and that is a deliberate departure (2026-08-25): every other chip in the strip carries 1px of the same colour, so at half the width this one read visibly lighter than its neighbours. The frame drew this chip alone and never in this row — the same argument as *One radius per row*, one border weight across a strip or the odd one out reads as a mistake rather than a distinction. Selected: no border, filled, label in primary, and **a leading checkmark where the thumbnail was** (2026-08-25). It had been the strip's exception — it kept its picture and hung a ✕ off the end, so selection looked like a different mechanism depending on which chip you tapped. Now it is the offer chips' selected state exactly: M3's rule that the check *replaces* the leading element rather than joining it, one leading element in either state. **The ✕ went too.** It was the documented "way back out", but the chip has always toggled on tap and the ✕ sat inside the same button — decorative, a second signal for one action, and the other half of what made these states look unlike their neighbours'. Filled plus a check says selected here as it does on Cashback. It also buys room: 154px → **138px**, and since the picked vertical *leads* the strip that width goes to the chips behind it. `close-small.svg` is drawn by nothing now but kept, both as part of the design library and because it ships with `#0A57FF` baked in — anything that draws it again needs `MaskIcon`, not an `<img>` |
| Chip thumbnail | **Square-cropped and full-bleed** (2026-08-14), against the frame, which draws a circular 26.727 × 27.796 avatar inside a 6px inset. It fills the chip's whole height and sits flush to the leading edge; `overflow-hidden` on the chip clips its corners. The chip's height *is* the image size, which is what forced the scale-up below |
| Strip scale | **44px, every chip, both variants** (2026-08-14) — up from the frames' 32, so the thumbnail is large enough to identify a garment; it also puts these on the 44px touch floor. `CHIP_H` in `ContextChips.tsx` is the one number, and `TopChipBar` **imports** it rather than repeating it, because two heights in one scrolling row is the thing that looks broken. **The label box tracks the label's type size**, because it has to stay wide enough that the longest vertical name breaks to two lines rather than clamping: the frame's 68px at 11px became 76px at 12px, 82px at 13px, and is **94px at 15px** (2026-08-25). `Men's Casual T-Shirts` is the name that decides it<br><br>**40px where the strip carries no vertical chip** (2026-08-28, on request) — `/userjourney`, which dropped them. The thumbnail *was* the reason for 44, so with no image in the row there is nothing to size around. **40 and not the frame's 32**: the picture was only half the argument, and the other half — a kirana retailer tapping a chip on a mid-range Android — survives it going, where 32 would put every chip in the row under the touch floor to save 8px once. `CHIP_H` split into `CHIP_H_TALL`/`CHIP_H_SHORT` and is now passed down rather than imported, but it is still **one height for the whole row**, chosen once by the screen from `controls.verticalChips` — read off the flag rather than off the current chips, so the row can't change height as the buyer filters. C and D carry no verticals either, the vertical being page scope there; they keep 44 until someone sets the same flag, which is a one-word change. Measured: journey chips 40 and the strip 65px, A/C/D unchanged at 44 and 69 |
| Vertical chip label is 15px | **Raised from 13px on 2026-08-25**, on the report that it read small on a phone. It was the smallest text in its own row by 2px, every other chip in the strip — Sort, Filter, Price, the offers — already being 15. The blocker was never the type but the **label box**, which has to be wide enough that `Men's Casual T-Shirts` breaks to two lines rather than clamping: 68px at 11, 76 at 12, 82 at 13, **94 at 15**. Measured rather than scaled — rendered at Roboto Medium it needs 91px, and the ~3px of slack every earlier figure carried is kept. Two lines at 15px is 34px, inside `CHIP_H`'s 44, so **the chip does not grow and the 44px thumbnail is unchanged**: the image is the chip's height, and that height is shared with every other chip in the row. Verified at 360px — all seven names set whole, no clamping, one height. `components/plp/ContextChips.tsx:174` |
| Chip blues are slips | The frame exports the fill as `rgba(21,95,255,0.2)` and the label and glyph as `#0a57ff`. Both are the usual off-token slip: that fill over white is exactly `primary/subtle` (#CCDCFE), and `#0a57ff` is `primary` (#004FFA). Use the tokens. `close-small.svg` ships with `#0A57FF` baked in, so it renders through `MaskIcon` rather than an `<img>` |
| Price chip | One chip opening a **bottom sheet** over the bands, not a chip per band. It was an anchored dropdown until **2026-08-20**, when it moved onto the `Sheet` shell Sort already uses, on request — one way of opening things in the strip rather than two. **No glyph column**, unlike Sort: these are checkboxes and the box is the row's leading element, which is also why the rows are the Filters screen's own `OptionRow` — Price Range is a rail facet whose panel is a list of exactly these, and the same control in two places shouldn't be drawn twice. Counts come with them. Multi-select, each tap applying live, and it **stays open** where Sort commits and closes, Sort holding a single value; dismissal is the scrim, the ✕ or Escape, all three the shell's. The closed chip carries the state — the band's own name for one, `Price (n)` beyond that. What went with the dropdown: rendering at the screen root to escape the strip's `overflow-x-auto`, the `left`/`top` measured against the frame, the clamp keeping a right-scrolled chip's menu on screen, `MENU_WIDTH`, and `PlpScreen`'s `rootRef`<br><br>**Off on `/userjourney`** (2026-08-28, `controls.priceChip`): the strip there is the three offer chips alone. Price Range is a rail facet as well, so the bands stay reachable in the Filters panel — which is the reason this is allowed where switching off a chip-only facet would not be. |
| Seller Offer | Means *any offer at all*, and is its own facet (`hasOffer`), not a fifth option inside `offers`. Inside it, OR-within-a-facet would make Seller Offer **widen** a Cashback selection; as a separate facet they AND. It is listed in the Offers rail entry alongside `offers` — a chip-only facet would survive Clear Filters and go uncounted, with no control left to undo it once the strip changes |
| Chip icons | Supplied PNGs in a **26px `object-contain` box**, leading the chip with a **4px** gap. A box rather than a fixed height, because the three are different aspects: sizing by height left the square one 20px on its longest edge while the two landscape ones reached 26, and the longest edge is what the eye compares — half M3's 8dp, which read loose against an icon wider than the checkmark and carrying its own padding; the checkmark keeps 8px (2026-08-19). **Material 3: the checkmark replaces it when selected** rather than joining it, so the chip has one leading element in either state and the label never shifts; the 8px inset now applies whenever anything leads. **The vertical chips follow the same rule since 2026-08-25**, their 44px thumbnail giving way to the same glyph — which is why it lives in one `CheckGlyph` rather than being drawn twice. They live in `public/offers/`, not `public/figma/` — the latter is Figma exports only and a folder shouldn't imply an origin the file doesn't have. All three offer chips carry art, and so does Price. The offer chips lose theirs when selected, the checkmark taking its place per M3; **Price keeps its icon in both states**, having no checkmark to make room for — its state is the fill and the label. `ChipIcon` is the one place the box is declared. The map in `ContextChips.tsx` is keyed by **facet and option**, not option alone, because Seller Offer's option id is the bare `any` — a one-word id another facet could plausibly acquire later. `cashback.png` (48×37) and `seller-offer.png` (48×48) have almost no headroom above the 20px they render at and **want vectors**; `free-delivery.png` at 416×312 has room to spare. `price.png` was replaced on **2026-08-20** with a supplied bare ₹ — 48×48, transparent, ink 27×38, drawn in `#004FFA`, which is the `primary` token exactly — where it had been a filled blue disc with a white ₹ knocked out of it. Being monochrome and on-token it is the one chip icon that could go through `MaskIcon` if it ever has to tint; it doesn't today, since the chip keeps its icon in both states and blue reads on `primary/subtle` as well as on white<br><br>**Four chips since 2026-08-28**, and the order interleaves the two offer facets — Cashback · Seller Offer · SOLV Target Scheme · Free Delivery — so `OFFER_CHIPS` lists one chip per line, facet and option together, where it used to be one entry per facet with an `only` filter. That shape could order the facets but never interleave them. Each facet's discriminating options are computed once and looked up, rather than once per chip. **It had no art at first** — it is being supplied. The chip renders correctly without it, `icon` being optional, and the commented line in `OFFER_ICONS` makes dropping the file in a one-line change. The old `gold-*.svg` exports are **not** the fallback: they went with the branding on 08-19 **`solv-target-scheme.png` arrived hours later** — a blue ring under an orange arc, 240×240 with alpha, and the one offer icon with real headroom: it draws at 20px in the 26px box, where `cashback.png` (48×37) and `seller-offer.png` (48×48) have almost none and are logged as wanting vectors. Like the others it is in `public/offers/`, not `public/figma/`, having no Figma origin. All four offer chips carry art again |
| Chips that filter nothing | The four offer chips use `discriminatingOptions`: shown only when some but **not all** products in scope carry the offer. An offer everything already has is a dead control. Deliberately **not** applied to price bands or verticals — a narrow catalog where one band holds everything would otherwise be left with an empty menu, and zero-count options already drop out |
| Chip design | **Material 3** as instructed. Offer chips are filter chips: 8dp corner, 1dp outline unselected, filled with a leading checkmark when selected, 16dp label padding dropping to 8dp beside any leading element, Medium — at **15px**, one departure from M3's 14sp, per *Type scale*. All three now carry a leading icon too — see *Chip icons*. Height departs from M3's 32dp — see *Strip scale*. Vertical chips are input chips (see above). Palette is this app's (`primary/subtle`, `primary/default`), not M3's. No counts on chip labels — they're in the Price menu, where there's room<br><br>**The offer chips' corner is `999px` since 2026-08-28**, a second departure from M3's 8dp on top of the height one. Asked for so they read as a different kind of control from Filter — see *One radius per row* for the rule it draws and why Price is on the other side of it |
| One radius per row | **8px, everywhere in the top strip** (2026-08-14). The vertical chip's own 4px (Figma `674:4904`) and `TopChipBar`'s rounded-100 pills (Figma `644:4011`) both gave way to it, because all three chip kinds share one scrolling row in B and three radii a gap apart read as a mistake rather than a distinction. This settles the mismatch that was left open for the designer. Each is one value to reverse<br><br>**Two radii from 2026-08-28, and that is not the thing this rule forbade.** The four offer chips go to `999px`; Sort, Filter, Price and the vertical chip keep 8px. What made three radii read as a mistake in 08-14 was that they meant nothing — the same kind of chip drawn three ways because three frames disagreed. This one carries a rule you can state and then read off the strip: **a pill toggles a filter value in place, a corner opens a surface.** Price keeps its corner on exactly that test, being a chip that opens a sheet rather than one that toggles — and it sits beside Filter on the far side of the frame's own divider, which already draws the same boundary. The vertical chip keeps 8px too: it is the strip's only chip with a full-bleed square thumbnail flush to its leading edge, and a full radius clips that photo to a half-moon |
| The ✕ green | `#2e9e42`, chosen rather than measured: the reference was a screenshot, not a Figma node. Darker than the app's `#39B54A` deliberately, so the white glyph clears 3:1 against it — `#39B54A` would land near 2.7:1 and join the contrast problems already logged |
| Applied state cue | Carried by whichever control owns the filter. One value → a **dot** (Sort). Many → a **count** (Filters). On the top chips, **the count replaces the glyph** and the dot sits on it (2026-08-21). Three placements were tried in order: after the label, which cost the chip 21px of a horizontally scrolling strip the moment a count appeared (`Filter` 85 → 106px, measured) and made it change width as filters were applied; on the glyph, which covered the funnel and read as clutter; and in the glyph's place, which is where it stayed. A one-digit count is **3px narrower** than the icon it stands in for, two digits the same width, so the chip holds 86–89px in every state. The chip still says `Filter` beside it, so the glyph was never what carried the meaning — the number is. Sort keeps its glyph with the dot on it: one value, so there is no number to swap in. The chip's gap went 4 → 8px, the leading element now sometimes being a filled counter rather than a line glyph. Since 2026-08-19 the Filters count is simply every selected option, category included: nothing else carries a badge, so nothing is double-reported and the old exclusion is gone |
| Clear Filters | **Commits and closes** (2026-08-25). It used to edit the draft and stop there, so the button that says it clears your filters left the listing untouched behind a screen you still had to dismiss through `Show N results` — the one control on that screen whose effect you couldn't see, which is why clearing read as broken. Clearing is a complete instruction, not a partial edit: there is no half-cleared state left to refine, so a second confirmation is a step with nothing in it. It goes out through the **same `onApply`** the primary CTA uses, so `commit` drops orphans, rewrites the URL and scrolls the list to the top. Draft edits made before the tap go with it, that being what clearing means. The cost, accepted: re-picking from scratch means reopening the screen. `clearDisabled` still reads the **draft**, so the button is dead when there is nothing on screen to clear.<br><br>**It says `All filters cleared`** (also 2026-08-25). Landing on a full listing is ambiguous on its own — a buyer who has just cleared four filters and one dumped somewhere by a bug see the same screen — so the toast is the difference. `onCleared` is its own callback rather than a flag on `onApply`, because the two are different events sharing a code path: a draft the buyer built and then committed needs no narration, and stays silent. See *Which events speak* |
| Clear Filters scope | Clears only facets in `getRailFacetIds()`, read from the **draft about to be cleared** — so inside a settled vertical Size and the attribute block go too, and in C and D the page's own vertical survives, never having been a selection. That is every facet the screen shows, category included; the exception that spared category in A went with the bottom-bar slot, since wiping a filter from a screen that never showed it is a silent surprise and the screen shows it now. Expressed as a filter over the rail rather than a blanket reset, so it still holds if the rails ever diverge again — `clearSelections` in `engine.ts` is the one place it is written, shared by the screen and its test<br><br>**It resets Sort in every variant**, not only where Sort lives on that screen. Written for `/userjourney` on 2026-08-28 as a deliberate stretch of the label — the button returns the screen to its untouched state rather than leaving one row of it standing — but the commit is `onApply(cleared, DEFAULT_SORT)` unconditionally, so a sort set from A's pill or B's chip goes with the filters too. Recorded here as *measured on 2026-09-03* (`?gender=men&sort=margin_desc` in B → Clear Filters → a bare URL), because the row previously claimed A–D were untouched and they never were. Whether Clear **Filters** should reach a control that isn't a filter is a live question — backlog item 14, left as behaviour rather than changed under a Sort-placement request.<br><br>**Plus `clearsAlso`** (2026-08-28) — facets the *listing* shows that the rail doesn't. Normally empty, and the exception is narrow: it is still a named set, never a blanket reset. `/userjourney` dropped the Offers rail row while keeping the three offer chips, so without this `All filters cleared` would close onto a lit Cashback chip. `PlpScreen` derives it from the chips actually on the strip, so a facet that gains or loses a chip needs nothing changed. They are deliberately **not** added to `filterCount`: a lit chip already reports itself, and counting it on the Filters badge as well is the double-reporting that rule exists to prevent |
| Sheet motion | Asymmetric: enter 260ms `cubic-bezier(.05,.7,.1,1)` (decelerate), exit 200ms `cubic-bezier(.3,0,.8,.15)` (accelerate); scrim 200/160ms. `Sheet` owns dismissal — `onClose` fires on `animationend`, and rows and footers get the animated close via a render prop. `prefers-reduced-motion` collapses all four to 1ms |
| The Filters screen fades and rises | **32px and a full fade**, `animate-screen-in`/`-out` (2026-08-25). It shipped that morning on the sheets' own `sheet-in`/`-out`, on the reasoning that a panel pinned to `inset-0` makes their `translateY(100%)` exactly the frame's height — which it does, and that was the problem: **800px of literal travel reads as an elevator ride** where the same 260ms over a 300px sheet reads as a sheet. Alpha should carry the arrival and the distance should only name the direction, which is the trade `dialog-in` already makes one property over, scaling 8% rather than growing from nothing. 32px is M3's 30dp for a full-screen surface, rounded onto the 8px grid this app spaces everything else by. **Durations are the scrim's 200/160, not the sheets' 260/200** — what this animation mostly does now is change an alpha, and the scrim is where the app already declares how long that takes; the easing stays the emphasized pair, something still moving however little. It still *rises*, so it still answers the pill at the foot of A and C, at a twenty-fifth of the movement; in B and D the chip is at the top and the connection is looser, but one screen with two motions depending on which control opened it is the worse answer. Measured: opaque by ~95ms, so the window where panel and listing are both visible is under a tenth of a second. `.device-screen` is `overflow: hidden` regardless, which is what kept the old full-height version from spilling past the mockup<br><br>**On `/userjourney` it is a bottom sheet instead** (2026-08-28), 80% of the frame, and it takes `sheet-in`/`-out` back. That is not a reversal: the argument above is about *distance*, and 800px of travel is what made the sheet motion wrong for a full-bleed panel. At 640px the distance is a sheet's own height again, which is what that keyframe was written for. A–D are unchanged. |
| Sort sheet | No footer, commits on tap, because it holds one value. It is the only bottom sheet left — the Category sheet, which had the `Clear all` / `Show N results` footer because it held many, went with A's bar slot on 2026-08-19 |
| Discarded drafts | The **Filters screen** (✕) is now the only draft surface, and fires a **`Selection discarded`** toast when dismissed mid-edit. It fires **only when something would actually be lost**: untouched, or edited back to where it started, stays silent, and so does applying. The check is `sameSelections`, which treats an absent key and an empty array alike and ignores option order. The string stays a named constant so a second draft surface can't word the same event differently |
| Which events speak | Three exits, and they don't all say something (2026-08-25). **✕ mid-edit → `Selection discarded`**, a *warning*: edits vanished where nobody could see them go. **Clear Filters → `All filters cleared`**, a *confirmation*: the screen closes onto a listing that looks identical to one nobody filtered, and the toast is what names the difference. **`Show N results` → nothing**, because a buyer who built a draft and committed it is already watching the result they asked for. Same component, opposite jobs, which is why the cleared wording is flat rather than apologetic. Both strings are named constants in `PlpScreen` — and `CLEARED` covers **two** controls, the Filters footer and the zero-results state's recovery button, since they do the same thing and so must say the same thing<br><br>**A third, added 2026-08-28**: `Min price can't be higher than max`, a *warning* like the ✕'s. The listing behind gives no sign that anything was refused — the draft never took the value, so nothing moved — which is the same shape of problem as a discard. It fires on blur, and while the Filters sheet is up it sits **8px above that sheet's footer** rather than at the listing's offset, where it would cover the `Show N results` it is talking about. All three strings are named constants in `PlpScreen`. |
| Where the discard check hangs | The Filters screen has no `Sheet` — it is full-bleed and has no scrim to own — so it carries its own `exit`, and only the ✕ passes a discard check through it; the other two commit what they hold and need no `applied` guard. It compares against a **frozen snapshot** of what the screen opened with — comparing against the live `selections` prop fails, because applying updates it while the component is still mounted |
| `exit` has two sides | The Filters screen's one way out takes `commit` and `announce`, and they sit deliberately on **different sides of the animation** (2026-08-25). `commit` runs at once, because the listing is hidden behind an opaque panel for the whole 200ms and should already show the answer when uncovered — applying after means a frame of the old list and then a jump. `announce` waits, a toast behind that panel being a toast nobody sees, and its 2,600ms no better for losing the first 200 of them. A `closing` guard sits at the top: the footer stays live while the panel travels, so a second tap would otherwise queue a second commit against a screen already leaving. **The unmount is `onAnimationEnd`**, which is why the reduced-motion rule sets 1ms rather than removing the animation — with no animation there is no end, and the panel would strand on screen forever. Verified under `prefers-reduced-motion: reduce`, all three exits |
| Toast | Not in the designs — `components/ui/Toast.tsx`, a dark pill near the bottom. Its lifetime *is* its CSS animation (`.animate-toast`, 2600ms: rise, hold, fade) and `animationend` unmounts it, so the duration lives in one place rather than in keyframes plus a `setTimeout` free to drift. Under `prefers-reduced-motion` it swaps to a fade-only keyframe **at the same duration** — collapsing to 1ms like the sheets do would make it unreadable. The wrapper centres and the pill animates, because a keyframe `transform` would otherwise wipe out a centring `-translate-x-1/2`. Keyed by an incrementing id in `PlpScreen` so firing twice replays the animation.<br><br>**It clears whatever is actually at the foot** (`toastBottom` in `PlpScreen`, 2026-08-28), which is the pill in A and C, the basket bar in B, D and the journey, both, or neither: `foot + 8`, or a 24px frame inset when there is no foot. It used to ask the *variant* instead — `clearsBottomBar`, 72px in A to clear a full-width bar and 24px in B, which had none — and **both of those premises expired on 2026-08-21**, when A's bar became a floating pill that rides the basket bar and every listing started carrying a basket. That left two ways to hide a toast, and moving the journey onto top chips would have shipped the second: in **A and C with a line in the basket** the pill climbs to 76–128 while the toast stayed at 72–104, coming up *behind* the control; in **B, D and the journey with a line** the 64px basket bar covered a toast at 24–56 outright — every clear, on the one route whose whole flow is filling a basket. Reading the foot lands on the same 72 and 24 in the two cases that were already right and moves only the two that were broken. The 8px is the pill clearance as measured — not overlapping, but tight, and it matters more since 2026-08-25 made a toast something a buyer sees on every clear rather than only on a discard. Two dark pills 8px apart; open it up if it reads as one stack<br><br>**The Filters sheet is a foot of its own while it is up** (2026-08-28). It covers the bottom 80% of the frame, so a toast at the listing's offset lands over the sheet's own footer. It blocks nothing, the wrapper being `pointer-events-none`, but covering the control being talked about is the wrong place to say it — so the offset becomes `ACTION_FOOTER_H + 8`. Sheet presentation only: A–D's full-bleed screen has no listing behind it, and both of its announcing exits close before they speak. |
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
| Rail order | Follows a **reference apparel PLP** (screengrabbed 2026-08-19), not the Figma frame, which sequenced these rows before most of them existed and has no opinion on the ten it never drew: Category · Gender · Brands · Size · Colour · Fabric · Price · Margin · MOQ · Delivery · Offers · Seller · Seller City · *[vertical block]* · More Filters. Departures, all where the reference has no equivalent — **Category and Gender lead**, ahead of Brands: the reference has no category filter at all, being already inside one (exactly C and D, where both rows go), and puts Gender fourth; together they settle who the garment is for, which comes before picking a label off it. **Neck Type and Closure Type** trail the three attributes the reference does carry; **Margin** sits with Price; **Seller/Seller City** land with the commercial filters; **More Filters** stays last. One ordered `RAIL_ORDER` array with `only`/`vertical`/`notVertical` flags, not a base plus insertions — slicing around a block was what would quietly misplace a row. Pinned by a test in full<br><br>**`/userjourney` has its own order** (2026-08-28, from the stakeholder whiteboard): Sort · Price · Margin · MOQ · Category · Brands · Seller · Seller City, then the attribute block — Colour · Fabric · Size · Fit · Neck · Sleeve · Pattern · Closure. A second array (`JOURNEY_RAIL_ORDER`), not a re-order of the first: A–D keep the reference-PLP order and the two are allowed to disagree, the journey never having been part of the 2×2. **Six rows dropped** — Gender, Delivery Time, Offers, More Filters, and (2026-09-03) **Seller and Seller City**: this route is one seller's storefront, so both rows are dead controls by the same test that took Gender off C and D's rail. Measured against `getKartikCatalog()` rather than reasoned — Seller counts *no* options at all, Kartik being his own `Seller` and not one of `SELLERS`' eight, so every option is a hidden zero; Seller City counts exactly one, Tiruppur 540, which is all of them. Neither takes a `clearsAlso` entry the way Offers does, nothing on the listing selecting them, so there is no lit chip for `All filters cleared` to close onto; the only case left is a hand-written `?seller=grasim`, which no click can reach and which empties the listing — and the empty state's own Clear Filters commits `{}` rather than the rail's scope, so it clears that too and the URL goes bare (verified). *"Attributes"* is **eight rows, not one**, settled on the call: the note grouped them by position, and one merged row would have stacked ~60 options behind a single entry and earned a search field. Colour and Fabric sit in that block but stay visible whether or not a vertical is settled — Cotton means the same on a shirt as on a tee, which is why Fabric never joined the vertical block. `getRail`/`getRailFacetIds` take a `RailPreset` name rather than an array, so the orders and the tests that pin them stay in `facets.ts` and nothing has to cross the Server/Client boundary. Pinned in full by a test, like the default |
| The block trails the commercial rows | **A departure from the reference** (2026-08-19), which interleaves Fit, Pattern and Sleeve Type up beside Fabric. Interleaved, five rows arriving mid-rail pushed **Price Range from 6th to 12th** and below the fold, so picking a vertical handed back a rail the buyer hadn't learned — the complaint that prompted this. The block moved past Seller City instead, which holds every commercial row still. **Gender leaving and Size arriving then cancel exactly**, so Colour through Seller City sit at the *same index* in both states — ten rows that don't move, with Brands the only one that shifts, up one into Gender's slot. Size stayed put rather than joining the block: it reads as a garment basic beside Brands and Colour, and moving it would have re-broken the alignment it now provides. A test pins the held indices, not just the sequence |
| Vertical as scope, not filter | In C and D the vertical is **page scope**, exactly as the seller already was: `products` arrives pre-scoped and `category` is never a selection. That is what lets the Category row leave the rail without stranding a filter no control can undo. `VerticalMode` threads through `getRail`, `getRailFacetIds`, `dropOrphanedSelections`, `contextChips` and `parseSelections` — the last two matter most, since the strip must not offer a vertical it can't remove and a hand-edited `?category=` must not empty the page. |
| C/D app bar | **No home button, title at 18px.** The two travel together: dropping the button frees 36px, which the title needs because the frame's 20px was sized for a seller name — *Men's Casual T-Shirts* measures 191px against the 157px the full bar leaves, and 172px against the 193px it leaves without home. Measured, not guessed; all seven category labels fit. A and B are untouched at 20px with their home button |
| Gender in C and D | **Gone too** (2026-08-19). Category → gender is 1:1, so one vertical is one gender and the row could only offer the single value every product in scope already has — a dead control by the same test `discriminatingOptions` applies to the offer chips. `?gender=` is stripped on those pages for the same reason `?category=` is: no control to show or undo it, and the wrong audience would empty the page. C and D's rail is **17 rows** |
| Floating mic | `components/ui/MicFab.tsx`, on the journey home **and every PLP** (2026-08-20, on request) — the live app floats one over its listings and it is in three of the four screengrabs. **Inert and `pointer-events-none`**, so taps fall through to the card beneath: there is no voice search behind it and a button that opens nothing is worse than one that plainly does nothing. Measured at 3× rather than eyeballed — 47px circle, 2px `#023d8c` ring, 13 × 21 glyph, 20px in from the right, 78px up from the bottom of the frame. The home's own had been eyeballed at 54px and 18px up, a seventh too big and 60px too low; it takes the measured pair too, one mic being one geometry. 78px also clears both bars this app puts at a listing's foot — A and C's 72px control bar and the journey's basket bar — which is why the PLP anchors it to the frame and not to whatever sits under the list. `z-30`, below the sheets and the Filters screen. **78 is not a free number — it is `PILL_GAP + PILL_H + MIC_GAP`, i.e. 14px above the floating pill**, which went unnoticed while the pill had one resting place and broke on 2026-08-25 when the journey moved onto it: the pill rides above the basket bar at 76–128 and a mic fixed at 78–125 lands inside it, overlapping 7px of x over the pill's whole height. Latent in A and C too, `CartProvider` being global. `MicFab` now takes `bottom` and `PlpScreen` passes the pill's own offset, so it is 78 wherever it was 78 and moves only when the pill does; the home screens have no pill and keep the default |
| Sort chip glyph | **`sort.svg`** — the `SortAscending` the bottom bar already carries — not the frame's caret (2026-08-20, on request). A caret says only that something opens, where `funnel.svg` beside it names its control; and using the bar's own glyph leaves B and D differing from A and C in control *placement* alone, which is the whole point of the comparison |
| Filters panel width | **The remaining width, not a fixed 240** (2026-08-21). The frame draws 120 + 240 = 360 and both were fixed, which is exact at the design width and wrong on any phone that isn't: `DeviceFrame` renders edge to edge below 480px, so a 390 or 430px screen left 30–70px of dead white beside the tiles. The **rail keeps its designed 120** — its labels are set to it — and the panel takes the rest, which is what a native layout does and agrees with the frame at exactly 360. Everything inside is width-agnostic, so the only visible effect is bigger tiles. `panelFit.ts` still computes against a 240px panel, three tiles across at 105px: it decides what the **server** renders, and the server has no viewport. Exact at 360 and slightly optimistic beyond it — columns stay three and the square tiles grow, so rows run taller than 105 and a long panel can overflow where it said it wouldn't. The cost is a missing search field on a wide phone, on a list that still scrolls; measuring instead means no field on the server and one appearing after hydration, which is the 56px shift the rule exists to avoid |
| Filters header icon | `filter_alt.svg` at **24px**, 8px before the heading (2026-08-19). 24 is the export's own size — it went in at 18 and read as an afterthought, and downscaling resampled a thin glyph for no reason — the same glyph the Filters control carries, so the screen reads as the one that button opened. Not in the frame, which has the heading alone. Black in the export, which is the heading's colour, so no `MaskIcon` tint. B and D's chip uses `funnel.svg` instead, an inconsistency the frames already had |
| GOLD removed | The membership strip and the `GOLD Target Scheme` tag both went on 2026-08-19, with `GoldStrip.tsx`, `GoldGlyph`, the three `gold-*.svg` exports, the `.gold-text` gradient, its seven tokens and the Rowdies font. **The offer is still drawn.** `OFFERS.filter` runs its predicate once per entry, so deleting the row would have taken a `rand()` out of the middle of the sequence and re-rolled the whole catalog; it carries `retired: true` instead, is discarded after the draw, and is filtered out of the facet's options so no permanently-empty row appears. Verified: every documented count unchanged, and no product carries a GOLD offer<br><br>**SOLV Target Scheme came back on 2026-08-28**, on request — it shipped as plain *Target Scheme* for an hour and took the brand back the same day. The GOLD prefix went with that branding and SOLV takes its place: the scheme is the app's own, not a membership tier's, and the caps match the brand everywhere else here and the `GOLD Target Scheme` it replaces. The rename moved the slug to `solv-target-scheme` and no count with it — `p.offers` stores the name and the draw is upstream of it. **This is what `retired` was for.** Retiring never meant deleting: the entry stayed, its `rand()` was still spent and the result discarded, so reviving it moves **no draw and no count that doesn't involve offers**. Measured before and after: `Bulk Offer 450`, `Cashback 245`, `Free Delivery 165` identical in the main catalog and `239 / 104 / 75` in Kartik's. What changes is the point of it — `SOLV Target Scheme` appears at 573 (296 in Kartik's) and `Seller Offer` grows 674 → 875 (331 → 440), since products whose only offer was this one had none before. `OFFERS` is now **explicitly typed** so `retired?: true` survives having no user: inferred, the property would vanish from the array's type and the next retirement wouldn't compile |
| Sort inside the Filters screen | **`/userjourney` only** (2026-08-28, on the stakeholder review) and **reversed on 2026-09-03**, when Sort was asked back onto the chip strip beside Filter — so nothing passes `sortInFilters` today and the machinery below is dormant, kept because it is the only version of this control whose sort can be drafted. As built: *Sort By* is the **first row of the Filters rail**, above Category, and its panel is the five `SORT_OPTIONS` as single-select `SortRow`s — no checkbox, since every other row on that screen is a set and a checkbox would promise a second tick; the Sort sheet's own active treatment instead (glyph leads, active row bold, primary, icon tinted), at `OptionRow`'s 52px so the panel keeps one row pitch. **It joins the draft**: a tap re-sorts nothing until `Show N results`, the ✕ discards it and says so, and Clear Filters returns it to Popularity. The rail row carries a **dot**, not a count, per *Applied state cue* — one value. Implementation notes worth keeping: the rail id is the synthetic `__sort` with `facetIds: []`, deliberately not a facet id, so every count, clear and lookup path that walks the rail by facet needs no special case; `FilterScreen` takes the current `sort` and **supplying it is what turns the row on**, so there is no way to show the row without its value; and `SORT_ICONS` moved to `lib/filters/sortIcons.ts` because the sheet is no longer the only surface drawing that set. **Honoured on `top-chips` only** — the `bottom-bar` pill is a designed 240px surface with two halves either side of a rule, and a one-control pill is a shape no frame draws, so A and C would need a pill design first |
| Range facets as typed ranges | **`/userjourney` only** — Price from 2026-08-28 (on the stakeholder review — *"we can't predict the exact range the customer might be looking for"*). Two boxes, **above** the five bands rather than instead of them: it shipped as a replacement first and the ask was reversed within the hour. The bands stay the fast path and keep their live counts; the boxes cover what the bands don't. A–D show the bands alone, their Price chip opening a sheet built from exactly those.<br><br>**Bands and ranges are one facet, and exclusive.** Both answer "which prices", and two facets would AND — a buyer who typed 150–450 would have to clear a band to see anything. One facet ORs, which is worse in the other direction: typing 150–450 and then ticking *Under ₹200* would show ₹80 shirts. So each disables the other: a ticked band clears a typed range and greys the boxes, and a typed range greys the bands. **Both directions**, because the exclusivity is one rule, and a rule that only shows itself one way round reads as a quirk of whichever control you happened to touch first. Disabled rather than merely exclusive, on request: the rule was already enforced but silently, so it only became visible after it had cost the buyer their typing — and disabling both ways retires that last silent half, since typing can no longer clear a band without saying so. Greyed rather than hidden: a control that vanishes reads as a bug, and the panel's height stays steady. Both flags are read off the draft, so a hand-written `?price=150-450,p-200` — which no control can produce — still shows a coherent screen rather than a deadlock: the band and the range both apply, and clearing either one hands the other back. The id is plain `150-450`, `800-` or `-450`: it can't collide with a band, every bucket id starting with a letter and a hyphen (`p-200`, `p-max`), and it keeps the URL readable.<br><br>**`min > max` is refused rather than filtered.** It used to match nothing and return `Show 0 results` — accurate, and silent about why. Now the draft never takes it, both boxes take a red border, and a toast names the rule: **on blur, not per keystroke**, or typing `9` into min against a max of 450 scolds you mid-number. It names the rule rather than a field, the app not knowing which of the two the buyer meant to change. The engine still *matches* an inverted range as empty, so a hand-typed `?price=450-150` is honest rather than an error.<br><br>**The boxes hold local text**, not the draft. Controlled straight from the draft they would snap back under the cursor the moment a value was refused. Only a valid pair reaches the draft, and a render-time derive-from-props re-seed empties them when something else clears the range — Clear Filters, or the band they are exclusive with. Not an effect: React 19 flags `setState` in one as a cascading render, and it paints the stale value for a frame first.<br><br>**It cost the registry two optional hooks**, both on Price alone and both kept as registry fields rather than engine special cases, so adding a facet is still one array entry. **`matches`** overrides the default set-membership test, because a typed range is not one of a fixed set of ids and so has nothing for `valuesOf` to return — the alternative was letting `valuesOf` see the price selection, and the standing rule is that Size is the only selection any facet may see. **`accepts`** widens `parseSelections`'s id validation, which otherwise drops anything not in `options`. That second one was **found in the browser, not by reading**: the range filtered correctly in-session and vanished on reload. A facet that overrides `matches` almost certainly needs `accepts` too. The guard itself stays — `?price=junk` is still dropped.<br><br>**Counts are untouched**, which is what still lets the bands show live counts beside an input driving the same facet: `facetOptionsWithCounts` already excludes a facet's own selections, so a typed range can't move them. A test asserts the bands count identically with and without one.<br><br>**Margin on MRP and MOQ joined it on 2026-09-03**, on request and on every argument above unchanged. Three near-identical facets became **one table** — `TYPED_RANGES` in `facets.ts`, the way `PV_ATTRIBUTE_FACETS` is built — because they differ only in the number they compare against (`activeVariant().pricePerPc`, `activeVariant().marginPct`, `p.moq`), and three hand-written copies of `accepts`/`matches` is three chances for one to drift. Three consequences worth recording. **The units differ and their side is not a style choice**: ₹ leads its number, `%` and `pc` follow theirs, which is how all three are written outside software — the map lives in `FilterScreen` beside the panel, not in the registry, on the line this repo already draws for `ContextChips`' icons. **The refusal toast now names the facet** (`Min margin can't be higher than max`), the callback taking the facet's short noun: one shared message that said "price" on a Margin panel was describing a control that wasn't on screen. **`parseTypedRange` gained a one-character gate before its regex** — every band id starts with a letter, so the check exits on the first charCode — because `matches` runs per product per selected value and three facets now carry one: the 720-walk `never lets a visible option lead to an empty page` guard went from ~5s to past its 30s budget on the regex alone, which is the whole reason that slow test exists. The flag is now `controls.rangeInputs`, one for the three: they are the same control answering the same objection, and a route wanting a typed price but banded margins is a screen nobody has asked for |
| Brands panel | Uses the **same layout as Category** — the tile grid until 2026-09-03, a column of thumbnail rows since — not a plain checkbox list |
| Category and Brands as rows | **A column of 60px rows, not the tile grid** (2026-09-03, on request: *"it should be in column view — box, image, name"*). `panel: "thumb"` in the registry, `ThumbRow` in the panel: a checkbox, a 44px picture at the tile's own proportional radius, then the name and its count. **Why it reads better than the grid it replaced**: three cells across a 240px panel gave a name ~72px, so it set as up to three clamped lines under a 56px square, and on one line it truncated — `Women's T-…`, and *Men's Casual Shirts* and *Men's Casual T-Shirts* **both** reading `Men's Casu…`, two rows indistinguishable. A row gives the name the panel's full width, restores the **count** every other row on the screen carries (the tile could only put it in a `title` attribute), and leaves one scanning direction — reading down a rail of rows no longer switches to reading across a grid at these two facets. **The name wraps to two lines rather than truncating**, with the count in the same text run so it wraps too instead of taking 46px off every row; two 20px lines is 40px, inside the 44px the picture already sets, so the row height is fixed and `panelFit` keeps a figure for it (`THUMB_ROW_H`, 12 rows full-bleed / 9 in the sheet, both pinned). At 430px, where `DeviceFrame` goes edge to edge, every name sets on one line — the width goes to the label, as it did for the grid. **The checkbox carries the selection**, not the tile's ring-and-veil-and-check: the row is now the same shape as every other multi-select row on the screen, so it says so the same way, with Colour's dot as the precedent for a leading ornament that doesn't restate the box. Brands keep the flat `#d9d9d9` box, no logos having been sourced. `TileGrid` is **retained with no caller** — the frame is still the design of record and this is the third layout call of the week; delete it if a month passes without one |
| Tile grid | Figma frame `Category` (`638:3696`) drawn at **72×105**, not the frame's 68×96 (2026-08-21): 56px square at radius 9.333, 3px gaps, 10px left inset, three across. **The grid changed so the label could**: 11px read as small beside its own photograph, and 11px was itself a fit to the 68px cell — `Men's Formal` measures ~66px there and clears 68 at 12px, so a two-line clamp ellipsised the third word. The cell took 4px off the insets and gap to reach 72 and the label box grew to a **fixed 45px three-line box** at 13px — reserved even for one-line labels, so tiles on a row bottom out level. Verified by DOM audit: every category and brand label sets whole, nothing clamps, nothing overflows the cell. Three across is preserved, so 10 + 72×3 + 3×2 + 6 = 238 of the panel's 240. Shared by Category and Brands in both variants; change it once. The cell is a **grid column**, not a fixed width — see *Tile grid layouts* for what happens on a phone that isn't 360px. It also moves the search-field threshold — see *Panel search field* |
| Tile grid layouts | **One responsive grid, no `layout` prop** (2026-08-21). There were two: `fixed`, the frame's left-aligned 72px cells, and `fill`, which divided a container's width and was built for the 360px Category sheet that went with A's bar slot — retained-but-unused, with a note to delete it if nothing needed it. Something did, and it turned out to be the same surface: below 480px `DeviceFrame` renders edge to edge, so on a 430px phone the panel is 310px and fixed cells stranded 70px of white beside the tiles. `auto-fill` with a **72px floor and `1fr` columns** lands on the frame's three across at the designed 240 — 10 + 72×3 + 3×2 + 6 = 238 — and spreads to fill anything wider, so the two layouts collapsed into the one that was always the answer. Columns **stretch rather than multiply** at phone widths (three 96px cells at 430px, not four 72px ones), which is the better half of the trade: the extra width goes to the label that the cell was widened for. **The tile grows with the column** — `calc(100% - 16px)`, square — since a flat 56px left 20px of air either side of a photograph at 430px; it lands on 56.67 at the designed 72.67 column, the frame's 56 within a subpixel, so 360px is unchanged. The radius went proportional with it: 9.333 of 56 is **16.667%**, the frame's corner at the design width and the same corner at any other. The cell's height is content rather than the old fixed 105, or a wider phone would clip the label |
| Reserved height vs clamp | They must live on **different elements**. Put `h-[36px]` and `line-clamp-2` on the same span and the explicit height wins, so a three-line label is cropped mid-glyph at 36 of its 39px instead of ellipsised. Wrapper reserves, inner clamps |
| Panel search field | **Earned, not declared** (2026-08-20). The `searchable` flag is deleted; the field appears only when a panel's options overflow the 690px fold, and disappears again when pruning shortens them. All five facets that used to set the flag fit whole, so it was 56px spent searching a visible list. **Colour went 10 → 20 colours** to give the screen one panel that genuinely overflows — safe for the seed because `weightedPick` draws once however long the array is, so no other draw moved and every documented count holds. Thresholds are **14 checkbox rows / 19 tiles** — 22 until the tile row grew from 96 to 105 on 2026-08-21 — computed in `panelFit.ts` rather than measured, because SSR can't measure and the client adding a field post-hydration is a 56px shift on every panel open. The query is dropped with the field, so a hidden control can't go on filtering<br><br>**The sheet presentation has its own fold** — `SHEET_PANEL_VIEWPORT` = 530 (80% of 800, less the same 49px header and 61px footer), giving **11 rows / 13 tiles** where the full-bleed panel gives 14 / 19. `needsSearch` takes the viewport as an argument defaulting to the full-bleed value, so A–D are untouched, and a test pins both pairs. Computed against the *design* height for the reason the width is: the server has no viewport. Exact at 800 and slightly optimistic on a taller phone, which is the cheap way round — a field over a list that happens to fit costs 56px, where the reverse costs the layout shift this module exists to prevent.<br><br>`needsSearch` also takes a **`lead`** — fixed height above the options, today only a range panel's 62px of min/max boxes (`RANGE_INPUTS_H`, renamed from `PRICE_INPUTS_H` when Margin and MOQ gained the same boxes on 2026-09-03). Counted rather than waved through even though five bands and two boxes can't overflow either fold: the rule this module keeps is that a height in the markup has a figure here. It is a panel property, not a facet one, so it is an argument rather than a field on `PanelBlock`. |
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

## Demoing on a phone — the first tap goes fullscreen

`components/ui/FullscreenOnTap.tsx`, mounted in the root layout (2026-08-25).
Renders nothing and shows nothing: on a phone the first tap anywhere requests
fullscreen, so the address bar and the status bar both go and the prototype
reads as an app rather than as a page in a browser.

**It has to be a tap, and that is not a limitation of this code.** The
Fullscreen API requires a user gesture; browsers removed the ability to hide the
address bar on load deliberately, a page that can hide the URL being a page that
can pretend to be another one. The old `window.scrollTo(0, 1)` trick is both
long dead and inapplicable here, the document never scrolling — `.device-screen`
is `100dvh` with its own scrollers inside.

Four things it does on purpose:

- **No UI.** The alternative was a floating expand button, which is chrome in no
  Figma frame sitting on screens stakeholders are meant to be judging. The tap
  they were going to make anyway does it, and still does what it was for: the
  listener never calls `preventDefault`, so the card still opens and the chip
  still filters.
- **`pointerdown`, not `click`** — the earliest event that still carries user
  activation, so the bar is leaving as the finger lands rather than after it
  lifts. Passive; nothing here cancels.
- **Phones only**, by `(pointer: coarse)`. On a desktop the app already sits in
  `DeviceFrame`'s mockup with room to spare, so there is no chrome worth taking,
  and a browser that went fullscreen on the first click of every dev session
  would be its own bug report.
- **The listener stays.** Exiting fullscreen mid-demo is usually accidental — a
  back gesture, a swipe from the edge — so the next tap puts it back. A one-shot
  listener would leave the bar up for the rest of the session. While fullscreen
  it does nothing.

**iPhone Safari is not covered**, and can't be: it implements
`requestFullscreen` on video elements only, never on a document element. The
feature test is what keeps it quiet there rather than throwing. The answer on
iOS is *Add to Home Screen*, which needs a web app manifest this repo doesn't
have — say the word and it's twenty minutes, and it would also remove the tap on
Android.

**What was verified, and what wasn't.** A stubbed `requestFullscreen` confirms
the call is made once on the first tap with `navigationUI: "hide"`, never before
one, never while already fullscreen, again after exiting, and never at all on a
fine pointer — and that the tap still navigates in both cases. Whether Android
Chrome and Firefox then actually hide the bar is the browser's half, and there
is no Android browser in this environment to watch it happen.

## Working style

- Verify visually before claiming something works. Playwright is not a dependency — install it ad hoc (`npm install --no-save playwright`), screenshot at 360px with `deviceScaleFactor: 2–3`, then uninstall. Hide the dev overlay first: it intercepts clicks.
  ```js
  await page.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
  ```
- Badged buttons change their accessible name (`Filters` becomes `3 Filters`), so use regex selectors in tests.
