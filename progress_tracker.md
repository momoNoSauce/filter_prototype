# Progress Tracker

Last updated: 2026-08-28

> **Four docs, one job each.** `CLAUDE.md` — the rules, and the only one loaded
> into every session, so keep it short. `plan.md` — the architecture.
> `docs/decisions.md` — the long-form record of every call and why.
> `progress_tracker.md` — the chronology, the backlog and the open questions.
> The deepest reasoning is in the code comments; a rule changed there must be
> changed in `CLAUDE.md` too.

Live: **https://filterprototype.vercel.app** — **password-protected** since
2026-08-14. **Leave the username blank** and enter the password; only the password is checked. It lives in the `SITE_PASSWORD` env var on Vercel
(`npx vercel env ls --scope bitihotra-karaks-projects` to see it is set; `env
rm` then `env add` to change it, then redeploy — env changes only reach the
site on the next deploy). Redeploy with
`npx vercel --prod --scope bitihotra-karaks-projects`. **The `--scope` is not
optional** — the project belongs to the team, so a bare `vercel --prod` fails
with `Not authorized` even when `vercel whoami` reports you logged in, which
reads as an expired session and isn't one.
Source: **https://github.com/momoNoSauce/filter_prototype** (private).
Transferred from `cheeseKracker` on 2026-08-25; the old path still redirects, so
an existing clone keeps working, but new links should use the one above.
`cheeseKracker` was kept on as a collaborator with **push but not admin**, which
is what lets this machine go on pushing without re-authenticating `gh`.

**Commit attribution needed fixing separately**, and would have gone unnoticed:
the repo moved but `user.email` was still `m23ldx002@iitj.ac.in`, which is
verified on `cheeseKracker`. A GitHub email belongs to exactly one account, so
every commit went on crediting the old one under the new owner's repo. This repo
now commits as `momoNoSauce` via that account's noreply address; the machine's
global config is deliberately untouched, so other projects keep their identity.
Local: `npm run dev` → http://localhost:3000.

> **GitHub and Vercel are not connected.** `vercel --prod` uploads straight from
> the local folder; a `git push` deploys nothing and a deploy commits nothing.
> Both have to be run. Connecting the repo at
> `vercel.com/bitihotra-karaks-projects/filter_prototype/settings/git` collapses
> this to one step — browser-only, the CLI can't do it.

> **The password gate never fires on localhost.** `proxy.ts` keys off `VERCEL`,
> which the platform sets and your machine does not, so `npm run dev` — and a
> local `next build && next start` — are untouched. It is deliberately not
> keyed off `NODE_ENV`, under which a local production server would prompt.
>
> **It fails closed.** A deployment with no `SITE_PASSWORD` serves 503 to
> everything rather than quietly going public, so **set the env var before
> deploying**, not after.

> **`design/` is gitignored.** The source Figma PNGs stay local: unreleased
> design work, and nothing serves them. `public/figma/` and `public/categories/`
> stay tracked — the app needs them at runtime.

## Build log

| # | Task | Status |
|---|---|---|
| 1 | Scaffold Next.js 16 + React 19 + Tailwind v4, Figma tokens, DeviceFrame | ✅ Done |
| 2 | Catalog types + 1,070 deterministic seeded products | ✅ Done |
| 3 | Filter engine + facet registry + unit tests | ✅ Done |
| 4 | PLP shell — AppBar, GoldStrip, ProductCard, set pills, bottom bar | ✅ Done |
| 5 | Sort sheet + Gender sheet | ✅ Done |
| 6 | Filters screen — 12-facet rail, panels, live counts, draft/commit | ✅ Done |
| 7 | Home screen + navigation into the seller PLP | ✅ Done |
| 8 | Zero-results state, Figma comparison pass | ✅ Done |
| 9 | Deploy to Vercel | ✅ Done |

### Review revisions (all shipped)

- Active Sort/Gender row tints its **icon** to primary, not just the label. Sheet row dividers fixed (they were collapsing to zero width under `items-start`).
- Sort/Filter chips and applied-filter chips **removed** from the strip below the GOLD bar — reserved for contextual chips.
- Gender CTA renamed **"Clear all"**; the Filters screen keeps "Clear Filters".
- Brands moved to the **tile grid**, matching Category.
- Gender in Variant B moved **into the Filters rail** (second) as an ordinary multi-select facet, since B has no bottom bar to host it. Variant A keeps it as a single-select bottom-bar sheet. The `single` flag left the facet registry — exclusivity is a property of the control, not the facet.
- Tile grid **enlarged** to the updated Figma frame: 68×96 cells, 56px tile, fixed 36px two-line label.
- **Category tile photos** added (Unsplash).
- Tile selected state: primary ring + 50% primary veil + white check + bold label.
- Gender in Variant A is **single-select, bottom-bar only** — Apply/Clear footer dropped, tap applies and closes, absent from A's rail.
- **Sort dot** when sorted away from Popularity; Gender dot; Filters count (excludes Gender).
- **Bottom sheet enter/exit animation**, asymmetric timing, reduced-motion aware.
- **Category replaced Gender in A's bottom bar** (2026-08-13), as a *multi-select* sheet with a `Clear all` / `Show N results` footer — Gender's tap-applies-and-closes was right for one value, not for many. Category left A's rail so one facet isn't behind two controls. `getRail`/`getRailFacetIds` now take the variant instead of an `includeGender` boolean.
- **Contextual chips built** (2026-08-13), filling the strip that had been reserved and empty since the start. Product-vertical chips until a single vertical is settled; then the picked vertical stays at the head of the strip, followed by Price, Seller Offer, Cashback and Free Delivery. Both variants; in B they follow the divider the frame already draws. New `hasOffer` facet for the catch-all, `Free Shipping` renamed `Free Delivery`, and `discriminatingOptions` hides an offer every product already carries.
- **Vertical chips now come from Figma `674:4904`.** Two earlier cuts were built from a screenshot and then from the M3 spec, both wrong; the frame existed all along and should have been asked for. Actual spec: 32px on a 4px corner, circular 26.7 × 27.8 avatar, 11px two-line label, 0.5px `#4d4d4d` outline unselected, filled with a primary label and the exported `close_small` glyph when selected. Its ✕ is the only way out of a vertical without opening Filters.
  **Note the frame keeps the label when selected**, where the written instruction had said the text should go away. Followed the frame — worth confirming. **Price became a dropdown** rather than a chip per band: an anchored multi-select menu with counts, applying live, rendered at the screen root because the strip's horizontal scroll would clip it.
- **`Selection discarded` toast** (2026-08-13), on **both** draft surfaces. Dismissing the Category sheet or closing the Filters screen mid-edit used to throw the draft away in silence, which reads as the filter being broken. Fires on every dismissal route and only when edits would actually be lost, decided by the shared `sameSelections`. One string across both, on request — it is one event. New `components/ui/Toast.tsx`; lifetime is the CSS animation so the duration is declared once, and the offset follows the variant (72px in A to clear the bar, 24px in B).
- **Category sheet grid rebalanced** to five across (2026-08-13). Left-aligned 68px cells fit only four in the 360px sheet and stranded an empty column at the right; a `fill` layout now divides the width instead — 8px insets, 2px column gap, cells at 67.2px. The 240px filter panel is untouched and still pixel-exact to the frame at three across, 68px. Fixing the width surfaced a real bug: `h-[36px]` and `line-clamp-2` on the same span meant the explicit height beat the clamp, so *Men's Formal Shirts* cropped mid-glyph at three lines rather than ellipsising. The reserved height moved to a wrapper; verified with an over-long label that it now ellipsises cleanly.
- **Gender moved into A's Filters rail**, heading it. It was briefly dropped from A altogether as redundant; put back because it is still a faster cut than ticking three category tiles, and `?gender=` links need somewhere to show. The two rails now differ by exactly one row, Category. The single-select `GenderSheet.tsx` stayed deleted — the bar slot it lived in belongs to Category.
- **Categories replaced** (2026-08-12) with the seven from the merchandising list — Women's T-Shirts, Men's Formal Shirts, Men's Casual T-Shirts, Men's Casual Shirts, Girl's T-Shirts, Boy's Casual Shirts, Boy's Casual T-Shirts. New tile photos, rebuilt brand↔category map, per-category price bands, gender-free product titles.

### 2026-08-14 — the chip strip, and the card measured against the live app

**Chip strip, both variants.** Thumbnails are **square-cropped and full-bleed**, against the frame's circular 26.7 × 27.8 avatar inside a 6px inset. The whole strip then went to **44px** — up from 32 — so the thumbnail is big enough to identify a garment; because it is full-bleed, the chip's height *is* the image size, so nothing else could grow it. `CHIP_H` is now one exported constant that `TopChipBar` imports, since B's chips previously carried their own hardcoded height and could drift. The label rose to 12px in a 76px box, still the width where the longest vertical name breaks to two lines rather than clamping. Side effect worth having: 44px is the first time these clear the touch-target floor, closing backlog item 7 for the strip.

**One radius across the row.** Vertical chips left the frame's 4px and `TopChipBar`'s Sort/Filter left their rounded-100 pills; everything in the strip is now **8px**. This settles the open question the chip work left for the designer (*"say if the pill should win"*) — it doesn't; the shape the majority of the row already carried does. Each is one value to reverse.

**B's Sort/Filter were pinned, then unpinned.** They were briefly held at the head of the row with `position: sticky` while chips scrolled beneath them; reversed the same day, by choice, for the scroll-everything convention other commerce apps use. **The exposure that pin existed to close is now back:** B's only route to Sort and Filters can be scrolled off-screen. The strip is still pinned vertically, so they are one horizontal swipe away rather than lost — but A's fixed bottom bar has no equivalent exposure, so if the variants are ever judged on *could you find the controls*, that asymmetry is part of what is being compared.

**Product card rebuilt from a screengrab of the shipping SOLV app**, which supersedes Figma wherever the two disagree. Format: `MRP/PC ₹299 | SET of: 6` on one pipe-separated line, `PRICE/PC` in caps, pills reading `SET OF 6` over `M/2, L/2, XL/2`. The old line never said the MRP was per piece although it always was, so it read as a pack price and made the margin look wrong. Pack breakups were regenerated as `size/qty` **summing to the set size** — the old table ran three notations at once, one of which (`2XL` for a set of ten) named no quantity at all. Two new tests hold both properties; 47 green.

**The price block was measured, not eyeballed** — the screengrab is 1080×2400, exactly 3× the 360px design, so every device pixel divides cleanly. Margin sits **10px after the price on the same baseline** (identical in both sampled cards, ink bottoms within 0.3px), where it had been a `flex-1` column pushing it ~40px right. Title sets on a **16px** pitch, not 21px. The text column lost its uniform `gap` — its four rows sit at four different distances, so each carries its own measured `mt-`. Verified by re-measuring our own render the same way: title pitch exact, and all three gaps within **0.3px**.

**Two contrast failures closed as a by-product** — see backlog item 2. Not by choosing darker colours, but by sampling the live app, which sets both better than the frame: margin is blue (`primary`, 2.66:1 → **6.0:1**, clears AA) and the secondary grey is `#7f7f7f` (2.85:1 → 4.0:1). Margin measured `#0066ff`, but that same screengrab's app bar is `#004ffa` exactly — our token — so the sampled value is a second blue a hair off brand, and the token is used instead. It also preserves what matters: margin reads in the same blue as a selected set pill.

### 2026-08-18 — Size, a facet that lives on the pack

**The rule, confirmed with the product side rather than assumed.** Sizes sit on the pack, not the product, so a size filter matches a product when **any** of its packs carries a selected size. Ticking M *and* L therefore returns their union — 586, against 412 for M and 450 for L — rather than narrowing to packs carrying both. The ALL-within-one-pack reading was put up alongside it and rejected: this is B2B carton buying, so it was a real question, but ANY is what the engine already does and what was wanted.

**Which pack the card is talking about.** The card opens on the leftmost pack carrying a selected size — pills run in ascending set size, so that is the smallest pack a retailer can buy their size in. Price and margin read **that same pack** for sorting and for the Price Range and Margin facets, which was the second thing settled and the one with teeth: leaving them on pack #1 while the card printed another pack's price left `Price/pc low → high` showing **63 visibly-descending prices** at `size=M,L`. Not wrong — ranked on numbers nobody can see — but it reads as broken sorting. Ranking on the shown pack takes that to 0. MOQ is a product field and does not move. New module `lib/filters/activeVariant.ts`, and `valuesOf` grew a second parameter carrying the size selection, the only selection a facet is allowed to see.

**The seed was reshaped, because Size was a dead control before it.** Measured against the old flat breakup table, L appeared in **96%** of the catalog and M in 93%: two-to-four packs each drawing their own sizes unioned into near-total coverage, so ticking a size pruned about 4%. Sizes are now a contiguous **run per product** — a garment comes in S–XL and its packs are quantity splits of that run — which puts L at 42%, M at 39%, and all thirteen options between 3% and 42%. Kids' lines are sized by **age band** (`2-3Y` … `12-13Y`) and adults' by letter, category-restricted the way brands and price bands already are, so Girls empties the panel of letters and Men empties it of bands.

**Determinism held.** Runs draw from their own PRNG stream; the per-pack split reuses the slot the old breakup `pick` occupied, so the main sequence never shifted. Verified: all seven category counts, Girls 97, Men 575 and `₹900 & above` 37 are unchanged. Two side effects worth having — *Solid Size Pack* now genuinely means one size for the carton, which the facet always claimed and the flat table never honoured; and mixed packs are capped at four sizes, because a seven-size `whitespace-nowrap` breakup runs past the 360px frame.

**Two bugs, both found by checking rather than reasoning.** `Variant.sizes` holds display labels (`"3XL"`) while selections hold ids (`"3xl"`), so the pack silently never moved off #1 and nothing failed — `sizeOptionId` is now declared once and imported by both sides. And the pill row's scroll-into-view aligned an over-wide pill's *right* edge, hiding its left; a pill wider than the row now aligns left.

**Size sits between Margin and Colour in every rail** (it went in beside Pack Type, which has since gone) — a new entry Figma's rail predates. Placed with the other garment attributes so the designed order above it is untouched, which **wants a designer's call**: size is the filter an apparel buyer reaches for first, and this is not the top.

### 2026-08-19 — Pack Type removed as a filter

Gone from the Filters rail in both variants, on request. A **departure from Figma's rail**, which carries it, and worth recording as one.

It was removed from `FACETS` as well as from the rail, rather than just the rail. A facet with no control left is the trap the `hasOffer` rail entry exists to avoid: `?packType=` would still filter, Clear Filters would not clear it, the badge would not count it, and nothing on screen would show or undo it. Dropping it from the registry means `parseSelections` ignores the parameter outright.

**The `packType` field on the product stays**, and two tests now hold that. Its draw sits in the middle of the seeded sequence, so deleting it would re-roll the whole catalog and move every documented count; and since 2026-08-18 it also decides pack composition — a *Solid Size Pack* carries one size for the whole carton where the others spread across the product's size run. Verified unchanged after the removal: 1,070 total, Girls 97, Men 575, `₹900 & above` 37, all seven category counts and all thirteen size counts identical.

Rails are now **A 12 rows, B 13**, still differing by Category alone.

### 2026-08-19 — Category leaves the bottom bar

Removed from Variant A's bottom bar on request and returned to the Filters rail as an ordinary facet, first row, exactly as it already worked in B. **A's bar is now Sort and Filters**, two slots.

The trigger was that a facet reachable from both a bar slot and a chip kept generating edge cases the bar was the wrong place to settle: should the slot hide once a single vertical is picked, which control owns the count, what is Clear Filters allowed to touch. One control, one owner.

Three consequences, all intended:

- **The Filters badge counts category now.** A's badge used to exclude it because the bar reported it separately; nothing else carries a badge any more, so nothing is double-reported.
- **Clear Filters wipes category in A.** It used to survive, because clearing a filter from a screen that never showed it is a silent surprise. The screen shows it.
- **`CategorySheet.tsx` is deleted**, along with its `Clear all` / `Show N results` footer — the same precedent as `GenderSheet` when its slot went. Multi-select is unaffected: the rail's `TileGrid` was always multi-select. The Filters screen is now the only draft surface, so it is the only place the `Selection discarded` toast fires.

`getRail` and `getRailFacetIds` **no longer take a variant**, because there is nothing left for it to select, and `FilterScreen` dropped its `variant` prop with them.

**The A/B is now clean.** Card, catalog, engine, rail and facets are identical; where Sort and Filters sit is the entire variable. That closes backlog item 10, which had been open since the variant was added.

