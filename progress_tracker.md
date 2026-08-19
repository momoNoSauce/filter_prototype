# Progress Tracker

Last updated: 2026-08-19

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

**Size sits between Pack Type and Colour in both rails** — a new entry Figma's rail predates. Placed with the other garment attributes so the designed order above it is untouched, which **wants a designer's call**: size is the filter an apparel buyer reaches for first, and this is not the top.

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

**Leaving a vertical drops its attribute selections.** Their rows leave the rail with the vertical, and a filter still narrowing the list with nothing to show or undo it is the trap the `hasOffer` rail entry exists to avoid: it would survive Clear Filters and go uncounted. `dropOrphanedAttributes` runs in `commit` (a chip ✕ can leave a vertical), in the Filters screen's `toggle`, and in `parseSelections`, since `?fit=slim-fit` with no vertical was never reachable by clicking.

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

`lockedVertical` threads through `getRail`, `getRailFacetIds`, `dropOrphanedAttributes`, `contextChips` and `parseSelections`. The last two earn their keep: a hand-edited `?category=girls-t-shirts` or `?gender=girls` on a Men's Formal Shirts page is dropped rather than emptying it, and the attribute guard is disabled because there is no vertical to leave.

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
- Clear Filters wipes Category in **both** variants since 2026-08-19, the rail showing it in both. Verified in A: pick a category, Clear Filters, URL returns to bare and the badge clears.
- Sort dot appears on non-default sort and clears on return to Popularity.
- Sheet motion measured frame by frame: enter decelerates (92→29→12→4px steps), exit accelerates (10→34→73→171px), then unmounts.
- URL reflects state (`?gender=girls&sort=margin_desc`); back button unwinds it.
- Size, at 360px in Chromium: the panel lists all thirteen options with live counts (XS 49 … 12-13Y 28); `?gender=girls` leaves only age bands (27/53/47/43/25/7); `size=3xl` gives `Show 30 results` and writes `?size=3xl`.
- The card opens on the right pack and scrolls to it. `p-1062` — packs `3XL/2 | 3XL/4 | 3XL/6 | 2XL/10` — under `size=2xl` selects the **fourth** pill, scrolls the row to 35 of a possible 36 so it is fully visible, and prints that pack's `₹465 / 54% margin` rather than pack #1's `₹530 / 44%`. Across every card checked, the selected pill was in view.
- 73 engine tests green. Lint and typecheck clean. Production build clean. No console errors on any screen, local or production.

## Variant B — top chips instead of a bottom bar

An A/B of control placement, added 2026-08-12. Same card, catalog, engine and sheets; only the controls differ, so the comparison stays honest.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/baheti` | Sort · Filters at the bottom |
| **Variant B** | `/b` | `/b/seller/baheti` | The same two as chips at the top, no bottom bar |

Switching is by URL — chosen over an on-screen toggle so nothing that isn't product chrome appears on a screen being judged.

Each variant is a **closed loop**: hand someone `/b` and the whole journey — home, seller card, PLP, home button — stays in B. `HomeScreen` takes a `basePath`, `AppBar` takes a `homeHref`; both must be kept in step when adding routes, or a session leaks into the other variant mid-demo with no visible cause.

Verified: no bottom bar in B; both chips open their sheets; chips carry the same active vocabulary as the bottom bar (dot for Sort, count for Filter); Gender sits second in B's rail and multi-selects (`?gender=men,boys`) while A's sheet still replaces (`?gender=boys`); `/b` → seller card → `/b/seller/baheti` → home → `/b`; Variant A unchanged and equally self-contained.

Open: the reference image is a *category* PLP ("Cotton Casual Shirt") with a different card — pipe-separated `MRP ₹1000 | Pack Size 1pc`, single-size pills, 4 dots, and no share icon in the app bar. Deliberately **not** built, to keep the A/B to one variable. Say if the card should change, and whether it applies to both variants.

## UX backlog — from the design review

Ordered by consequence. None of these block a demo.

1. **Applied filters are hard to read on the PLP.** Three active filters render as one small count on a 24px icon. Scroll away and back and you can't tell what's constraining the list. *Partly closed 2026-08-13:* the contextual chips are defined and built, and a selected chip shows its own state inline — but only for the facets the strip currently offers, so a seller or delivery filter is still just a number on an icon.
2. **Contrast failures**, inherited from the Figma, on the three numbers a retailer actually reads. **Two of the three closed on 2026-08-14** — not by picking darker colours, but by sampling the live app's own screengrab, which turned out to set both better than the frame does:
   | Text | Was | Ratio | Now | Ratio | AA needs |
   |---|---|---|---|---|---|
   | `65% margin` | `#39B54A` | 2.66:1 | `#004FFA` (`primary`) | **6.0:1** ✅ | 4.5:1 |
   | MRP / Price per pc / shipping | `#999999` | 2.85:1 | `#7F7F7F` | 4.0:1 ⚠️ | 4.5:1 |
   | `VIEW DETAILS` | `#FF7711` | 2.53:1 | — | 2.53:1 ❌ | 4.5:1 |
   The margin now clears AA outright. The grey improves but still misses at 12px, so it stays listed. `VIEW DETAILS` is untouched and is now the worst offender on the card — the live app renders it blue, which would close it too, but that was left for a deliberate call rather than folded into a format pass.
   Audience is kirana retailers on mid-range Android in poor light.
10. ~~**The variants still differ in more than control placement.**~~ **Closed 2026-08-19.** Category left A's bottom bar for the Filters rail, so the last facet-level difference is gone: same card, catalog, engine, rail and facets, and where Sort and Filters sit is the entire variable. A stated preference is now about control placement and nothing else, which is what the A/B was for.
    *Resolved along the way:* A's checkbox-that-behaves-exclusively Gender mismatch went earlier — Gender is an ordinary multi-select rail facet in both variants, so no control claims exclusivity anywhere.
4. **Tiles show no counts** while every checkbox row does — you can't judge whether a category is worth tapping.
5. **Hidden zero-count options** are right for the pruning demo but break the user's mental map; most Indian ecommerce greys out instead. A conscious call, not an inherited default.
6. **No loading / skeleton / stale-results state anywhere.** Filtering is instant only because the catalog is in memory; against a real API it won't be, and the prototype is quietly setting an expectation engineering can't meet.
7. **Touch targets** below guideline: sheet close X is 15px, set pills 40px (both from the design).
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
   - **The screengrab has no shipping-fee line.** Ours keeps `+₹50 shipping fee` under the price — it is real per-order cost the seed carries, and dropping information to match a screenshot is a designer's call, not a format pass's. Say the word and it goes.
   - **`VIEW DETAILS` is blue in the live app**, orange `#FF7711` here. Left alone deliberately, but it is now the **worst contrast on the card** at 2.53:1 — the only one of the three original failures still open, and taking the app's blue would close it.
   - **Price measures ~24px in the app**, 26px here per the frame. A 2px delta, left rather than overriding Figma silently.
   - **The app is inconsistent with its own label** — card 1 reads `SET of:` and card 2 `Set of:`. Reproduced as `SET of:`; confirm which is intended.
