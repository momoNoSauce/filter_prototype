# Progress Tracker

Last updated: 2026-08-25

Live: **https://filterprototype.vercel.app** — **password-protected** since
2026-08-14. **Leave the username blank** and enter the password; only the password is checked. It lives in the `SITE_PASSWORD` env var on Vercel
(`npx vercel env ls --scope bitihotra-karaks-projects` to see it is set; `env
rm` then `env add` to change it, then redeploy — env changes only reach the
site on the next deploy). Redeploy with
`npx vercel --prod --scope bitihotra-karaks-projects`. **The `--scope` is not
optional** — the project belongs to the team, so a bare `vercel --prod` fails
with `Not authorized` even when `vercel whoami` reports you logged in, which
reads as an expired session and isn't one.
Source: **https://github.com/cheeseKracker/filter_prototype** (private).
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

### 2026-08-25 — Clear Filters clears, and goes back to the listing

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

**It is silent, for the same reason applying is.** The discard toast fires when
edits are lost without being seen; here the listing behind the screen visibly
changes, and draft edits made before the tap go with the clear because that is
what clearing means. The **✕ is now the only exit that discards**, and so the
only one that toasts — which is a simpler rule than the three-exit one it
replaces, and `dismiss` needed no change to get it.

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
- 114 tests green (2 new), lint, typecheck and production build clean.

**Left alone:** the zero-results state's own `Clear Filters` already committed
immediately (`commit({}, sort)`), which is where this behaviour was already
correct and is the precedent the change follows. It resets wholesale rather than
filtering over the rail; identical today, since nothing is off it on that screen.

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
   - **Product card renders are button-up shirts** while four of seven categories are tees. Only two shirt renders exist in Figma; tee renders would need exporting.
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