Verified at 360px: A's bar reads Sort · Filters; A's rail is the same thirteen rows as B's, headed by Category; picking *Girl's T-Shirts* gives `Show 97 results`, `?category=girls-t-shirts` and a Filters badge of 1; Clear Filters returns the URL to bare; and the chip route still writes category and is picked up by the badge.

### 2026-08-19 — vertical-specific attributes

**Fit · Neck Type · Sleeve Type · Pattern · Closure Type.** Of the eight attributes asked for, three already existed: `PRODUCT_COLOR` and `AVAILABLE_SIZES` are the `colour` and `size` rail facets, left where they are because both are useful across verticals.

**Fabric is not one of the vertical-specific five**, though it was asked for with them. Its values don't vary by vertical — Cotton and Denim mean the same on a shirt as on a tee, where a collar has no tee equivalent at all — so it became an ordinary rail row beside Colour and left *More Filters*, which now holds Product Tags alone. It was briefly in both places, which is one facet behind two controls.

**They appear only inside exactly one product vertical**, which is what "focuses on a single PV" has to mean in practice — across verticals a Neck Type list offers *Spread Collar* beside *Round Neck*, and answers no question anyone is asking while still deciding between shirts and tees. The rail runs **14 rows normally, 19 inside a vertical**, and it follows the *draft*, so ticking a second vertical takes the block away again without waiting for `Show N results`.

**Shirts and tees carry different vocabularies.** `kind: "shirt" | "tee"` on the category picks between them, exactly as gender picks the size vocabulary. The facet's options are the union of both, so the ordinary zero-count rule does the separating — Men's Formal Shirts offers Spread, Button-Down, Cutaway, Mandarin and Club collars; Women's T-Shirts offers Round, Polo, V, Henley and Boat necks. No special case.

**Leaving a vertical drops its attribute selections.** Their rows leave the rail with the vertical, and a filter still narrowing the list with nothing to show or undo it is the trap the `hasOffer` rail entry exists to avoid: it would survive Clear Filters and go uncounted. `dropOrphanedSelections` runs in `commit` (a chip ✕ can leave a vertical), in the Filters screen's `toggle`, and in `parseSelections`, since `?fit=slim-fit` with no vertical was never reachable by clicking.

**A third PRNG stream** (`attrRand`) carries the five new draws, for the same reason `sizeRand` exists — five more draws on the main stream would have re-rolled the catalog. Verified unchanged: 1,070 total, Girls 97, Men 575, `₹900 & above` 37 and all seven category counts.

Verified at 360px: rail 14 rows with no vertical and 19 with one; Neck Type reads `Spread Collar (64) · Button-Down (42) · Cutaway (12) · Mandarin (32) · Club (13)` under Men's Formal Shirts and the five necklines under Women's T-Shirts; ticking V-Neck writes `?category=womens-t-shirts&neck=v-neck` with a badge of 2; removing the vertical by its chip ✕ returns the URL to bare and clears the badge, taking `neck=` with it. Drill-down works — Men's Formal + Slim Fit + Spread Collar + Full Sleeve is 8 of 163.

The block sits after Offers and before *More Filters*, 13 rows down — raised as a question and **left there deliberately** (2026-08-19), Price, Brands and Delivery being the commercially primary rows.

### 2026-08-19 — variants C and D, vertical-scoped listings

A **2×2**. A and B list every category; C and D *are* one. C carries A's bottom bar, D carries B's top chips, so scope and control placement can be read apart.

| | bottom bar | top chips |
|---|---|---|
| **all categories** | A `/seller/[id]` | B `/b/seller/[id]` |
| **one vertical** | C `/c/seller/[id]/[cat]` | D `/d/seller/[id]/[cat]` |

**The vertical is page scope, not a filter** — exactly as the seller already was. `products` arrives pre-scoped and `category` is never a selection, which is what lets the Category row leave the rail without stranding a filter no control could undo. The rail is **17 rows**: everything A and B have minus Category *and Gender*, plus the vertical-specific block, which is now permanently on. Gender goes for the same reason Category does — every category names its audience, so one vertical is one gender, and the row could only offer the single value every product in scope already has. That is a dead control by the same test the offer chips use. The strip carries Price and the three offer chips and no vertical chip — an unremovable one would be a ✕ that isn't there, and a removable one would have to unmake the page.

`lockedVertical` threads through `getRail`, `getRailFacetIds`, `dropOrphanedSelections`, `contextChips` and `parseSelections`. The last two earn their keep: a hand-edited `?category=girls-t-shirts` or `?gender=girls` on a Men's Formal Shirts page is dropped rather than emptying it, and the attribute guard is disabled because there is no vertical to leave.

**`/c` and `/d` are the listing.** One URL each, landing already inside a vertical — the state being demonstrated, with no browse path in front of it. `DEMO_VERTICAL` in `scope.ts` picks the pair: Baheti, the storefront the whole demo walks through, and Men's Formal Shirts, the richest shirt vertical at 163 products with every collar and closure populated. Other pairs stay reachable at `/c/seller/[sellerId]/[categoryId]` — 55 each, skipping the ones with no stock rather than serving an empty listing.

*A three-level browse loop was built here first and then removed.* It answered a question that had been asked and answered — "how is C reached" — rather than the actual need, which was a link that opens on the state to be shown. `VerticalMode` kept a third `browse` case for it; that went with the loop rather than staying as a mode nothing reaches.

**Two bugs caught in verification, both silent.** `parseSelections` applied the orphan guard without knowing the page was locked, so every attribute in a URL was stripped on load. And `homeHref ?? default` swallowed the explicit `null` that means "no home button", leaving C and D one tap from another variant's home — the exact leak the prop exists to prevent.

**App bar: no home button, title at 18px.** The two go together. C and D have no home of their own, so every href leads out of the variant; dropping the button frees 36px, which the title needs because the frame's 20px was sized for a seller name. *Men's Casual T-Shirts* measures 191px against the 157px the full bar leaves, and 172px against the 193px it leaves without home. All seven category labels now fit; A and B are untouched at 20px.

Verified at 360px: `/c` and `/d` both land on Men's Formal Shirts; rail 17 rows with neither Category nor Gender and the attribute block on; title reads the category; strip is Price · Seller Offer · Cashback · Free Delivery; C has a Sort/Filters bottom bar and D has neither; rail is 17 rows headed by Delivery Time, with neither Category nor Gender; ticking Spread Collar gives `Show 64 results` and `?neck=spread-collar`; a stale `?category=` is ignored while `?fit=` survives.

### 2026-08-19 — a glyph on the Filters header

`filter_alt.svg` at **24px**, 8px before the heading — the export's own size. It went in at 18 and read as an afterthought beside the heading; native also avoids resampling a thin glyph. Not in the frame, which has the heading alone; added on request. It is the glyph the Filters control itself carries, so the screen reads as the one that button opened, and it is black in the export — the heading's colour — so it renders as an `<img>` rather than through `MaskIcon`.

Worth noting the frames were already inconsistent here: A's bottom bar uses `filter_alt.svg` and B and D's chip uses `funnel.svg`. The header follows the bar.

### 2026-08-19 — icons on the offer chips

Supplied PNGs in a 26px `object-contain` box, leading all three offer chips and Price. The offer chips lose theirs when selected — M3's checkmark takes the slot — while Price keeps its rupee in both states, having no checkmark to make room for: its state is the fill and the label. `ChipIcon` is the single place the box is declared. A box rather than a fixed height: the three are different aspects, and sizing by height alone left the square Seller Offer box 20px on its longest edge while the two landscape ones reached 26 — the longest edge being what the eye actually compares. The map is keyed by **facet and option** rather than option alone: Seller Offer's option id is the bare `any`, being the catch-all on its own `hasOffer` facet, and a one-word id like that is exactly what another facet acquires later. **The checkmark replaces it when selected**, per Material 3, rather than the two sitting side by side — so the chip has one leading element in either state and the label doesn't shift as you tick it. The 8px left inset, previously only for the selected state, now applies whenever anything leads.

It sits in `public/offers/` rather than `public/figma/`: that folder is Figma exports, and a file's location shouldn't imply an origin it doesn't have. `cashback.png` (48×37) and `seller-offer.png` (48×48) have almost no headroom above the 20px they render at and will soften on a 3× display — both **want vectors**. `free-delivery.png` at 416×312 has room to spare. The map in `ContextChips.tsx` takes more without a code change.

### 2026-08-19 — GOLD removed

The membership strip and the `GOLD Target Scheme` tag are both gone from all four prototypes, along with `GoldStrip.tsx`, `GoldGlyph`, the three `gold-*.svg` exports, the `.gold-text` gradient, its seven colour tokens and the Rowdies webfont, which only ever set that wordmark. The chip strip now sits directly under the app bar.

**The offer is still drawn, and discarded.** `OFFERS.filter` runs its predicate once per entry, so deleting the row would have taken a `rand()` call out of the middle of the sequence and re-rolled the entire catalog — every count in these docs with it. It carries `retired: true`, is dropped after the draw, and is filtered out of the Offers facet so no permanently-empty option is listed.

Verified unchanged: 1,070 total, Girls 97, Men 575, `₹900 & above` 37, all seven category counts. The Offers facet is now Bulk Offer (473), Cashback (240), Free Delivery (160), with Seller Offer at 667; no product carries a GOLD offer. GOLD appears nowhere in A, B, C or D.

### 2026-08-19 — a count the tap can honour

**The Size panel could promise a result it couldn't deliver.** Found by random-walking the filters rather than by reading them: 13 of 400 walks that only ever ticked options the UI was showing ended on "No products match".

Replayed: colour=White, price ₹600–900, closure=Snap Button left two products; the Size panel offered *2XL* as `(1)`; tapping it gave an empty page. `p-0079`'s pack #1 is `L/1, XL/1` at **₹610**, inside the band — but the pack carrying 2XL is **₹575**, outside it. Picking a size moved the product out of a *price* filter, which a tally taken with Size skipped cannot see.

This was the trade-off recorded when Size went in, where the consequence was called "narrow". It wasn't: it could hand a shopper an empty listing from an option labelled `(1)`.

**Size is now counted by applying each option** rather than tallying it — thirteen options, one filter pass each, a couple of milliseconds. Only Size needs it, being the only facet whose selection changes another facet's values. Two tests hold the line: promised-equals-delivered across five filter states, and a 60-walk drill asserting a visible option can never lead to an empty page. The drill is slow by nature and carries an explicit 30s budget; it is here because no hand-written case would have found this.

### 2026-08-19 — Price high → low

Added to the Sort sheet in all four variants: one `SORT_OPTIONS` entry and one `sortProducts` case, every variant reading the same list. Like low→high it ranks on the pack the card actually prints, so a size filter moves it too.

Each direction now has its own glyph. They render through `MaskIcon` like the rest of the sheet — a mask reads only the alpha channel, so a black glyph still tints to primary on the active row. **The arrow is the magnitude, not the list**: up for low→high, prices ascending as you read down. *(The two supplied PNGs this shipped with were superseded later the same day — see below.)*

Verified at 360px: the row appears in A, B, C and D; `?sort=price_desc` round-trips; and the PRICE/PC figures on screen run 1085 → 1020 descending against 230 → 275 ascending.

### 2026-08-19 — rail reordered to a reference PLP

The Filters rail now runs **Category · Gender · Brands · Size · Colour · Fabric · Fit · Pattern · Sleeve Type · Neck Type · Closure Type · Price Range · Margin · MOQ · Delivery Time · Offers · Seller · Seller City · More Filters**, following a screengrab of a reference apparel PLP rather than the Figma frame — which sequenced these rows before most of them existed, and has no opinion about the ten it never drew.

Departures, each where the reference has no equivalent. **Category and Gender lead**, ahead of Brands: the reference carries no category filter because you are already inside one — precisely C and D, where both rows are gone — and puts Gender fourth. The two together settle who the garment is for, which a buyer does before picking a label off it. **Neck Type and Closure Type** trail Fit, Pattern and Sleeve Type, the three the reference does carry. **Margin** sits beside Price, being the other number a retailer buys on. **Seller and Seller City** are B2B and land with the commercial filters.

The composition changed shape with it: one ordered `RAIL_ORDER` array carrying `only: "filter"` and `vertical: true` flags, rather than a base list with the vertical block spliced in before the last row. With the block now mid-rail instead of at the end, slicing around it was the thing that would quietly put a row in the wrong place. A test pins the full sequence in both states, so the next reorder has to be a decision.

### 2026-08-19 — Size is vertical-only

**M in menswear is not M in womenswear.** A single Size row spanning verticals merged two different garments' measurements behind one checkbox, so it now appears on the same terms as Fit and Neck Type: inside exactly one vertical, or on a vertical-scoped page. It is cleared along with them when the vertical goes, and a bare `?size=` with no vertical is ignored — otherwise a size would keep filtering with no row left to explain or undo it.

This is the argument the catalog already made by sizing kids in age bands and adults in letters, carried the rest of the way.

It keeps its slot beside Brands and Colour rather than joining the block, reading as a garment basic rather than a vertical-specific attribute.

Verified at 360px: no Size row in A or B until a vertical is picked, present in C and D; `?size=l` on a seller page leaves the badge bare while `?size=2xl` on `/c` counts 1.

### 2026-08-19 — a designed glyph set for the Sort sheet

Figma **`688:1687`** (`SortbyIcon`) supplies all five rows, exported to `public/figma/icons/sort-*.svg`. The two supplied PNGs from earlier the same day are superseded and `public/sort/` is deleted.

**The point is that they are a set, drawn at one weight**, so the sheet takes the whole set rather than picking per row. Two rows had been borrowing:

- `recent` stood in **`tag.svg`**, which is also the *Recently Added* glyph elsewhere — one asset doing double duty, the same complaint that put a Category glyph on the open-questions list.
- `popularity` took **`trend-up.svg`**, a visibly heavier cut of the same trending arrow, filled `#014FFA` and owned by the PLP. Beside four regular-weight glyphs it read as a different family.

`sort-percent.svg` matches the library's `percent.svg` **byte for byte** and is still written as its own file. Reusing the shared one on a byte-match was the first cut of this change and was wrong: the set is the unit that gets reweighted, so a redraw has to land in one place instead of depending on a coincidence between two glyphs with different owners.

**`sort-new.svg` is the one that needed assembling.** Its frame is a vector plus a live text layer, so Figma has no single vector-layer export for it — `svgAssets` returns the starburst alone. The frame export carries the exact path data for both, including the `NEW` already outlined, but bundles the section background behind it; that background is the only thing dropped, so no path was authored. The badge is a two-contour ring, so its counter stays transparent and the wordmark reads through the mask rather than filling in.

Verified at 360px, 3×: all five render, no missing assets and no console errors; the `NEW` wordmark is legible inside its badge at 24px; and the tint holds on the active row in both states — Popularity blue by default, and `Price/pc (low → high)` blue with its rupee-and-up-arrow after selection, the list re-sorting to ₹95 first. 80 tests green, lint and typecheck clean, production build clean.

### 2026-08-19 — the rail stops rearranging itself

Two changes, both from watching the rail inside a single vertical.

**Price Range had been falling from 6th to 12th.** The vertical block sat mid-rail beside Fabric, following the reference PLP, so five rows arriving there pushed every commercial row down six places and Price Range below the fold. Picking a vertical handed back a rail the buyer had not learned. **A departure from the reference**, and worth recording as one: the block now trails Seller City, so the commercial rows hold still.

**Gender leaves once a vertical is settled.** Category → gender is 1:1, so inside one vertical the row could only offer the single value every product in scope already has — dead by the same test `discriminatingOptions` applies to the offer chips. This is exactly the argument C and D already made; it was only ever applied where the *page* settled the vertical, and it holds just as well where the *filter* does.

**The two cancel, which is the good part.** Gender leaving and Size arriving swap slots, so **Colour through Seller City sit at the same index in both states** — ten rows that don't move. Brands is the only row that shifts, up one into Gender's old slot.

```
     MULTI-PV (13)        SINGLE PV (18)       LOCKED C/D (17)
  1. Category         = Category            Brands
  2. Gender             Brands              Size
  3. Brands             Size                Colour
  4. Colour           = Colour              Fabric
  5. Fabric           = Fabric              Price Range
  6. Price Range      = Price Range         Margin
  7. Margin           = Margin              MOQ
  8. MOQ              = MOQ                 Delivery Time
  9. Delivery Time    = Delivery Time       Offers
 10. Offers           = Offers              Seller
 11. Seller           = Seller              Seller City
 12. Seller City      = Seller City         Fit …
 13. More Filters       Fit …               More Filters
```

Size **stayed put** rather than joining the block. It reads as a garment basic beside Brands and Colour, and moving it would have re-broken the alignment it now provides.

**The orphan guard runs both ways now**, and was renamed `dropOrphanedSelections` because `dropOrphanedAttributes` no longer described it. Leaving a vertical drops its attribute selections; entering one drops the gender selection. Dropping Gender on the way in is free — the selection was implied by the vertical, so the result set doesn't move. The single case where it *does* move is a contradiction like `?category=girls-t-shirts&gender=men`, which goes from 0 results to 97: it **resolves** an empty page rather than causing one, there being no Gender row left to undo the mismatch.

C and D's `?gender=` strip folded into the same guard, replacing an ad-hoc `params.delete("gender")` in `PlpScreen`. One owner, and the rule was never specific to those pages. `params.delete("category")` stays, category not being something the guard sees under `locked`.

Verified at 360px: the three rails read exactly as above; no Gender row inside a vertical in A or B; Price Range 6th and above the fold with 163 results under Men's Formal Shirts; the contradiction URL renders 97 rather than an empty page and the badge reads 1; `/c?gender=girls` leaves the badge bare; `?gender=men` alone across verticals still filters and still counts. 83 tests green (three new), lint, typecheck and build clean. As with C and D's stale `?category=`, a stale `?gender=` in the address bar is **ignored rather than rewritten** — the next commit cleans it.

### 2026-08-20 — the Size panel offered sizes the vertical doesn't carry

Reported: pick Women's T-Shirts, open Filters, tick **S** — and the panel starts offering `2-3Y`, `4-5Y` and the rest of the kids' age bands. Before ticking anything it listed the seven letters correctly.

**The count was `selected ∪ option`.** Added on 2026-08-19 with the counting fix, on the reasoning that a count should say what the tap delivers. But Size is OR-within-a-facet, so a union can only ever *widen*: with S ticked, `2-3Y` was counted as `S ∪ 2-3Y`, which is just S's own 55 products, because no adult vertical carries an age band. Every unticked option inherited the current selection's count, none could reach zero, and the hide-at-zero rule stopped firing across the whole panel. The displayed numbers were wrong in the same way — every row showed at least the current result count.

**Each option is now applied on its own** — `{...selections, size: [option]}` — which is the own-facet-excluded question the tally already asks for every other facet. Ticking a seller still shows live counts for the others; Size now behaves the same way, and its counts stay put as you tick rather than climbing.

Two properties had to survive the change, and both do:

- **Replacing, not skipping.** The size filter still runs, so the active pack still moves. Skipping it is what caused the original 2026-08-19 bug, where an option labelled `(1)` handed back an empty page.
- **A visible option can never lead to an empty page.** If the option alone returns *n* > 0, then `selected ∪ option` returns at least *n*, a union only widening. The guarantee is if anything stronger than before.

The count no longer equals what a tap returns — it under-promises when something is already ticked. That is exactly the contract every other facet has, so the test that pinned the old equality was replaced rather than patched: the count now equals the option applied alone, and a separate test asserts the tap never undershoots it.

Verified at 360px: Women's T-Shirts + S reads `XS (16) · S (55) · M (83) · L (94) · XL (71) · 2XL (33) · 3XL (10)` with no age bands, and `Show 55 results`; the counts are identical before and after ticking; Girl's T-Shirts + 4-5Y shows the six age bands and no letters. 85 tests green (two new, one rewritten), lint, typecheck and build clean.

### 2026-08-20 — the shipping-fee line is gone

`+₹50 shipping fee` under the price is **not a real charge**, and is removed from the card in all four variants. It had been kept as an open question since 2026-08-14 — "real per-order cost the seed carries, say the word and it goes" — and the word was said. It also closes the last disagreement between our card and the live app's screengrab, which has no such line.

**`variant.shippingFee` stays on the type and is still drawn.** Its `rand()` sits mid-sequence inside the pack loop, so deleting it would shift every draw after it and re-roll the whole catalog, moving every count in these docs. It is simply unread now — the same treatment `packType` got when it lost its filter, and the retired GOLD offer when it lost its tag. Price and margin never read it, so nothing else moves.

The wrapper that held the line went with it: its `gap-[4px]` existed only to separate the two rows. The measured spacing is untouched — 7px from `PRICE/PC` to the price, 10px on the baseline from price to margin.

Verified at 360px, 3×: zero occurrences of "shipping fee" in A, B, C and D, and none after scrolling A; price and margin sit exactly where they did; no console errors. 85 tests green — determinism held, which is the thing that would have broken had the draw gone with the line.

### 2026-08-20 — the type was small for 360px

Raised on request. The pass was **a floor, not a multiplier**: the tier that was
failing was 9–12px, and the top of the scale was already at or above what the
live app sets, so scaling everything would have moved numbers that were measured
rather than chosen.

**What moved.** `PRICE/PC` 9 → 11px, which was the smallest type in the app and
labels the one number the card is built around. The offer tags 10 → 12px with
their pill 16 → 18px. `SET OF n` 10 → 11px. Both badge counters (the Filters
count in A and C, the chip count in B and D) 9/10 → 11px, boxes to 17px. The
muted `MRP/PC ₹390 | SET of: 2` line 12 → 13px, and `Best Seller`, `VIEW
DETAILS`, the panel facet headings and the Price-menu counts with it. Every 14px
control label — checkbox rows, rail rows, all three chip kinds, `Clear Filters`,
`Show N results`, the empty state — to 15px. Toast and zero-results copy 13 →
14px. The margin 14 → 15px, which its `items-baseline` row was already written
to absorb. On the home screen the activate-account card left the frame's
fractional 12.407/10.634 for 13/12 — unlike the hero above it, that card carries
an instruction rather than banner art, and 12px is the ceiling for its second
line rather than a preference: the string measures ~271px in the 272px it has
once the icon and both insets are out, so 13px would truncate it.

**What was held, and why.** The **26px price** and the **title's 16px pitch**
were rebuilt from pixel measurements of the live-app screengrab on 2026-08-14,
and the open question there records the app setting its price at ~24px — this
side is already the larger of the two. The **app bar titles** stay at 20px in A
and B and 18px in C and D because they are width-capped, not taste-capped:
*Men's Casual T-Shirts* measures 172px against the 193px the compact bar leaves,
so a step up overflows the longest label. The **home hero** keeps its fractional
Figma sizes, being an absolutely-positioned composition rather than copy.

**Two sites refused the raise**, both boxed by a frame dimension rather than by
the type, and both now carry a comment saying so:

- **Tile-grid labels stay at 11px.** The 68px cell is a tuned fit — `Men's
  Formal` measures ~66px at 11px and clears 68 at 12px, which pushes the third
  word onto a third line and the clamp ellipsises it. Tried it; the panel came
  back reading `Men's Formal…` and `Men's Casual T-…`, losing the only thing the
  label adds to the photo.
- **The home seller card's stat line stays at 11px.** The card is 152px with a
  6px inset, so the line has 140px: `1,070 products | 9k+ orders` needs 133px at
  11px and 145px at 12px, where `truncate` bites and eats `orders`.

Raising either needs a wider cell or a wider card — a change to the frame, and a
designer's call rather than ours.

**Verified by audit rather than by eye.** A DOM pass over `/`, `/seller/baheti`,
`/c`, `/d` and all thirteen Filters rail panels, flagging any text element whose
`scrollWidth` exceeds its box, any `line-clamp` actually biting, and anything
crossing 360px outside a horizontal scroller — then **diffed against the same
audit on the baseline**, which is what separated the two real regressions above
from what was already there. Final diff is two lines, both pre-existing: a long
seller name in the 240px panel, which already truncated at 14px and truncates a
little earlier at 15. Lint, typecheck and production build clean; 85 tests green
at the time, and re-run green after merging the search-field work below.

### 2026-08-20 — the search field is earned rather than declared

**Every facet that showed a search field fit inside the fold.** The flag was static — `searchable: true` on Category, Brands, Colour, Seller and Seller City — and measured against the panel it sits in, not one of them needed it:

| Facet | Options | Height | Panel |
|---|---|---|---|
| Category | 7 tiles | 288px | 690px |
| Brands | 10 tiles | 384px | 690px |
| Colour | 10 rows | 520px | 690px |
| Seller | 8 rows | 416px | 690px |
| Seller City | 6 rows | 312px | 690px |

So the field cost 56px of the fold to search a list already on screen. The flag is deleted and the rule is now the honest one: **show it when the options overflow.** `lib/filters/panelFit.ts` holds the arithmetic, and because it works on counts rather than the DOM it also **takes the field away again** when pruning shortens a list — which a static flag can't do.

**Computed, not measured.** `scrollHeight > clientHeight` is the literal reading of "below the fold" and was rejected: the server can't measure, so SSR would render no field and the client would add one after hydration — a 56px shift every time a panel opened, on a prototype where server/client agreement is load-bearing. The constants are the rendered sizes (800px frame − 49px header − 61px footer = 690px; `OptionRow` 52px; tiles 96px, three across), and they work out to **14 checkbox rows or 22 tiles**. A test pins both thresholds, so changing a row height in the markup without following it here fails rather than moving the field a row.

**Colour went from ten colours to twenty**, because otherwise nothing in the app overflows and the rule has nothing to demonstrate. Red, Green, Teal, Purple, Brown, Sky Blue, Rust, Lavender, Cream and Coral join the ten, ordered by weight so the panel still reads commonest-first. **Determinism held**, and this is the reason it could: `weightedPick` takes exactly one `rand()` however long the array is, so the sequence never shifted. Verified unchanged — 1,070 total, Girls 97, Men 575, `₹900 & above` 37, all seven category counts and all thirteen size counts. Only colour's own distribution moved, which is the point; every product's `image` still falls out of its `dark` flag, so all twenty carry one.

**One trap worth recording.** The visibility decision runs on the option counts *before* the query narrows them — deciding on the queried list would let the field delete itself from under the cursor as soon as you typed enough to make the remainder fit. And when a panel does stop overflowing, `activeQuery` drops the query with the field, so a control nobody can see can't go on filtering.

Verified at 360px, 3×: Colour shows the field over twenty colours (Black 108 … Coral), twelve above the fold; Seller, Seller City, Brands and Category show none; typing `bl` in Colour narrows to Black, Blue and Sky Blue with the field still there; `?category=girls-t-shirts&size=12-13y` prunes Colour to five and the field gives its 56px back; `/d` behaves as `/` does. No console errors. 94 tests green (nine new), lint, typecheck and production build clean.

*A false start worth noting:* the first screenshot pass showed no change at all, because port 3000 was already held by another worktree's dev server and this one had quietly taken 3001 — every shot was of somebody else's code. Check the port before believing a screenshot in a multi-worktree checkout.

### 2026-08-20 — the user journey, a fifth route

A named flow rather than a variant: **`/userjourney`**, built from four
screengrabs of the live app. The brief was a specific buyer's path — a garment
seller in Imphal after trendy women's tees their catchment doesn't carry — and
the point is that the whole path clicks, not that it tests a control placement.

```
/userjourney                          home, banner only
/userjourney/seller/kartik            the storefront
/userjourney/product/[productId]      the detail screen
```

Home → tap the **Kartik exporters** banner → storefront → Filters → *Gender →
Women* → Sort → *Recently Added* → Size → S, M, L → tap a card → detail.
Verified end to end at 360px.

**Kartik exporters is a banner, not a seller card.** That was the first thing
the screengrabs corrected: it is a Zenifit co-branded promo on the home
carousel ("Get up to 80% Margin on Men's, women's & kids T-shirts"), and the
whole banner is the tap target, the frame giving no narrower hit area.

**Its catalog is separate, on its own PRNG streams** (`lib/catalog/kartik.ts`).
540 Zenifit products across **three tee verticals only** — Men's Casual
T-Shirts 222, Women's T-Shirts 197, Boy's Casual T-Shirts 121. It is not part
of the 1,070 and nothing in A–D can see it, which is the whole reason it is its
own module: adding products to the main sequence would have moved every count
in these docs. A test asserts the main catalog still reads 1,070 / Girls 97 /
Men 575 and carries no Zenifit.

**No Girl's T-Shirts, and that is load-bearing.** It leaves exactly one
women's vertical, so *Gender → Women* settles a single PV on its own — which
turned out to be the one thing the journey needed that the code could not do.

#### The blocker: a vertical can be settled without being ticked

`inSingleVertical` tested the **category selection**, so after a Gender cut
nothing was settled, and Size — vertical-only since 2026-08-19 — never joined
the rail. The journey's S/M/L step had no control to tap.

`settledVertical` replaces that test with one about **scope**: the vertical is
settled when the products in scope span exactly one category, however they got
that way. That honours the original reason the rule exists — *M in menswear is
not M in womenswear* stops being true the moment one vertical is in scope, and
it never mattered which control narrowed it.

**Only Category and Gender can settle it.** Those two decide who the garment is
for; everything else describes the garment. Letting a colour or a price band
count would make five rows appear and vanish as a buyer ticks unrelated boxes —
exactly what the 2026-08-19 reorder set out to stop.

**Two questions had been sharing one flag, and splitting them found a bug.**
Whether the attribute rows *show* is about scope. Whether Gender is *orphaned*
is narrower: only a ticked category implies the gender, so only then can the
row go. Shared, a Gender cut that settled a vertical took the Gender row off the
rail while its selection survived — a live filter with nothing to show or undo
it, the precise trap `dropOrphanedSelections` exists to prevent. Caught by a
test, not by reading. `dropOrphanedSelections` and `getRail` now take the
settled vertical as a third argument, defaulting to `null` so every existing
caller behaves exactly as before.

`parseSelections` takes the page's products for the same reason: without them a
shared link like `?gender=women&size=s,m,l` had its Size stripped on load, on a
page whose rail shows Size.

Rails, measured in the browser: **13 rows across three verticals; 19 after
*Gender → Women*** — Size plus the five attributes join and **Gender stays**,
because it is the control holding the cut. That is one more than the documented
18, and it is the intended consequence: where a *Category* tick settles the
vertical, Gender still leaves and it is still 18.

#### The card is a second design, deliberately

The storefront screengrab is a newer cut than the one A–D's card was measured
against, and differs in four ways: an orange `#fb9805` cashback ribbon breaking
the top-left corner, outlined `FREE DELIVERY` / `₹100 Cashback` pills under the
price, `VIEW DETAILS` **blue** on a `#f5f8ff` strip rather than orange, and no
`Best Seller` flag. `JourneyProductCard` is journey-only on request — A–D are
signed off and must not drift in anything but where their controls sit. **The
cost is two card designs in one prototype**, which is the thing to watch.

Side effect worth having: the live app's blue takes `VIEW DETAILS` from 2.53:1
to AA on this route, closing the worst contrast failure on the card. It stays
open on A–D.

`PlpScreen` gained `card`, `appBar`, `aboveList`, `belowList` and
`listClassName` rather than a second copy of the screen — duplicating 400 lines
of filter state is the drift the variants exist to be free of.

#### Measured, not eyeballed

The screengrabs are **1080×2400, exactly 3× the 360px design**, so every device
pixel divides cleanly — the same property that let the card be measured in
August. Values were read off the raw RGB rather than estimated: page `#f7f7f7`,
card 9px inset at 12px radius, ribbon 20px, offer pills 20px with a 1px border,
the `VIEW DETAILS` strip 35px on `#f5f8ff` over a 1px `#ebebeb` rule. The pill
border and the margin figure both measure `#0066ff`, the familiar off-token
slip, so the `primary` token is used.

All imagery is cropped from the screengrabs, nothing redrawn: four tee renders,
the banner, the storefront tile, and five header glyphs cropped *with* their
blue background so the logo's arc and the bell's dot survive.

#### Quirks reproduced rather than tidied

- The name appears **three ways in two screens** — `Kartik exporters` on the
  banner, `KARTIK EXPORTERS` in the app bar, `Kartik Exporters` in the header.
- `Set of:  1` is title case and double-spaced here; the listing card says
  `SET of:` from the older screengrab. The app disagrees with itself.
- Titles disagree too: `Half Sleeves` on the kids' tee, `Half sleeves` on the
  women's, and the adult line carries its fit where the kids' line drops it.
  Encoded as a rule from **one sample each** — worth confirming.
- Kids' garments read **Unisex**, the screengrab's own word for a boys' tee.
- `MRP/PC` is primary blue on the detail screen and grey on the listing card.
- Share is absent from the storefront bar and present on the detail bar.
- The search placeholder reads `"Vanadana Sarees"`, set verbatim.

Dropping Share is also what makes `KARTIK EXPORTERS` fit: it truncated to
`KARTIK EXPOR…` at 20px with Share in place, and the 36px it frees is enough.

#### The Filters screen fits a real phone (2026-08-21)

Reported: on desktop Category and Brands look right, on mobile there is dead
space beside them. Reproduced at 390 and 430px — the rail (120) and the panel
(240) were both fixed, so they came to exactly 360 and left 30–70px of white
against the frame edge, since `DeviceFrame` renders edge to edge below 480px.
Everything else in the app already stretched; this screen was the last fixed
one.

Two changes, both minimal:

- **The panel takes the remaining width.** The rail keeps its designed 120 —
  its labels are set to that — and 120 + rest agrees with the frame at exactly
  360.
- **The tile grid became one responsive grid**, `auto-fill` on a 72px floor with
  `1fr` columns, which lands on the frame's three across at 240 and fills
  anything wider. That also collapsed the two tile layouts into one: `fill` was
  built for the deleted Category sheet and carried a note to delete it if
  nothing needed it — what needed it turned out to be this.

Columns stretch rather than multiply (three 96px cells at 430px, not four 72px
ones), which puts the extra width into the label the cell was widened for. **The
tile grows with the column too** — `calc(100% - 16px)`, square, so 8px of air
either side at any width: a flat 56px left 20px of air either side of a
photograph once the column reached 96, which was the follow-up complaint. It
lands on 56.67 at the designed 72.67 column, the frame's 56 within a subpixel.
The radius went proportional with it (9.333 of 56 = 16.667%), and the cell's
height is content rather than a fixed 105, which would have clipped the label as
the tile grew.

Measured at 360 / 390 / 430 / 520: panel 240 / 270 / 310 / 240, cells 72.7 /
82.7 / 96 / 72.7, tiles 56.7 / 66.7 / 80 / 56.7, three across throughout,
nothing clamped — and 520px is the phone-mockup path, so the desktop view the
report called correct is untouched.

#### Product images now match the garment (2026-08-21)

"If a shirt says it's black make sure it is black." Every card used to show one
of two Figma button-ups, picked by whether the colour was dark or light, so a
Coral tee for girls arrived as a grey shirt.

**120 images generated with Magnific** (Nano Banana 2 Lite, 60 credits each,
~7,200 total): model on seamless white, waist-up, no print or logo, one per
wearer × garment × colour. The axis is `gender × kind`, six pairs over 20
colours — collapsing women and men into "adult" would have put a man on a
Women's T-Shirt card, which is the mismatch this removes.

- `productImage()` resolves `/products/{gender}-{kind}-{colour}.jpg` and falls
  back to the two Figma renders for anything missing, so the set landed in
  batches over one session without a flag day and nothing ever pointed at a 404.
- 276px wide, 3× the 92px the card draws, ~16KB each: **1.9MB** for all 120.
- **Verified: all 1,070 products resolve to generated art, zero on the fallback**,
  no broken images, and titles agree with pictures across every category
  (`… for Girls, Coral` → `girls-tee-coral.jpg`).
- Nothing moved in the seed: the image was always derived from the colour, never
  drawn from the PRNG. 112 tests green throughout.
- Magnific isn't in the repo's toolchain — the server was added to this session's
  MCP config and needed a restart before its tools appeared.

#### The tile labels were raised (2026-08-21)

The complaint: on the image filters — Category and Brands — the label reads as
tiny beside its own photograph. It was 11px, and one of the two sites the
2026-08-20 type pass had to leave alone.

- 11px was a fit to the frame's **68px cell**, not a choice: `Men's Formal`
  measures ~66px there, clears 68 at 12px, and a two-line clamp then ellipsised
  the third word. So the type could only rise if the grid did.
- The cell is now **72×105**: 4px off the insets and gap buys the width
  (10 + 72×3 + 3×2 + 6 = 238 of the panel's 240), and the label box is a 45px
  **three**-line reserve at **13px**.
- DOM audit over all seven categories and all ten brands: nothing clamps,
  nothing overflows its cell, three across preserved.
- Knock-on: `TILE_ROW_H` 96 → 105 in `panelFit.ts`, so the search field is now
  earned at **19 tiles** rather than 22. The test that pins it moved with it —
  which is the point of pinning it.

#### The chip badge moved onto the glyph (2026-08-21)

Asked for, to match the bottom pill and save room in the scrolling strip. It
does: as a sibling the count cost the `Filter` chip 21px the moment it appeared
(85 → 106px, measured), and the chip changed width as filters were applied,
shuffling everything to its right. In the glyph's place it costs nothing and the chip holds
83–89px in every state — no badge, a dot, `2`, or `13`.

- **It replaces the glyph**, after two attempts at keeping both. Hung off the
  icon's right corner, a two-digit count grew into the label and touched it;
  centred on the icon it cleared the label but covered most of the funnel and
  read as clutter. In the icon's *place* it does neither — and a one-digit count
  is 3px narrower than the glyph it stands in for.
- The chip says `Filter` beside it, so the glyph was never what carried the
  meaning. The number is.
- **Sort keeps its glyph**, with the dot on it: one value, so there is no number
  to swap in, and a dot obscures nothing.
- The chip's gap went **4 → 8px**, constant in both states, so the badge has air
  without the width moving.
- The box stays **17px at 11px** — the type pass raised these counters to 11
  because they are read, and this one is read most.

#### The bottom bar is a floating pill, and A and C are back (2026-08-21)

Figma `697:2658`, supplied: Sort and Filters in a **240 × 52 dark pill**
(`#323232`, 1px `#d1d1d1`, 16px radius, `0 0 5.05px rgba(0,0,0,0.3)`) floating
above the basket bar, with the listing scrolling under both.

That reverses the park. A and C were shelved on 2026-08-20 because a pinned
full-width bar fought the basket bar for the bottom edge; a floating pill doesn't
compete for it, so **both are live again** and the 2×2 stands. The journey stays
on top chips — that call was about which controls its own screengrab shows.

- 12px above the basket bar or the frame's edge, and the offset **transitions**,
  so the pill rides the bar as it slides away rather than jumping.
- The list gets a `PILL_H + 2 × PILL_GAP` spacer, or its last card would sit
  permanently under a control.
- Labels at **15px**, not the frame's 14: every 14px control label moved in the
  type pass. The dot and count stay — the frame has no way to tell a filtered
  list from an unfiltered one.
- `sort.svg` (the frame's own `SortAscending`) and `funnel.svg` (its `Funnel`)
  are the exports A/C and B/D already carried, both black, rendered white
  through `MaskIcon` rather than re-exported.
- Verified on `/` and `/c`: pill at x=60, 240 × 52, 12px off the bottom, sheets
  open, the Sort dot lights.

**A and C got their detail routes the same day**, `/product/[productId]` and
`/c/product/[productId]`, so all four variants are closed loops from listing to
product to basket. A's base path is the **empty string** — its routes hang off
`/` — so `productBasePath` is tested with `!== undefined`, not for truthiness,
or A's cards would silently stop navigating. Verified: a card on `/seller/baheti`
opens `/product/p-0511`, `+` brings up the bar, Home returns to `/`.

**The pill hides with the chip strip** (asked for): same flag, 1.5 folds down,
sliding clear of the frame by its own height plus its offset and returning on the
first upward flick. Measured on `/` and `/c`: pill top 736 → 800 with the strip
69 → 0, and both back on the way up. One gesture, one moment — two thresholds
would read as a stutter.

#### One card, and it is the journey's (2026-08-21)

"Use userjourney as the source of truth." The journey's card moved to
`components/plp/ProductCard.tsx` and replaced the Figma-derived one, which is
deleted along with `Tags.tsx` and its `BULK Offer` sprite pill. Every listing —
`/b`, `/d`, `/userjourney`, and A and C by inheritance — now renders the same
card, which is what the note calling two card designs "the thing to watch" was
waiting for.

Two things came across, because the main catalog carries data the journey's
doesn't:

- **Every offer shows.** `Free Delivery` and `Cashback` keep their artwork;
  anything else takes the same outlined pill without an icon, in the offer's own
  casing — `Bulk Offer` is filterable, so a card that didn't name it would leave
  a filtered result with nothing to explain itself.
- **`Best Seller` uses the ribbon corner when the ribbon is free.** The
  screengrab has no flag because a cashback ribbon occupies that corner; that is
  an argument about the corner, not the flag.

Verified on all three listings: `/b` and `/d` show the ribbon card with a
`Bulk Offer` pill, the journey unchanged bar the same pill where its catalog
carries the offer.

#### The basket persists, and both bars hide on scroll (2026-08-21)

Asked for: once something is added the bar stays — on the detail screen *and*
the listing — and it goes down when the buyer scrolls down, back up when they
scroll up.

- **`CartProvider` in the root layout**, above the routes. Every move in this
  demo is a client-side navigation, so state above the router survives all of
  them: add from a product, hit back, and the listing's bar still carries the
  total. Not `sessionStorage` — a hard reload should start the demo over, and
  storage would need an effect to avoid a hydration mismatch, which means a bar
  arriving a frame late on every load.
- **One line**, which is all this prototype adds, carrying its own `total`: the
  listing needs the figure and `/b` and `/userjourney` don't share a catalog, so
  the screen that knows the product prices it once.
- **Returning to a product restores pack, count and total**, so the stepper
  can't read 0 under a bar that says ₹1,440. Switching pack re-prices the line
  that is already in the basket.
- **`useHideOnScroll`** now serves the chip strip and both bars. Its one
  argument is the threshold: the strip and pill wait 1.5 folds, the bar waits for
  nothing.
- The bar animates a **collapsing slot**, height and transform together. It
  shipped translating only, which left its 64px of layout behind: the listing
  stayed short and `bg-page` showed through where the bar had been, reading as a
  grey band over the last card. Fixed the same day; `CART_BAR_H` is now the one
  place that height is declared.
- Verified: nothing on the listing before adding; add on the PDP → bar on both
  screens; back → still there; scroll down → gone, up → back, on each screen.
  At the design 800px height the detail screen has nothing to scroll once the
  bar is up (content 680 in a 680 viewport), so that behaviour shows there only
  on a shorter screen or a longer product — measured at 640px, where it works.
- **`SHOW_CART_BAR` deleted**: it hid a bar whose numbers were the screengrab's,
  and both screens now compute their own.

#### Adding to the basket (2026-08-21)

From a fifth screengrab: pressing `+` on the detail screen brings up the basket
bar with the line's value, and crossing ₹1,000 throws the app's *Congrats!
You've unlocked a new offer!* dialog. Shared, so `/userjourney`, `/b` and `/d`
all have it.

- Line total is `price/pc × set size × qty`. The journey's tee is 4 pieces at
  ₹360, so the first `+` is ₹1,440 and the offer fires immediately; `/b`'s
  ₹230 × 2 takes three sets (₹1,380), which is the case that proves the
  threshold rather than the product.
- `FREE_DELIVERY_MIN = 1000`, a demo constant — no screengrab states it.
- **Fires on every upward crossing** (chosen): step under and back over and it
  congratulates you again.
- **Staggered, on request**: the stepper answers instantly, the basket bar and
  band arrive 450ms later, the dialog 600ms after that. Two round trips is what
  the real app does — price the line, then evaluate the promotion — and firing
  both at once reads as one canned animation. The stepper's own number is never
  delayed. `cartQty` trails `qty`; both timers are per-tap, rescheduled by the
  next tap and cleared on unmount, and `offerDue` keeps a `++` run from
  cancelling its own dialog.
- **Confetti over the dialog** — 24 pieces at `z-20` over the card's `z-10`,
  falling across the frame rather than the card alone. Hand-written table, not
  random, so a screenshot of it is reproducible; one keyframe driven per piece
  by inline `left`/delay/duration and `--drift`/`--spin`; the app's own four
  colours; plays once; not rendered under `prefers-reduced-motion`.
- The delivery line stays `+ ₹0 DELIVERY CHARGES` at every total, as both
  screengrabs have it. The first four-digit total wrapped it in two, so it took
  `whitespace-nowrap` and the `GO TO CART` button gave up 6px of padding — our
  13px there is a deliberate raise over the app's measured ~10px.
- The app-bar badge follows the basket: nothing at 0, then 1. The route's
  `cartBadge` is only the resting value, so the badge and the bar's total can't
  disagree.
- The green `SUBTOTAL` band is measured except for its colour, which is
  **recovered**: the only shot of it has the dialog's scrim over it, so the
  scrim was solved from the app bar's known `#004FFA` (~44% black) and the band
  inverted to `#7fb681`. Worth replacing with a straight measurement.
- The dialog's card is the screengrab, cropped and corner-clipped at 13px, on
  instruction — the scrim pixels in its corners are what the radius removes. The
  scrim, the white ✕ and an invisible button over the blue band are live.

#### The strip is elevated over the listing (2026-08-21)

Asked for: a slight downward shadow with some blur, Material-style, so the
controls sit above the listing rather than beside it.

- **M3 level 2, softened** — the spec's own value for a top app bar with content
  scrolled under it, two layers (`0 1px 2px` key, `0 2px 6px 2px` ambient) so it
  reads as a raised surface. Alphas are M3's 0.30/0.15 taken to 0.18/0.10: at
  360px the spec value read as a firm edge where a lift was wanted.
- **On the slot, not on `ChipStrip`.** The slot's `overflow-hidden` exists to
  clip the strip as it slides away, and it crops a shadow cast from inside.
- **The header block needed `relative z-20`.** The scroller is a later sibling,
  so it painted straight over the shadow — the first attempt shipped invisible
  and that is how this was found. Below the mic (`z-30`) and the sheets.
- No shadow with nothing to cast it: it drops while the strip is hidden, and in
  A when there are no contextual chips. The test is `chips.length`, not the
  measured height, so the server and first client render agree.
- M3 uses elevation *or* a divider. This carries both, the rule having been asked
  for the day before — say the word and the rule goes.

#### The chip strip hides on scroll (2026-08-21)

Amazon's behaviour, asked for: the strip leaves once the buyer is **1.5 folds**
down and still scrolling down, and comes back the moment they scroll up.

- `FOLDS_BEFORE_HIDE = 1.5` (two until 2026-08-21), measured against the
  **scroller's own height** rather
  than a pixel count, so it means the same thing on any frame. Above that line
  the strip is always up.
- `SCROLL_EPS = 4` px counts as a direction — without it a trackpad's jitter
  flips the strip on and off while the list sits still.
- The slot's height collapses *and* the strip slides up, so it reads as leaving
  rather than being squashed. Both drop under `prefers-reduced-motion`.
- The height is measured into state: a transition needs a number at both ends,
  `auto` is not one, and staying `null` until after mount is what keeps the
  server's markup and the first client render identical.
- **A departure for B and D**, where the strip is the only way to Sort and
  Filters — `TopChipBar` said it should never leave. Two folds to lose it and one
  gesture to recover it is the trade Amazon makes with the same controls; the
  comment there now says so.
- Applying a filter scrolls the list to the top, which brings the strip back on
  its own. A's bottom bar is untouched.
- Verified on `/b` and `/userjourney`: visible at rest and one fold down, gone
  at the threshold while scrolling down, back on a 100px scroll up, and the listing
  runs under the app bar with no gap left behind.

#### A rule under the chip strip (2026-08-21)

Asked for: white chips on a white strip over a white listing left the controls
floating with nothing to say where the band ended. 1px in the app's `hairline`
(`#cccccc`), edge to edge like the app bar above it — all three chosen rather
than assumed.

- On `ChipStrip` itself, so B, D and `/userjourney` take it from one place, and
  A and C inherit it. A flag there would fork the row all of them share.
- `border-b`, not a child rule: the strip scrolls horizontally and a border does
  not scroll with its contents.
- A's strip collapses when there are no chips, and the rule goes with it.

#### The whole card is the tap target (2026-08-20)

Corrected on feedback: the journey card linked from its `VIEW DETAILS` strip
alone, on the reading that the strip is the control. It isn't — the strip exists
to teach a new buyer that the card opens, and the live app opens on a tap
anywhere.

- A **stretched link**: `absolute inset-0`, `z-10`, last in the DOM, with the
  product title as its accessible name. Not a wrapper — `<a>` may not wrap
  interactive content, and the pack pills are buttons.
- The pills lift to `z-20`, so picking a pack re-prices the card and does not
  navigate. Verified: title, image and strip all open the product; a pill stays
  on the listing.
- **B and D followed the same day**, with a detail route each at
  `/b/product/[productId]` and `/d/product/[productId]`. Both render the
  journey's `ProductDetail`, that being the only detail design in existence,
  parameterised by `homeHref` so each variant stays a closed loop and by
  `cartBadge` so only the journey carries its screengrab's 3.
- Cards link through **`productBasePath`**, a string. A builder function failed
  the build: the pages are Server Components and `PlpScreen` is a Client one, so
  a function prop cannot cross the boundary.
- **A and C pass nothing and stay inert**, being parked.
- Verified on all three: tapping a card body opens the product, a pack pill
  stays on the listing, and Home returns to `/b`, `/d` or `/userjourney`
  respectively.

#### The floating mic is on the listings too (2026-08-20)

Asked for, and the live app has one: it appears in three of the four
screengrabs, over the home and over both listing screens. `components/ui/MicFab`
now serves all of them.

- **Inert**, `pointer-events-none` — no voice search behind it, and taps fall
  through to the card underneath.
- Re-measured in the move: 47px circle, 2px `#023d8c` ring, 13 × 21 glyph, 20px
  right, 78px up. The home's had been eyeballed at 54px and 18px up.
- 78px clears A and C's control bar and the journey's basket bar alike, so the
  PLP anchors it to the frame rather than to whatever is under the list — which
  is also what keeps it still while the listing scrolls.

#### Price is a bottom sheet (2026-08-20)

The Price chip opened an anchored dropdown; on request it now opens the same
`Sheet` shell Sort uses. The strip has one way of opening things instead of two,
and the positioning arithmetic the dropdown needed — root-relative `left`/`top`,
a clamp so a right-scrolled chip couldn't push it off the frame, `MENU_WIDTH`,
`rootRef` — is gone with it.

- **No glyph column**, unlike Sort: the checkbox is the row's leading element.
- Rows are the Filters screen's own `OptionRow`, so Price Range looks the same
  wherever it is reached, counts included.
- **Applies live and stays open**, where Sort commits and closes — Sort holds one
  value, this holds several.
- Verified on `/b`, `/d` and `/userjourney`: bands tick live into the query
  string, the sheet survives two ticks, the chip reads `Price (2)`, and the ✕
  closes it.

#### The bottom bar is out (2026-08-20)

The basket bar owns the foot of a SOLV listing — it is in the live app's own
screengrab, and `SHOW_CART_BAR` is the only reason ours isn't showing. A pinned
Sort · Filters bar is a second bar competing for that edge, so the placement
question answered itself and the A/B is over.

- Work is on the **top-chip screens only: `/b`, `/d` and `/userjourney`**.
- `/userjourney/seller/kartik` moved onto `variant="top-chips"` the same day.
  Sort, Filters, the chip strip, the discard toast and the rail all behave as
  they do in B; verified end to end (Sort → *Recently Added*, Filters → *Gender
  → Women*, 1 badge, vertical settled, Size on the rail).
- **A and C are parked, not deleted.** The routes stay live and shareable and
  the `bottom-bar` branch of `PlpScreen` stays with them; nothing further goes
  in. A park is reversible, and deleting the pair would take the comparison
  that produced this decision with it.

#### Deliberately not built

- **The home rails are inert.** *Order Again* and *Top Brands* are drawn in
  full (2026-08-20) but nothing there navigates: the products are Magic Fit's,
  out of the live app, and match nothing in either catalog. Both rails are
  `overflow-x-hidden` like the banner — each shows the sliver of a further card
  the screengrab shows, and a peek you can scroll to and find blank reads as a
  bug where one you can't reads as the carousel it stands in for.
- **Rangmayee's brand tile is a `#d9d9d9` placeholder.** It is the second tile
  in the screengrab, and the floating mic sits over its right quarter — taking
  the last letter of the wordmark and the tail of the tagline with it. A crop
  with a hole in it or a hand-set imitation of somebody's logo are both worse
  than the placeholder this repo already uses for brand art it doesn't have. A
  supplied logo file drops straight in at `public/journey/home/`.
- **The cart bar is hidden**, `SHOW_CART_BAR = false` (on request). Kept whole:
  there is no basket to fill, so it could only print the screengrab's fixed
  ₹717, and a total that never moves invites the question of why. One constant
  brings it back on both screens.
- **The seller header scrolls away** with the listing rather than staying
  pinned — it is context you read once, and 66px of it is worth more as
  results. The app bar and chip strip stay fixed.
- **One image in the detail gallery.** The real screen shows front and back;
  only front crops exist, so it is centred rather than repeating the front and
  calling it a back view. It still scrolls, so a second render needs no change.
- **Men's cards show a button-up shirt.** No men's tee render exists in any
  screengrab — the same ask already open against the main catalog, more visible
  here because everything is a tee.
- ~~**The quantity stepper is live but local.**~~ **Closed 2026-08-21** — it
  now drives a real line: `price/pc × set size × qty`, feeding the subtotal
  band, the basket bar and the free-delivery dialog. What is still not built is
  the basket beyond one line: `GO TO CART` goes nowhere, and the pack pill's
  quantity badge from the screengrab is left off because `SetPills` is shared
  with A–D's cards, which have no basket at all.

#### Verified

- Rails: A 13, B 13, C 17, D 17, A+1 category 18, B+1 category 18 — unchanged.
  Bottom bar present in A, C and the journey; absent in B and D.
- The journey: `Show 164 results` at `?gender=women&size=s,m,l`, matching the
  count computed from the catalog independently. Size offers letters only, no
  age bands. The active pack moves to one carrying a ticked size.
- 109 tests green (15 new), lint, typecheck and production build clean.

#### Open

- **Is the cart bar hide-on-scroll?** It is in one screengrab and absent in the
  other, scrolled further down the same listing. Two stills can't prove a
  behaviour, so it is pinned — and now hidden anyway.
- A's control says `Filters`, B and D's chip says `Filter`. The frames already
  disagreed on the glyph (`filter_alt.svg` vs `funnel.svg`); the label differs
  too, which was not recorded until now. In an A/B about control placement, a
  different word is a second variable.
- The three-casing seller name, the two `Set of:` spellings, and the inferred
  title-casing rule all want a designer's confirmation.

### 2026-08-25 — the first tap goes fullscreen, for demoing on a phone

The address bar was showing in Chrome and Firefox on Android and making the
prototype read as a web page. **A page cannot hide it on load** — browsers took
that away on purpose, since a site that can hide the URL is a site that can
impersonate another one — and `window.scrollTo(0, 1)` is both long dead and
inapplicable here, the document never scrolling.

So `components/ui/FullscreenOnTap.tsx` in the root layout: on a phone, the first
`pointerdown` anywhere requests fullscreen. It renders nothing and shows
nothing, which is the point — a floating expand button was the alternative, and
that is chrome in no Figma frame sitting on screens stakeholders are meant to be
judging. The tap they were going to make anyway does it, and still does whatever
it was for; the listener never calls `preventDefault`.

`(pointer: coarse)` keeps it off desktops, where the app already sits in the
phone mockup with room to spare and going fullscreen on the first click of every
dev session would be its own bug report. The listener stays rather than firing
once: exiting fullscreen mid-demo is usually accidental, so the next tap puts it
back.

**iPhone Safari is not covered and cannot be** — it implements
`requestFullscreen` on video only, never on a document element. The feature test
keeps it quiet there instead of throwing. The iOS answer is Add to Home Screen,
which wants a web app manifest this repo doesn't have; it would also remove the
tap on Android. Not built, and open.

**Verified** with a stubbed `requestFullscreen`, phone and desktop contexts:

| | phone (coarse) | desktop (fine) |
|---|---|---|
| before any tap | 0 calls | 0 calls |
| first tap | 1, `{navigationUI: "hide"}` | 0 |
| the tap still navigated | yes | yes |
| further taps while fullscreen | still 1 | 0 |
| after exiting fullscreen | asks again | 0 |

What that does **not** cover is the browser's half — whether Android Chrome and
Firefox actually hide the bar in response. There is no Android browser in this
environment to watch it happen, so that one is for the next real demo.

### 2026-08-25 — the Sort sheet names its default

`Popularity` now reads **`Popularity (Default)`**. It is where every listing
starts and what a bare URL means, and the sheet gave no sign of that: Sort's dot
reports *not default* without ever naming what default was, so a buyer three
sorts deep had no marked way back to the untouched state.

In the `SORT_OPTIONS` label rather than a flag on the row — that string is the
only thing `SortSheet` reads, and a `default: true` would need markup to render
it, for one word on one option that never moves.

Verified at 360px: the row sets on one line, as does the longest label beside it
(`Price/pc (low → high)`); the active treatment is untouched — bold, primary,
glyph tinted, check — and tapping it still applies, closes, and leaves the URL
bare, Popularity being omitted from the query by design.

### 2026-08-28 — the offer chips go fully rounded

The four offer chips — Cashback, Seller Offer, Target Scheme, Free Delivery —
take a `999px` corner. Sort, Filter, Price and the vertical chip keep 8px.

**This reverses *One radius per row* (2026-08-14) on purpose, and the reversal
is narrower than it looks.** What made three radii read as a mistake then was
that they meant nothing: the same kind of chip drawn three ways because three
Figma frames disagreed with each other. This is two radii carrying a rule you
can state and then read straight off the strip — **a pill toggles a filter
value in place, a corner opens a surface.**

**Price keeps its corner on exactly that test.** It was the one genuinely open
question here: it lives among the offer chips and reports filter state like
them, but it *opens a sheet*, which is the side of the line Filter is on. It
also sits beside Filter on the far side of the frame's own divider, which
already draws the same boundary — so the shape now agrees with a separator that
was there all along.

**The vertical chip keeps 8px** for a second, independent reason: it is the
strip's only chip with a full-bleed square thumbnail flush to its leading edge,
and a full radius clips that photo to a half-moon. Tried and rejected by
looking at it.

Applied to every screen, like the chip order it follows. Verified by DOM audit —
journey `Filter=8px` then four at `999px`; D `Sort=8px · Filter=8px · Price=8px`
then four at `999px`.

### 2026-08-28 — Target Scheme comes back, and the offer chips take a new order

**Eighth item.** The strip's binary chips are now **Cashback · Seller Offer ·
Target Scheme · Free Delivery**, in that order, and Target Scheme is a chip
this prototype has not had before.

**It is not a new offer — it is the retired one.** `GOLD Target Scheme` went
out on 2026-08-19 with the rest of the GOLD branding, and the note then was
that retiring **never meant deleting**: `OFFERS.filter` runs its predicate once
per entry, so removing a row would take a `rand()` out of the middle of the
sequence and re-roll the whole catalog. It stayed, was drawn at 0.55, and the
result was thrown away.

That is exactly what makes bringing it back free. The draw already happened, so
**no rand call moves**. Measured before and after:

| | before | after |
|---|---|---|
| Bulk Offer | 450 | 450 |
| Cashback | 245 | 245 |
| Free Delivery | 165 | 165 |
| **Target Scheme** | — | **573** |
| Seller Offer (`hasOffer`) | 674 | **875** |
| products with no offer | 396 | 195 |

Kartik's catalog moves the same way and for the same reason: `239 / 104 / 75`
unchanged, Target Scheme 296, Seller Offer 331 → 440. Every category, gender
and price count is untouched, and `seed.test.ts` — which pins the seven
category counts — passes unchanged. `Seller Offer` growing is the intended
consequence, not a side effect: products whose only offer was this one had none
before.

The **GOLD name went with the branding**; the scheme kept its own. A test
asserts `offers:target-scheme` is on the strip and `offers:gold-target-scheme`
never comes back with it.

**`OFFERS` is now explicitly typed.** With nothing carrying `retired`, TypeScript
inferred the property away and the three files reading it stopped compiling —
so the annotation is what keeps the retire-without-re-rolling mechanism
available for the next one.

**The order forced a reshape.** `OFFER_CHIPS` was one entry per facet
(`hasOffer`, then `offers` filtered to a pair) and took whatever order the
`OFFERS` table happened to be in. The requested order **interleaves the two
facets** — Seller Offer sits between two `offers` options — which that shape
could not express. It is now one chip per line, facet and option together, and
still the whitelist it always was: Bulk Offer is a real offer on the cards and
in the Filters panel, and stays off the strip by not being listed. Each facet's
discriminating options are computed once and looked up, rather than once per
chip.

**The icon arrived hours later** and is in — `public/offers/target-scheme.png`,
a blue ring under an orange arc, 240×240 with alpha. It is the one offer icon
with real headroom: it draws at 20px in the 26px box, where `cashback.png`
(48×37) and `seller-offer.png` (48×48) have almost none and are logged as
wanting vectors. In the gap the chip rendered label-only, which is what `icon`
being optional buys; nothing was drawn in to fill it, and the retired
`gold-*.svg` exports were deliberately not used as a stand-in. Verified: no
404s, natural 240×240 drawing at 26×26, and the checkmark still replaces it on
selection per M3.

**Applied to every screen**, not just `/userjourney`: the catalog is shared so
the revival is global regardless, and the offer chips are identical in all four
variants, so a per-route order would be config for no stated reason. Verified —
journey `Filter · Cashback · Seller Offer · Target Scheme · Free Delivery`, C
and D the same after Price, A unchanged (its strip is verticals until one is
picked). Tapping the chip writes `?offers=target-scheme` and the cards carry
the pill. 124 tests green, lint and build clean.

### 2026-08-28 — the journey's chips come down to 40px

**Seventh item**, and a consequence of the second: the strip lost its vertical
chips, and 44px existed because **that chip's thumbnail was its height**. With
no image in the row there is nothing to size around, so `/userjourney`'s chips
are 40 and the strip is 65px rather than 69.

**40, not the frame's 32.** The thumbnail was only half the argument for 44 —
the other half is the touch floor, a kirana retailer tapping a chip on a
mid-range Android, and that survives the picture going. 32 is M3's value and the
frame's, and it would put every chip in the row under the floor to save 8px
once. Flagged before building rather than after.

**Still one height for the whole row.** `CHIP_H` split into `CHIP_H_TALL` and
`CHIP_H_SHORT`, and is now threaded from `PlpScreen` rather than imported
directly by `TopChipBar` — but the screen picks it once and both the Sort/Filter
chips and the contextual chips take the same value. Two heights in one
scrolling row is still the thing that looks broken.

**Chosen from `controls.verticalChips`, not from the chips on screen.** Read off
the current contents it would be right today and fragile tomorrow: a strip that
gained or lost a vertical chip mid-filter would change height under the buyer.
The flag is a property of the route.

C and D carry no vertical chips either, the vertical being page scope there.
They keep 44 deliberately — the flag is what selects the short chips and they
don't set it, so the 2×2 is untouched. Setting it is a one-word change if the
same is wanted there.

**Measured:** journey chips 40, one height across all four, strip 65px; A, C and
D unchanged at 44 and 69. 124 tests green, lint and build clean.

### 2026-08-28 — Price Range gets a typed min and max, above its bands

> **Amended within the hour.** This shipped first as *inputs instead of* bands,
> which is what was asked for; the ask was then reversed to *inputs as well as*
> — "add the price range checkboxes as well" — and an inverted range went from
> filtering honestly to being refused outright. The entry below describes where
> it landed. The intermediate state never left this machine.

**Sixth item off the stakeholder review**, `/userjourney` only, and the reason
given was the whole argument: *we can't predict the exact range the customer
might be looking for.* The panel now carries **two boxes above the five bands**.
The bands are the fast path and keep their live counts; the boxes cover what the
bands don't.

**The two are exclusive, and visibly so in both directions.** Ticking a band
clears what was typed **and disables the boxes**; typing a range **disables the
bands**. Clearing either hands the other back. The second direction was added
after the first shipped — one rule that only shows itself one way round reads
as a quirk of whichever control you touched first, and doing both retires the
last silent half of the rule, since typing can no longer clear a ticked band
without saying so. Both are
values on the `price` facet, where values OR — so leaving both standing would
*widen* the result, and a buyer who typed 150–450 and then ticked *Under ₹200*
would be shown ₹80 shirts. Disabling was asked for after the fact: exclusivity
was already enforced but silently, so the rule only became visible once it had
cost someone their typing. Greyed rather than hidden — a control that vanishes
reads as a bug, and the panel keeps a steady height as bands are ticked.

**`min > max` is refused, not filtered** (asked for the same day). It used to
match nothing and hand back `Show 0 results`, which is accurate and says nothing
about why. Now the draft never takes it, both boxes take a red border, and a
toast says `Min price can't be higher than max` — **on blur, not per
keystroke**, or typing `9` into min against a max of 450 would scold you
mid-number. It names the rule rather than a field, because the app can't know
which of the two the buyer meant to change; either one fixes it.

That forced the boxes to hold **local text state** rather than being controlled
straight from the draft. The obvious build is wrong the moment a rule refuses a
value: editing min to 900 against a max of 450 would be rejected, the draft
would keep 150–450, and the box would snap back under the cursor. The text is
local, only a valid pair reaches the draft, and a render-time
`derive-from-props` re-seed empties the boxes when something else clears the
range — Clear Filters, or ticking the band it is exclusive with. Not an effect:
React 19 flags `setState` in one as a cascading render, and it would paint the
stale value for a frame first.

**The toast moves while the sheet is up.** At the listing's own offset it landed
over the sheet's `Clear Filters` / `Show N results` footer. It blocks nothing —
the wrapper is `pointer-events-none` — but covering the control you are being
told about is the wrong place to say it, so it sits 8px above that footer
instead, where it reads as belonging to the sheet. Measured: toast bottom 69
from the frame, CTA top at 49, no overlap.

A–D keep the bands alone. Their Price chip opens a sheet built from exactly
those, and nothing there can produce a range.

**It needed an engine change, not just a UI one.** The price facet matches
discrete band ids (`p-200`, `p-400`…), and a typed range has nothing to match
against. Two optional hooks on `FacetDef`, both used by Price alone, both kept
as registry fields rather than engine special cases so adding a facet is still
one array entry:

- **`matches`** overrides the default set-membership test over `valuesOf`. The
  alternative was letting `valuesOf` see the price selection, and the registry's
  standing rule is that **Size is the only selection any facet may see** —
  widening that to "its own" would make the dependency invisible again.
- **`accepts`** widens the id validation in `parseSelections`, which drops
  anything not in the facet's `options`.

**The second one was found in the browser, not by reading.** The range filtered
correctly in-session and came back empty on reload, because a shared
`?price=150-450` was being thrown away by the guard that stops
`?seller=nonsense` emptying a listing. The guard is right and stays: `?price=junk`
is still dropped, `?price=-` is not a range either. **A facet that overrides
`matches` almost certainly needs `accepts` too** — that is the rule this leaves.

**Bands and ranges share one facet.** Both answer "which prices", and two
facets would AND, so a buyer who typed 150–450 would have to clear a band to
see anything. Within one facet they OR like any two values, and nothing offers
both at once today.

**Counts are untouched**, which is what still lets A–D show live band counts on
a facet the journey drives with an input: `facetOptionsWithCounts` already
excludes a facet's own selections, so a typed range cannot move them. A test
asserts the bands count identically with and without one.

Two smaller calls: **`min > max` matches nothing** rather than being swapped or
suppressed — a transient typing state the footer reports honestly as `Show 0
results`, where swapping would filter on something never typed; and the boxes
are **controlled straight from the draft** with no local text state, so Clear
Filters empties them by the same path it empties everything else.

**Verified** in the running app at 360px:

| | |
|---|---|
| empty | `Show 540 results` |
| min 150 | `Show 502` |
| 150–450 | `Show 501`, URL `?price=150-450`, every price in range |
| min → 900 against max 450 | count **stays 501** — the draft refused it |
| blur while inverted | toast `Min price can't be higher than max`, both boxes red |
| tick *Under ₹200* after typing | boxes empty, `Show 145` — exclusive |
| reload `?price=150-450` | boxes prefill `150` / `450`, Clear enabled |
| Clear Filters | URL emptied, boxes empty |
| `?price=junk` | ignored, full listing |
| A `/results?q=shirt` | five bands with live counts, no inputs |

124 tests green, lint, typecheck and build clean.

### 2026-08-28 — Filters becomes a bottom sheet, so the listing stays behind it

**Fifth item off the stakeholder review**, `/userjourney` only. The Filters
screen was full-bleed; it is now a sheet at **80% of the frame**, with the
listing dimmed behind it.

The reason given, and it is the right one: a full-bleed panel is the only
surface in this app that takes the buyer off the page they were on. They tick
four things against a listing they can no longer see, and the sole report of
what changed is a number in the footer. At 640 of 800 the app bar, the chip
strip and the top of the first card stay visible, so filtering reads as
happening *to* something.

**80% was chosen from both ends.** Much taller and the context it exists to
preserve is a grey sliver; much shorter and the rail — 60px a row, sixteen rows
inside a settled vertical — shows too few of them to navigate. It is a
percentage, not a pixel height: `DeviceFrame` renders edge to edge below 480px,
so the frame is `100dvh` on a phone and 800 only in the mockup.

**The motion goes back to `sheet-in`/`-out`, and that is not a reversal.** The
2026-08-25 note that replaced them with `screen-in` is an argument about
*distance*: `translateY(100%)` on a panel pinned to `inset-0` is the whole 800px
frame, and 800px of literal travel reads as an elevator ride. At 640px the
distance is a sheet's own height again, which is exactly what that keyframe was
written for. A–D keep `screen-in`, being full-bleed still.

**The scrim is a real exit**, so it runs through `dismiss` — the same
discard-checking path as the ✕, not a bare `onClose`. Dismissing mid-edit still
says `Selection discarded`; dismissing untouched still says nothing. Verified
both.

**The shorter panel moves the search-field threshold**, which is the one
knock-on worth knowing. `SHEET_PANEL_VIEWPORT` is 530 — 640 less the same 49px
header and 61px footer — against the full-bleed 690:

| | full-bleed | sheet |
|---|---|---|
| checkbox rows before a field | 14 | **11** |
| tiles before a field | 19 | **13** |

So Size (13 options) now earns a field on this route where it didn't. `needsSearch`
takes the viewport as an argument defaulting to the full-bleed value, so A–D
are untouched, and a test pins both pairs. Still computed rather than measured,
for the documented reason: the server has no viewport, and a measured rule
would render no field on the server and add one after hydration.

**Verified** at 360px: sheet 640 of an 800 frame, 160px of listing visible,
scrim present and dismissing correctly; A and D still full-bleed at 800. 121
tests green, lint, typecheck and build clean.

### 2026-08-28 — the journey gets its own rail order

**Fourth item off the stakeholder review**, from a whiteboard photo, and
`/userjourney` only. The rail is now:

```
Sort By · Price Range · Margin · MOQ · Category · Brands · Seller · Seller City
  └─ attributes ─┐ Colour · Fabric · Size · Fit · Neck · Sleeve · Pattern · Closure
```

Ten rows across verticals, sixteen inside one. **Dropped: Gender, Delivery
Time, Offers, More Filters.**

**A second array, not a re-order.** A–D keep `RAIL_ORDER`, which follows a
reference apparel PLP and is pinned by its own test. `JOURNEY_RAIL_ORDER` is
this route's, and the two are allowed to disagree — the journey has never been
part of the 2×2. `getRail`/`getRailFacetIds` take a `RailPreset` *name* rather
than an array, so both orders and the tests that pin them stay in `facets.ts`
and nothing has to cross the Server/Client boundary.

**"Attributes" is eight rows, not one**, settled on the call. The whiteboard has
it as a single line, but the instruction was that Size, Colour and Fabric "show
at the bottom, those are attributes" — a grouping by position. One merged row
would have stacked ~60 options behind a single rail entry and earned a search
field. Colour and Fabric sit in that block and stay visible whether or not a
vertical is settled: grouping them is about where they are, not when they show,
and Cotton means the same on a shirt as on a tee — the standing reason Fabric
never joined the vertical block.

**Two of the four removals cost something, and both were paid for.**

**Gender was this journey's documented cut.** *Gender → Women* is what settled
the vertical and unlocked Size. The replacement is **Category → Women's
T-Shirts**, which settles it identically — Kartik carries exactly three
verticals, one of them women's — so Size still appears and the rest of the flow
is unchanged. The demo script was updated; nothing else was.

**Offers owned `hasOffer` and `offers`, which the three strip chips select.**
Dropping the row would have left `All filters cleared` closing onto a lit
Cashback chip. `FilterScreen` now takes **`clearsAlso`** — facets the *listing*
shows that the rail doesn't — and `PlpScreen` derives it from the chips
actually on the strip, so it stays right as the strip changes. Still a named
set, never a blanket reset: wiping a filter from a screen that never showed it
is the trap the rail filter exists to avoid, and a chip the buyer can see and
toggle is not that.

They are deliberately **not** added to `filterCount`. A lit chip already reports
itself, and counting it on the Filters badge as well is exactly the
double-reporting that badge rule exists to prevent.

**Verified** in the running app at 360px:

| | |
|---|---|
| journey rail | `Sort By · Price Range · Margin · MOQ · Category · Brands · Seller · Seller City · Colour · Fabric` |
| journey, `?category=womens-t-shirts` | the same, then `Size · Fit · Neck Type · Sleeve Type · Pattern · Closure Type` |
| A `/results?q=shirt` | unchanged — 13 rows, Gender and Offers and More Filters included |
| `?offers=cashback&price=under-200` → Clear Filters | both extinguished, URL emptied, Seller Offer correctly reappears |

118 tests green, lint, typecheck and build clean. Two new tests pin the journey
rail in full and the clear-scope fix.

### 2026-08-28 — Sort moves inside Filters, and the Price chip leaves the strip

**Third item off the stakeholder review**, `/userjourney` only. The strip is now
**`Filter` · Seller Offer · Cashback · Free Delivery** — no Sort chip, no Price
chip, no verticals.

**Sort By is the first row of the Filters rail**, above Category. Its panel is
the five `SORT_OPTIONS` as single-select rows: no checkbox, because every other
row on that screen is a set and a checkbox would promise a second tick the list
can't hold. They take the Sort sheet's own active treatment instead — glyph
leads, active row bold, primary, icon tinted — at `OptionRow`'s 52px, so the
panel keeps one row pitch whichever rail entry is open.

**It joins the draft**, which was the follow-up worth asking:

| | |
|---|---|
| tap a sort | draft only — the listing behind the panel does not move |
| `Show 540 results` | commits sort *and* filters, writes `?sort=`, closes |
| `Clear Filters` | filters go **and** sort returns to Popularity |
| `✕` after a sort tap | `Selection discarded` — the sort goes with it |

Clear resetting the sort is a deliberate stretch of that button's label, taken
on the call: one control returns the screen to its untouched state rather than
leaving one row of it standing.

**Three implementation notes that are easy to undo by accident:**

- The rail id is the synthetic **`__sort`** with `facetIds: []`, deliberately
  not a facet id. Sort is one value where every facet is a set and it is not in
  `FACETS`, so nothing may look it up in `FACET_BY_ID` — the empty `facetIds`
  is what lets every count, clear and orphan path that walks the rail by facet
  run unchanged.
- **Supplying `sort` to `FilterScreen` is what turns the row on.** A derived
  flag rather than a second prop, so there is no way to show the row without
  its value.
- **`SORT_ICONS` moved to `lib/filters/sortIcons.ts`.** The sheet was the only
  surface drawing that set; now there are two, and a map owned by one would
  make the other import from a sibling it has nothing else to do with. The set
  is drawn at one weight and is the unit that gets reweighted — that is the
  rule the move preserves.

**The three departures share one prop.** `controls` on `PlpScreen` —
`verticalChips`, `priceChip`, `sortInFilters` — replacing the standalone
`verticalChips` added hours earlier. One object because they are one idea, and
a prop per stakeholder remark is how a shared screen grows a dozen of them.
Every field defaults to the documented behaviour, so a route opts out, never in.

**`sortInFilters` is honoured on `top-chips` only**, and says so rather than
half-working: the `bottom-bar` pill is a designed 240px surface with two halves
either side of a 32px rule (Figma `697:2658`), and a one-control pill is a
shape no frame draws. A and C would need a pill design first.

**Dropping the Price chip strands nothing** — Price Range is a rail facet too,
so the bands stay reachable in the Filters panel, where the very same
`OptionRow`s already render them. That is why this is allowed where switching
off a chip-only facet would not be; a test asserts the facet is still on the
rail with the chip gone.

**Verified** in the running app at 360px:

| | |
|---|---|
| journey strip | `Filter · Seller Offer · Cashback · Free Delivery` |
| journey rail | `Sort By · Category · Gender · Brands · …` — 14 rows |
| Sort By panel | 5 rows, `role="radio"`, dot on the rail once off default |
| `?sort=price_asc` | prices ascend 95, 100, 100, 100, 105 … |
| `?sort=price_desc` | prices descend 455, 450, 450, 450, 445 … |
| A, C, D | strips and rails unchanged; no variant opens on Sort By |

116 tests green, lint, typecheck and build clean.

### 2026-08-28 — the journey strip drops the vertical chips and leads with price and offers

**Second item off the stakeholder review.** `/userjourney/seller/kartik` no
longer surfaces product-vertical chips at all. The strip is **Price · Seller
Offer · Cashback · Free Delivery** from the first paint — the chips that used
to appear only *after* a vertical was settled.

The reasoning given: a buyer already inside a storefront has not come to choose
between tee types, so the strip should lead with the filters that actually
narrow a listing they are already looking at.

**The picked chip goes too**, which was the follow-up worth asking. Today a
vertical, once picked, keeps leading the strip as the way back out; the call
was that the strip carries no vertical in **any** state. The accepted cost:
after *Gender → Women* nothing on the listing names the cut, and the Filters
count badge is the only report of it — a knowing regression of UX backlog item
1, logged rather than argued.

**Journey only.** A and B keep their seven vertical chips; C and D never had
any, the vertical being page scope there. So the 2×2 is untouched, and this is
the second behavioural departure on this route after the control placement.

**A prop, not a mode.** `verticalChips` on `PlpScreen` (default `true`) feeds
`contextChips(..., { verticals })`. Deliberately not `VerticalMode.locked`,
which answers a different question — it makes the vertical page scope and takes
**Category and Gender off the rail** with it. The journey needs both: *Gender →
Women* is its central cut, and it is what settles the vertical that puts Size
on the rail. This changes the strip and nothing else.

**Verified** at 360px against the running app:

| | strip |
|---|---|
| journey, nothing picked | `Sort · Filter │ Price · Seller Offer · Cashback · Free Delivery` |
| journey, `?gender=women` | the same, with `1` on the Filter chip |
| A, `/results?q=shirt` | unchanged — all seven vertical chips |

No empty-strip risk anywhere: probed across the journey, A/B and C/D, every
scope carries a populated Price menu, Seller Offer, Cashback and Free Delivery.
115 tests green, lint and typecheck clean.

### 2026-08-28 — the journey goes back to top chips, and the toast learns where the floor is

**The stakeholder review asked for Sort and Filters at the top**, so
`/userjourney/seller/kartik` is `variant="top-chips"` again — one prop, the
third placement this screen has held, and a reversal of the UXR-driven move
three days earlier.

That research is not withdrawn and the pill is not at fault. The call is that
the demonstration flow should show what the live app shows, which puts the
route back to 1:1 with its screengrabs in behaviour as well as pixels — the
08-25 move was the only departure on it that was ever about behaviour. **A and
C keep the pill**, so the comparison is still placement and nothing else.

**The switch surfaced a real bug, and it was not new.** The toast asked the
*variant* where to sit — `clearsBottomBar`, 72px in A to clear a full-width
bar, 24px in B, which had nothing down there. Both premises expired on
2026-08-21, when A's bar became a floating pill that rides the basket bar and
every listing started carrying a basket:

| | pill / bar occupies | toast sat at | |
|---|---|---|---|
| A, C — empty basket | 12–64 | 72–104 | fine, 8px clear |
| A, C — line in basket | **76–128** | 72–104 | **behind the pill** |
| B, D, journey — empty | — | 24–56 | fine |
| B, D, journey — line | **0–64** | 24–56 | **covered outright** |

The last row is the one the move would have shipped, and on the worst possible
route: the journey's whole flow is filling a basket, so *every* `All filters
cleared` would have landed under the basket bar unseen. Since 2026-08-25 that
is a toast a buyer sees on every clear, not a rare discard.

**The fix reads the foot instead of the variant.** `toastBottom` in `PlpScreen`
is `foot + TOAST_GAP` where `foot` is the pill's top in A and C and the basket
bar's height in B, D and the journey, or `TOAST_INSET` (24) when there is no
foot at all. `Toast` takes a number now rather than a boolean, because only the
caller knows what is on screen. Both cases that were already right land on
their existing numbers — 72 in A with an empty basket, 24 in B — so nothing
moved except the two that were broken.

**Verified** at 360px, `deviceScaleFactor: 3`, with a line in the basket:
toast bottom 72 from the frame, top 104, basket bar top at 64 — measured in the
DOM, no overlap, and the mic still at its measured 78. Lint, typecheck and 114
tests green.

### 2026-08-25 — the journey moves onto the floating pill, on UXR

Research says the bottom placement tests better, so `/userjourney/seller/kartik`
takes it. Sort and Filters leave the chip strip for the 240px pill; the strip
keeps the contextual chips, as it does in A and C.

**Both reasons it was on top chips had expired.** It moved there on 2026-08-20
because the basket bar owns the foot of this listing and a *pinned, full-width*
Sort/Filters bar was a second bar fighting for the same edge — true of the bar
`638:2836` draws, and the journey is where that was concrete, being the one
screen here with a basket bar at all. Figma `697:2658` answered it on 08-21 with
a pill that floats 12px *above* the basket bar instead of taking a band off the
frame, which is what un-parked A and C — and `pillBottom` in `PlpScreen` already
reads `CART_BAR_H`, so nothing had to be built. That left the narrower reason,
that its screengrab shows top chips, and research outranks a still frame of one
screen. **It is the first departure on this route about behaviour rather than
pixels**; the card, the chrome and every measured value still follow the grabs.

#### It surfaced a collision that was already there

With a basket line the pill rides up to 76–128 from the frame's foot, and the
floating mic is fixed at **78–125**. They overlap by 7px of x across the pill's
whole height, and the mic is `pointer-events-none` scenery sitting on a control.
Caught by screenshotting the result rather than by the numbers — nothing failed.

**Latent in A and C, not new here.** `CartProvider` lives in the root layout, so
any variant can grow a basket bar; the journey is simply the flow where someone
actually adds to one.

**The fix was already written down, in the wrong form.** The mic's measured 78 *is*
`PILL_GAP` 12 + `PILL_H` 52 + 14 — the clearance the screengrab shows, recorded
as a single number instead of as a relationship. `MicFab` now takes `bottom`,
`PlpScreen` passes `pillBottom + PILL_H + MIC_GAP`, and it transitions on the
same 200ms the pill and the bar use so all three move as one thing. It is 78
wherever it was 78; the home screens have no pill and keep the default.

**Verified** at 360px:

| | mic | pill | overlap |
|---|---|---|---|
| A `/results`, no basket | 675–722 | 737–787 | none |
| journey, no basket | 675–722 | 737–787 | none |
| journey, with a basket | 611–658 | 673–723 | none |

The resting place is unchanged wherever there is no basket bar, which is what
keeps the measured value honest. Also checked the journey's own cut still runs
from the pill: Filters → Gender → Women gives `Show 191 results`, Size joins the
rail, and applying writes `?gender=women`.

114 tests green, lint, typecheck and production build clean.

### 2026-08-25 — A and B are reached by searching, not by a seller card

The journey was Home → tap *Baheti Garments* → PLP. Tapping one storefront never
explained why the listing that follows spans seven categories, eight sellers and
ten brands — the app bar said Baheti while the Seller facet listed other
companies, which is a question the demo had to talk its way past every time. A
buyer reaching a mixed catalog searches for one. So: **Home → search bar → type
`shirt` → tap a suggestion → the listing.**

```
/search            /b/search            the search screen
/results?q=shirt   /b/results?q=shirt   the listing
```

**Nothing behind it moved, and that is why this was worth doing.** `shirt`
matches **all 1,070** products — every category is a Shirt or a T-Shirt — so the
scope is identical to what the Baheti storefront gave. `Show 1,070 results` in
the Filters footer, every facet count, every test, the whole demo script: all
unchanged. A framing change, not a rebuild.

**Built from two screengrabs at 1080×2400**, exactly 3× the design, so it was
measured off raw pixels rather than eyeballed — bar 46.7 → 47, field 221 × 31.3
at x 58.3, rows 149 + a 3px divider → 50 + 1px `#ebebeb`, leading glyph 19.3 at
13.7 → 20 at 14, label at 54.7 in `#333333`, trailing arrow 11.7 in `#b3b3b3`.
The render measures 47 / 58 / 221 / 31 / 50 back.

**The field flexes**, against the measured 221. Below 480px `DeviceFrame` renders
edge to edge, so a fixed width would strand 30–70px of blue on a 390 or 430px
phone — the trap the Filters panel fell into on 2026-08-21. The margins are the
measured ones, so it is exactly 221 at 360 and takes the surplus above it.

**Three departures, each with a reason:**

- **Labels at 15px where the grab measures 13.** The 13 is solid — reconciled
  across three rows through Roboto's ascender and descender metrics, since
  "tshirt" has no descender and "gym vest" has no full ascender, and both give
  13.1. But the 2026-08-20 pass raised this app's small end deliberately, and
  the vertical chips went to 15 hours earlier on exactly the "looks too small in
  phone" complaint. Shipping a new screen at 13 invites it straight back.
- **`Category Store` darkened** from the measured `#6a9b9b` to `#2f7a78`: 2.9:1
  on white against 4.9:1, the same call the sheet's ✕ green got.
- **The glyphs are drawn, not exported.** `back.svg`, `search.svg` and the mic
  and camera PNGs all exist and are each the wrong colour, weight or shape for
  this bar, and the history dial and fill-in arrow have no export anywhere —
  they are Android's, not SOLV's, and no Figma frame draws this screen.

**Verified** at 360px, A and B:

- Home's search bar opens `/search` (and `/b/search` from `/b`) — it had been
  decorative since the start.
- Geometry measures back exactly: bar 47, field x 58 w 221 h 31, rows 50, eight
  of them.
- Typing `shirt` reproduces the screengrab's eight suggestions verbatim and in
  order, `Category Store` included. They come from a substring filter over a
  vocabulary rather than a lookup, so another query still answers.
- A suggestion goes to `/results?q=shirt`; from `/b` it goes to
  `/b/results?q=shirt` and lands on top chips with no pill. Each variant stays a
  closed loop.
- The results app bar reads `shirt`, and Filters reports `Show 1,070 results`.
- 114 tests green, lint, typecheck and production build clean. `/search` is
  static, `/results` dynamic — a query has no finite set of params to enumerate.

**Open:**

- **`/seller/[sellerId]` still exists and still works.** Removing it is the
  stated next step and was deliberately left out of this change.
- **No screengrab of the results screen.** Its app bar carries the query as a
  plain title through the standard `AppBar`. If the live app keeps the search
  field up there instead, that is the one thing to change.
- The camera and mic in the bar are **inert**, like the floating mic.

### 2026-08-25 — the Filters screen fades in, instead of blinking or travelling

It was the last surface in the app that appeared and vanished between frames.
Sort and Price have animated since the start, the free-delivery dialog scales in
and out, the toast rises and fades — and the one panel that covers *everything*
arrived with no account of where it came from and left the same way. In A and C
the control that opens it is the floating pill at the foot of the screen, so
there was an obvious answer going spare.

**It went out on the sheets' own classes first, and that was wrong.** The
reasoning was clean: the travel is `translateY(100%)` either way, and a panel
pinned to `inset-0` makes 100% exactly the frame's height, so `animate-sheet-in`
/ `-out` needed no variant and the app kept one beat in one place. Measured over
the full 800px it even behaved — enter 142→75→48→19→11→5→1, exit
12→24→41→113→148, decelerating in and accelerating out.

It still felt like too much, and the frame-by-frame numbers are exactly why that
wasn't obvious: **the curve was right and the distance was wrong.** 260ms over a
300px sheet reads as a sheet; the same 260ms over 800px reads as an elevator
ride. What a full-screen surface is doing is *replacing* the screen, not sliding
onto it, and Material moves one about **30dp** and fades it — the distance is a
hint at where the thing came from, not a journey. This app already makes that
trade one property over: `dialog-in` scales 8% and lets opacity do the arriving,
rather than growing the card from nothing.

**So `screen-in`/`-out`: 32px and a full fade.** 30dp rounded onto the 8px grid
this app spaces everything else by. The durations are the **scrim's** 200/160
rather than the sheets' 260/200, because what the animation mostly does now is
change an alpha and the scrim is where the app already declares how long that
takes; the easing stays the emphasized pair, since something is still moving.
It still *rises*, so it still answers the pill at the foot of A and C — at a
twenty-fifth of the movement.

Measured again after the change: opacity 0.58 at ~30ms, 0.83 at ~60ms, 0.95 at
~95ms, so the window where the panel and the listing are both visible is under a
tenth of a second. That overlap is the one cost of a fade over an opaque panel —
M3 avoids it by fading the outgoing surface out *first* — and at this speed it
reads as a cross-fade rather than a double exposure. Worth revisiting if the
panel ever gets slower.

Now that the classes are its own, the `prefers-reduced-motion` block had to be
told about them explicitly, which is the one thing sharing the sheets' pair got
for free. See the trap below.

**The screen now owns its dismissal**, like `Sheet` does and for the same
reason: `onClose` unmounts it, so it cannot be called until the exit animation
has finished. All three exits go through one `exit(...)`, and its two callbacks
sit deliberately on opposite sides of the animation:

- **`commit` runs at once.** The listing is hidden behind an opaque panel for
  the whole 200ms and should already be showing the answer when it is
  uncovered. Apply after and the buyer gets a frame of the old list, then a jump.
- **`announce` waits.** A toast behind that panel is a toast nobody sees, and
  its 2,600ms is no better for losing the first 200 of them.

A `closing` guard sits at the top of `exit`, because the footer stays live while
the panel travels — a second tap on Clear Filters, or a ✕ chased by the CTA,
would otherwise queue a second commit against a screen already leaving.

**The reduced-motion trap, which is why every exit was tested under it:** the
unmount hangs off `onAnimationEnd`, so the media query has to collapse the
animation to 1ms rather than remove it. With no animation there is no end event,
and the panel would strand on screen with no way out. That rule was already
written for the sheets; sharing their classes is what put this screen inside it.

**Verified** at 360px in Chromium, `prefers-reduced-motion` both ways:

- All three exits — `Show N results`, ✕, Clear Filters — animate out and
  actually unmount, in A and in B, under `no-preference` and under `reduce`.
  Twelve cases; `reduce` is the one that would strand.
- The panel computes `opacity: 1` once settled, under both motion settings —
  the check that a fade-in has actually finished rather than parking at 0.99.
- The ✕'s `Selection discarded` and Clear Filters' `All filters cleared` both
  land *after* the panel has gone, not behind it.
- A double tap during the exit closes once and commits once.
- Mid-flight at 55ms: the panel is a few px low and ~85% opaque, the listing
  reading faintly through it. Calm, and plainly the Filters screen arriving.
- 114 tests green, lint, typecheck and production build clean.

**Not changed:** the screen still has no `Sheet`. It is full-bleed and has no
scrim to own, so wrapping it would mean a shell whose scrim, radius, header and
render-prop children it all opts out of; what it needed was the two classes and
an `animationend`, which is what it took.

### 2026-08-25 — Clear Filters clears, says so, and goes back to the listing

Reported as the button not working, which is close to right: it worked on the
draft and nowhere the buyer was looking. `Clear Filters` unticked everything on
the Filters screen and stopped, so the screen sat there looking unchanged apart
from a counter, still asking to be dismissed through `Show N results` — the one
control there whose effect you couldn't see. Tap the button that says it clears
your filters, and nothing you can see clears.

**It now commits and closes**, through the same `onApply` the primary CTA uses.
So `commit` does what it always does: drops orphaned selections, rewrites the
URL, and scrolls the listing to the top. The buyer lands back on an unfiltered
list with every badge cleared, which is what the label promised.

The argument for it, beyond the report: clearing is a *complete* instruction,
not a partial edit. Ticking three boxes leaves a state worth refining before you
commit it — that is what the draft is for — but there is no half-cleared state.
Asking for a second confirmation of an unambiguous action is a step with nothing
in it. Most Indian apps do keep you on the filter screen after a clear, and the
cost here is real: re-picking from scratch means reopening it. One tap, weighed
against an action that currently appears to do nothing.

**It says `All filters cleared`.** This started silent, on the reasoning that
the listing visibly changing was announcement enough. That was wrong, and saying
so is the shorter version: landing on a full listing is *ambiguous*. A buyer who
has just cleared four filters and a buyer dumped there by a bug see the same
screen, and the one thing that distinguishes them is a line of text. Draft edits
made before the tap go with the clear, because that is what clearing means.

So three exits with three voices, and the distinction is worth stating because
it decides what any future one should do:

| Exit | Says | Why |
|---|---|---|
| ✕ mid-edit | `Selection discarded` | A **warning** — edits vanished where nobody could see them go |
| Clear Filters | `All filters cleared` | A **confirmation** — names an unfiltered listing as the answer rather than an accident |
| `Show N results` | nothing | The buyer built the draft and is already watching its result |

Same component, opposite jobs, which is why the cleared wording is flat rather
than apologetic. `onCleared` is its own callback on `FilterScreen` rather than a
flag on `onApply`: the two are different events that happen to share a code
path, and collapsing them would make the plain apply speak too.

**`CLEARED` covers two controls.** The Filters footer and the zero-results
state's recovery button are both called *Clear Filters* and both do the same
thing, so by the rule `DISCARDED` was made a constant for — one event, one
wording — they say the same thing from one string. The empty-state button was
already committing immediately; all it gained was the toast.

**The scope rule is unchanged and now lives in one place.** `clearSelections`
in `engine.ts` filters over `getRailFacetIds()` rather than resetting wholesale,
so a facet the screen doesn't display can never be wiped by a button whose
effect the user can't see. The test used to re-implement that filter inline, and
now calls the function the screen calls. Two things the set being read *from the
draft* buys, both verified: inside a settled vertical it carries Size and the
attribute block, so those clear too; and in C and D the page's own vertical
survives, never having been a selection.

`clearDisabled` still reads the draft, so the button is dead when there is
nothing on screen to clear — no closing the screen for nothing.

**Verified** at 360px/3× in Chromium, A/B/D:

- A, `?gender=girls&seller=grasim`, plus a colour ticked in the draft: Clear
  Filters returns the URL to `/seller/baheti`, closes the screen, restores all
  1,070 products, empties the Filters pill's count and brings the vertical chips
  back. No toast.
- B: the ✕ after an edit still toasts `Selection discarded` and leaves
  `?seller=grasim` standing — unchanged. Clear Filters on the same screen
  commits, closes and stays silent.
- D, `/d?colour=navy`: clears to bare `/d`, still titled *Men's Formal Shirts*
  with mixed colours back in the list. Page scope survived the clear.
- Unfiltered: the button is disabled.
- The toast: `All filters cleared` in A, B and D, gone when its animation ends.
  The ✕ still says `Selection discarded` and never says this; `Show N results`
  still says neither. D's zero-results recovery button toasts and lands on the
  restored listing.
- In A the toast's 72px offset clears the floating pill by **8px** (measured:
  toast bottom 728, pill top 737). Not overlapping, but tight — the 72 was sized
  for the full-width bar the pill replaced, and a toast in A is no longer rare.
  Logged against the Toast row in `CLAUDE.md` rather than changed unasked.
- 114 tests green (2 new), lint, typecheck and production build clean. No test
  covers the toast wiring: there is no pure function in it, and this suite has
  no component tests.

**Left alone:** the zero-results state's `Clear Filters` already committed
immediately (`commit({}, sort)`), which is where this behaviour was already
correct and is the precedent the change follows. It still resets wholesale
rather than filtering over the rail — identical today, since nothing is off it
on that screen — and it gained the toast, being the same button by name and by
effect.

### Verified working

- Footer count recomputes live: `Show 1,070 results` → `Show 530 results` on two sellers.
- Per-option counts recompute against other facets, not their own.
- **Facet pruning:** Girls cuts Category from 7 tiles to 1 (*Girl's T-Shirts*, 97 results); Men cuts it to 3 (575). *Boy's Casual T-Shirts* cuts Brands from 10 tiles to 2.
- Selected-but-zero options stay visible so they can be unticked.
- ~~Category sheet in A~~ — *superseded 2026-08-19, the sheet is gone.* Category is now a rail facet in both variants: picking *Girl's T-Shirts* gives `Show 97 results`, writes `?category=girls-t-shirts`, and the Filters badge reads 1.
- Contextual chips, both variants: none picked → the seven vertical chips with thumbnails; one picked → that chip leads with its ✕, then Price and the three offers; a second vertical → back to the full vertical list. Ticking Cashback correctly drops the Seller Offer chip, every remaining product having an offer.
- Price dropdown: opens anchored under its chip, ticking two bands writes `price=p-200,p-400` and the closed chip reads `Price (2)`. Girl's T-Shirts offers only the two bands its ₹110–320 range reaches; Men's Formal Shirts keeps `₹900 & above`. Anchoring clamps to the frame when the chip has scrolled right.
- The green ✕ removes the vertical and leaves other filters standing — `price=…` survives, and stays reachable because Price Range is a rail facet in both variants.
- ~~Discard toast on the Category sheet~~ — *superseded 2026-08-19.* The Filters screen is the only draft surface left, and its cases are covered in the line below.
- Discard toast on the Filters screen, both variants: edit then ✕ toasts; untouched ✕, `Show N results`, and tick-then-Clear-Filters (net zero) each stay silent. In B it sits 24px off the bottom, there being no bar to clear.
- A's rail is Gender plus the eleven common entries; B's is the same list with Category added on top. Exactly one row apart.
- Clear Filters wipes Category in **both** variants since 2026-08-19, the rail showing it in both. Verified in A: pick a category, Clear Filters, URL returns to bare and the badge clears — and since 2026-08-25 that happens on the tap, the screen closing onto the cleared listing rather than waiting for `Show N results`.
- Sort dot appears on non-default sort and clears on return to Popularity.
- Sheet motion measured frame by frame: enter decelerates (92→29→12→4px steps), exit accelerates (10→34→73→171px), then unmounts.
- URL reflects state (`?gender=girls&sort=margin_desc`); back button unwinds it.
- Size, at 360px in Chromium: the panel lists all thirteen options with live counts (XS 49 … 12-13Y 28); `?gender=girls` leaves only age bands (27/53/47/43/25/7); `size=3xl` gives `Show 30 results` and writes `?size=3xl`.
- The card opens on the right pack and scrolls to it. `p-1062` — packs `3XL/2 | 3XL/4 | 3XL/6 | 2XL/10` — under `size=2xl` selects the **fourth** pill, scrolls the row to 35 of a possible 36 so it is fully visible, and prints that pack's `₹465 / 54% margin` rather than pack #1's `₹530 / 44%`. Across every card checked, the selected pill was in view.
- 94 engine tests green. Lint and typecheck clean. Production build clean. No console errors on any screen, local or production.

### 2026-08-20 — `VIEW DETAILS` is blue

Confirmed on request, closing the second-to-last of the three contrast failures
inherited from the Figma. The A–D card's `VIEW DETAILS` was orange `#FF7711` at
**2.53:1** on its `#f8faf7` strip — the worst thing on the card — and is now
`primary`, measured **5.72:1**, clearing AA at 13px. `JourneyProductCard` had
already gone blue, so the two card designs agree here rather than diverging.

**The chevron went with it, and needed a different mechanism.** The exported
asset is *stroked* `#FF7711`, so a blue label sat beside an orange arrow. It now
renders through `MaskIcon`, which reads only the alpha channel and tints the
untouched export — the same route `JourneyProductCard` and the Sort sheet glyphs
take, and the reason `MaskIcon` exists rather than a CSS `filter`.

`--color-orange-500` **stays**. The home screen's badge, the app bar's cart
counter and the detail screen's quantity stepper all still use it, as white-on-
orange fills or as a border, none of which is a contrast problem. Only the one
underlined label read poorly.

Only the body grey remains listed: `#7f7f7f` at 4.0:1, short of 4.5 at 12px.

**A lint trap found on the way, unrelated but worth fixing.** `npx eslint .`
from the repo root is the documented command, and the two Claude Code worktrees
under `.claude/` are full checkouts of this repo — so it was linting every
worktree's copy of the source plus its `node_modules`, reporting **24,197
problems**, every one of them outside this working tree. `.claude/**` is now in
`globalIgnores`, and the root command reports 0 again. `.claude/` and `userflow/`
were also added to `.gitignore`, the latter being reference screengrabs in the
same class as the already-ignored `design/`.

Verified: 109 tests green, lint and production build clean, and the row
screenshotted at 360px/3× on both cards — label and chevron both computing
`rgb(0, 79, 250)`, which is `#004ffa` exactly rather than a near-miss blue.


### 2026-08-20 — production was serving a different catalog

Found while diffing a local build against a Vercel build line by line, which is
the only reason anyone would have noticed. **The deployed catalog was not the
catalog any test or document described.**

`buildVariants` chose its set sizes with `[...SET_SIZES].sort(() => rand() - 0.5)`
— the shuffle antipattern. A comparator returning a coin flip is not a consistent
ordering function, so V8 may walk the array however it likes, and that means it
decides both the order produced **and how many `rand()` calls are consumed**
(measured: 6, 7 or 8). The draw is on the **main** stream inside the per-product
loop, so a differing count re-rolls every product after it.

Vercel builds on **Node 24**, this machine runs **Node 26**. Same seed:

| | Node 24 | Node 26 |
|---|---|---|
| shuffle of `[2,4,6,10,12]` | `2,6,12,10,4` | `6,12,2,4,10` |
| vertical routes | 56 | 55 |
| static pages | 137 | 135 |
| `Men` | **590** | 575 |

Both Vercel builds printed 56 routes and both local builds 55, across two
different commits — so it tracked the machine, not the code. `1,070` held (a loop
count, not a draw) and `Girls 97` held by luck. `Men 575` did not, and five of the
seven category counts differed. Every test passed on the machine that wrote them.

**Fixed with Fisher–Yates**, which takes exactly `SET_SIZES.length - 1` draws
whatever the values and whatever the engine. The catalog re-rolled once — the
price of the numbers being true everywhere instead of in one place — and cannot
drift again.

Every figure re-measured, and **identical under Node 24 and Node 26**, the full
suite having been run under both:

| | was | now |
|---|---|---|
| Total | 1,070 | 1,070 |
| Girls / Men | 97 / 575 | **108 / 584** |
| Women's T-Shirts | 180 | 173 |
| Men's Formal Shirts | 163 | 168 |
| Men's Casual T-Shirts | 243 | 222 |
| Men's Casual Shirts | 169 | 194 |
| Girl's T-Shirts | 97 | 108 |
| Boy's Casual Shirts | 101 | 98 |
| Boy's Casual T-Shirts | 117 | 107 |
| `₹900 & above` | 37 | 36 |
| Vertical routes | 55 | 56 (all pairs now stocked) |
| Sizes XS → 3XL | 49 / 232 / 412 / 450 / 304 / 114 / 30 | 43 / 225 / 404 / 468 / 308 / 116 / 28 |
| Sizes 2-3Y → 12-13Y | 76 / 156 / 173 / 140 / 81 / 28 | 78 / 168 / 189 / 142 / 62 / 17 |
| M ∪ L | 586 | 605 |
| L / M share | 42% / 39% | 44% / 38% |
| Girls' size spread | 27/53/47/43/25/7 | 28/57/65/47/27/9 |
| `size=3xl` | 30 | 28 |
| Two casual categories | 412 | 416 |
| Journey at `?gender=women&size=s,m,l` | 164 | 156 |
| Men's Formal drill-down | 8 of 163 | 18 of 168 |
| Neck Type under Men's Formal | 64/42/12/32/13 | 76/31/20/25/16 |

Unmoved, and checked: 1,070 total, Kartik's 540, all twenty colours non-empty,
all five price buckets and four margin buckets live, and Boy's Casual T-Shirts
still collapsing Brands to two tiles (Killer, Monte Carlo). `12-13Y` is now the
thinnest option at 17 products (1.6%), where the floor used to be about 3% — the
argument the size runs exist to make still holds, L being 44% rather than 96%.

**The earlier dated entries above are left as written.** Their numbers were true
when measured and are superseded here; rewriting them would falsify the log.
`CLAUDE.md`, `plan.md` and the code comments carry the current figures.

**Guard:** `lib/catalog/seed.test.ts` asserts the draw count per `buildVariants`
call is exactly `1 + 4 + 3 × packs` across 400 seeds and both pack modes, so a
comparator-driven shuffle can't return unnoticed. It also pins the seven category
counts. The standing rule: **a shuffle takes a draw count fixed by the array's
length, never by a comparator's answers.**

One coverage note, deliberately left: *gives no page to a seller with nothing in
the vertical* no longer has an empty pair to exercise, all 56 now being stocked.
The filter in `verticalRoutes` stays as the guarantee.


## The four variants

Started as an A/B of control placement on 2026-08-12; C and D added the scope axis on 2026-08-19, making it a 2×2. Same card, catalog and engine throughout, so each comparison stays honest.

| | Demo URL | Controls | Starts |
|---|---|---|---|
| **Variant A** | `/` | Sort · Filters at the bottom | across every category |
| **Variant B** | `/b` | The same two as chips at the top | across every category |
| **Variant C** | `/c` | Sort · Filters at the bottom | inside one vertical |
| **Variant D** | `/d` | The same two as chips at the top | inside one vertical |

|  | bottom bar | top chips |
|---|---|---|
| **all categories** | A | B |
| **one vertical** | C | D |

Switching is by URL — chosen over an on-screen toggle so nothing that isn't product chrome appears on a screen being judged. A and B walk home → seller → PLP; C and D **are** the listing, landing straight inside a vertical, since the point there is the state rather than the route to it.

A and B are each a **closed loop**: hand someone `/b` and the whole journey — home, seller card, PLP, home button — stays in B. `HomeScreen` takes a `basePath` and `AppBar` a `homeHref`; both must be kept in step when adding routes, or a session leaks into another variant mid-demo with no visible cause. C and D are single screens and so carry no home button at all — every href one could hold leads out of the variant, which is that leak rather than a use of the prop.

Verified: no bottom bar in B or D; the chips open the same sheets the bar does and carry the same active vocabulary (dot for Sort, count for Filter); the rails are identical between A and B and between C and D; `/b` → seller card → `/b/seller/baheti` → home → `/b` stays in B; `/c` and `/d` land inside a vertical with no Category or Gender control anywhere.

Open: the reference image for a category PLP ("Cotton Casual Shirt") also shows a **different card** — pipe-separated `MRP ₹1000 | Pack Size 1pc`, single-size pills, 4 dots, and no share icon in the app bar. C and D now cover the *listing* half of that reference; the card is deliberately still the shared one, so the variants differ by scope and controls alone. Say if the card should change too, and whether it applies to all four.

## UX backlog — from the design review

Ordered by consequence. None of these block a demo.

1. **Applied filters are hard to read on the PLP.** Three active filters render as one small count on a 24px icon. Scroll away and back and you can't tell what's constraining the list. *Partly closed 2026-08-13:* the contextual chips are defined and built, and a selected chip shows its own state inline — but only for the facets the strip currently offers, so a seller or delivery filter is still just a number on an icon.
2. **Contrast failures**, inherited from the Figma, on the three numbers a retailer actually reads. **Two of the three closed on 2026-08-14** — not by picking darker colours, but by sampling the live app's own screengrab, which turned out to set both better than the frame does:
   | Text | Was | Ratio | Now | Ratio | AA needs |
   |---|---|---|---|---|---|
   | `65% margin` | `#39B54A` | 2.66:1 | `#004FFA` (`primary`) | **6.0:1** ✅ | 4.5:1 |
   | MRP / Price per pc | `#999999` | 2.85:1 | `#7F7F7F` | 4.0:1 ⚠️ | 4.5:1 |
   | `VIEW DETAILS` | `#FF7711` | 2.53:1 | `#004FFA` (`primary`) | **5.72:1** ✅ | 4.5:1 |
   **All three original failures are now closed but one** (2026-08-20): `VIEW DETAILS` took the live app's blue on confirmation, 2.53:1 → **5.72:1**, and the chevron beside it went with it. The grey improves but still misses at 12px, so it is the only row still listed.
   Audience is kirana retailers on mid-range Android in poor light.
10. ~~**The variants still differ in more than control placement.**~~ **Closed 2026-08-19.** Category left A's bottom bar for the Filters rail, so the last facet-level difference is gone: same card, catalog, engine, rail and facets, and where Sort and Filters sit is the entire variable. A stated preference is now about control placement and nothing else, which is what the A/B was for.
    *Resolved along the way:* A's checkbox-that-behaves-exclusively Gender mismatch went earlier — Gender is an ordinary multi-select rail facet in both variants, so no control claims exclusivity anywhere.
4. **Tiles show no counts** while every checkbox row does — you can't judge whether a category is worth tapping.
5. **Hidden zero-count options** are right for the pruning demo but break the user's mental map; most Indian ecommerce greys out instead. A conscious call, not an inherited default.
6. **No loading / skeleton / stale-results state anywhere.** Filtering is instant only because the catalog is in memory; against a real API it won't be, and the prototype is quietly setting an expectation engineering can't meet.
7. **Touch targets** below guideline: sheet close X is 15px, set pills 40px (both from the design).
12. ~~**The vertical chips read small on a phone.**~~ **Closed 2026-08-25.**
    Raised 13px → 15px, matching every other chip in the strip, with the label
    box widened 82 → 94px so `Men's Casual T-Shirts` still breaks rather than
    clamping — measured at 91px needed, with the slack earlier figures carried.
    The 44px thumbnail is unchanged: it is the chip's height, and that is shared
    with every chip in the row, so growing it would grow the whole strip.
    The same pass fixed the chip's **0.5px border**, which was the frame's value
    for a chip drawn on its own and read lighter than its 1px neighbours.
11. **Two type sizes are held below 12px by frame dimensions**, not by choice — see the 2026-08-20 entry. The tile-grid label (11px, boxed by the 68px cell) and the home seller card's stat line (11px, boxed by the 152px card) were the only sites the type pass could not raise. Both need a wider cell or card to move, which is a designer's call.
8. **Accessibility**, if this becomes the reference build: filter rows use `aria-pressed` where `role="checkbox"` + `aria-checked` is correct; sheets don't trap focus; the scrim is a full-viewport `<button>` announced as a giant "Close".
9. **Pagination dots under the set pills** imply snapping the free-scrolling row doesn't do.

## Facet tile imagery

- **Category** — Unsplash photos in `public/categories/`, credited in `CREDITS.md`. Re-shot 2026-08-12 for the seven new categories: all worn on a model, since each category names its audience and at 56px a person reads faster than a flat-lay, and picked for seven distinct dominant colours. `boys-casual-t-shirts.jpg` carries an incidental Levi's wordmark, unreadable at tile size — swap it if it bothers anyone.
- **Brands** — still grey `#d9d9d9` placeholders. Real logos couldn't be sourced: Clearbit's logo API is retired, and Wikipedia/Wikimedia returned unrelated files for 7 of 8 brands. Brand-supplied assets are the right input, and avoid the trademark question of scraping logos.

## Open questions for the designer

0. **Three things fell out of the new category list** (2026-08-12), none blocking:
   - **Apostrophes are inconsistent** — "Men's" and "Women's" are plural possessives, but "Girl's" and "Boy's" are singular. Set verbatim as supplied rather than silently corrected; say the word and they become "Girls'" / "Boys'".
   - ~~**Gender is now redundant as a filter.**~~ Settled 2026-08-13: kept as a rail facet in **both** variants, since it is still a faster cut than ticking three category tiles. A's bottom-bar slot went to Category instead.
   - ~~**Product card renders are button-up shirts** while four of seven categories are tees.~~ **Closed 2026-08-21** — 120 generated images on a `gender × kind × colour` axis, and all 1,070 products resolve to one. The two Figma renders stay only as the fallback path. It survives in one place: `/userjourney`'s men's tees, whose art is cropped from the live app rather than generated, and for which no men's tee render exists.
1. ~~**What are the contextual chips?**~~ **Answered and built 2026-08-13.** Product-vertical chips until a single vertical is settled, then price bands, Seller Offer, Cashback and Free Delivery. ~~The M3 corner beside the frame's pills~~ settled 2026-08-14: one 8px radius across the whole strip, pills included. Still worth seeing before it is final: *Seller Offer* meaning "any offer" makes it disappear once Cashback is ticked, because every remaining product then has an offer. Correct per the rule, but worth seeing.
2. **A Category glyph for the bottom bar.** The frame's first slot was Gender (`wc.svg`); it now holds Category and is borrowing `tag.svg`, which is also the Sort sheet's *Recently Added* icon. An exported Category icon would settle it.
3. `Offers` vs `Seller Offers` — the two filter frames disagree; currently **Offers**.
4. Baheti Garments is treated as a storefront aggregating multiple sellers, since the app bar says Baheti while the Seller facet lists other companies. Confirm, or scope it to one seller and drop the Seller facet there.
5. A stray `$299.99` row sits at the bottom of the filter rail in Figma (`638:3712`) and was skipped as an artefact; `Margin` is SemiBold while its eleven rail siblings are Medium.
6. **Four things the live-app screengrab raises** (2026-08-14), now that the card follows it rather than the frame:
   - ~~**The screengrab has no shipping-fee line.**~~ **Closed 2026-08-20** — the word was said. `+₹50 shipping fee` is not a real charge and is gone from the card in all four variants; the field is still drawn and simply unread, its `rand()` sitting mid-sequence. The card and the screengrab now agree here.
   - ~~**`VIEW DETAILS` is blue in the live app**, orange `#FF7711` here.~~ **Closed 2026-08-20** — confirmed blue, so A–D took `primary` and the contrast went 2.53:1 → **5.72:1**, clearing AA. The exported chevron is stroked `#FF7711`, so it renders through `MaskIcon` rather than an `<img>`, the route `JourneyProductCard` already took; a blue label beside an orange arrow was the thing to avoid. `--color-orange-500` stays — the badges and the detail screen's quantity stepper still use it, all white-on-orange or as a border.
   - **Price measures ~24px in the app**, 26px here per the frame. A 2px delta, left rather than overriding Figma silently.
   - **The app is inconsistent with its own label** — card 1 reads `SET of:` and card 2 `Set of:`. Reproduced as `SET of:`; confirm which is intended.
