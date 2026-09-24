import { PlpScreen } from "@/components/plp/PlpScreen";
import { KARTIK, getKartikCatalog } from "@/lib/catalog/kartik";

/**
 * **`/pvfilters2`** — a third Kartik listing, cloned off `/pvfilters` on
 * 2026-09-09 so a second cut at the product-vertical filtering can be tried
 * beside the first rather than on top of it.
 *
 * **Independent from the moment it was made**, which is the one thing this
 * repo has now learned twice in a day. `/pvfilters` was cloned off
 * `/userjourney` behind a shared `KartikStorefront` component that morning and
 * un-shared within the hour, the moment the journey needed something *removed*;
 * a route made to diverge does not go behind a shared config, however identical
 * it looks on the day. **So: change this file freely. Nothing you do to it
 * reaches `/pvfilters` or `/userjourney`, and nothing done there reaches this.**
 *
 * What is *not* copied is `PlpScreen`, and it never should be — the engine, the
 * rail, the sheets, the draft/commit and 400 lines of filter state are one
 * screen for every route in the prototype. This file only spells out props over
 * it, which is exactly what `/`, `/b/results` and the two seller routes each do.
 * `FindItFast` is shared for the same reason and on the same terms: it is a
 * surface, parameterised, and something this route wants of it that `/pvfilters`
 * does not is a prop with a default, never a second copy.
 *
 * The prop block below started as `/pvfilters`' exactly and **diverged the same
 * afternoon**: no `guidedPv`, so the *Find It Fast* block is not drawn here. The
 * two routes now put the same behaviour in two places — both reveal the garment
 * attributes once a vertical settles, one on the listing and one behind the
 * Filters button — which is the comparison a second route was for. Each setting
 * is annotated with *what* it does and one line of *why*; the long history
 * behind them — which stakeholder call, what it reversed, what it cost — lives
 * in `docs/decisions.md`, and is not repeated here precisely so the three files
 * have no shared prose to drift.
 */
export default function Page() {
  return (
    <PlpScreen
      // Caps, as the live app's bar sets it.
      title={KARTIK.name.toUpperCase()}
      // Kartik's own 540 tees, on their own PRNG streams — the only catalog in
      // the prototype carrying offer *magnitudes*, which is what makes the three
      // offer rails on this rail preset possible. A–D cannot see it.
      products={getKartikCatalog()}
      // Sort and Filter as chips under the app bar, as the live app draws them
      // (Figma 644:4011). B and D carry the same; A and C float the pill.
      variant="top-chips"
      /*
       * This listing's departures from the documented A–D layout. Each field
       * defaults to the documented behaviour, so a route opts *out*, never in —
       * which is why `sortInFilters` is absent rather than `false`.
       *
       * - `verticalChips: false` — a buyer already inside a storefront hasn't
       *   come to choose between tee types, so the strip leads with the filters
       *   that would otherwise wait behind a vertical being settled. The cost:
       *   nothing on the listing names the cut, and the Filters badge is the
       *   only report of it.
       * - `priceChip: false` — Price Range stays a rail facet, so the bands are
       *   still reachable in the panel and nothing is orphaned.
       * - `rail: "journey-gated"` (2026-09-09) — `JOURNEY_RAIL_ORDER` with a
       *   **More Filters** row at the foot standing in for the vertical block
       *   (*Style Filters* until the 2026-09-24 go-ahead, when its ticker came
       *   off too). The other two Kartik rails simply remove those rows, so a
       *   buyer who never ticks a category never learns there was anything to
       *   tick *for*; this one keeps a row there, in a primary label that holds
       *   still, and offers the categories inside its panel, so
       *   unlocking is a tap rather than an instruction. **The placeholder then
       *   leaves** and Size · Fit · Neck Type · Sleeve Type · Pattern · Closure
       *   Type arrive **immediately after Category** (2026-09-10) — 8 rows to
       *   13, sheet 590 → 640, panel landing on Category with the new rows
       *   directly under it. The unlocked rail is then exactly `/pvfilters`',
       *   this array being the journey rail plus the one appended placeholder.
       *   The order is otherwise the journey rail's: Price · Margin · MOQ ·
       *   Category · Brands · Seller · Seller City · the block · the three
       *   offer magnitudes — with More Filters appended after all of them
       *   while it is standing in for the block.
       *   Gender, Delivery Time and A–D's own *More Filters* — the `tags`
       *   catch-all, a different row from this one — have no row, so the central cut
       *   is **Category → Women's T-Shirts**, which is what settles the vertical
       *   and puts Size on the rail. Brands, Seller and Seller City are
       *   `hideIfSingle` and Kartik's scope holds one of each, so the rail is
       *   **7 rows outside a vertical and 12 inside one**.
       * - `filterSheet: true` — Filters as a bottom sheet rather than a
       *   full-bleed panel, so the listing stays visible behind it. It shortens
       *   the panel too, so a list earns a search field sooner here; the height
       *   follows the rail (`sheetHeightPct`), 530 at seven rows and a capped
       *   640 once a vertical settles.
       * - `rangeInputs: true` — a typed min/max above the bands on all six band
       *   facets. Per facet the two controls are exclusive and each disables the
       *   other, both being values on one facet; an inverted range is refused
       *   with a toast rather than filtered, and the boxes commit on blur, never
       *   per keystroke.
       * - ~~`guidedPv`~~ — **deliberately absent** (2026-09-09, hours after the
       *   clone, on request: *remove find it fast from /pvfilters2*). It is the
       *   one opt-*in* field on `controls`, so saying nothing is how a route
       *   goes without, and this is the first divergence from `/pvfilters`.
       *
       *   That makes the pair a real comparison rather than two copies: both
       *   still reveal the five garment attributes once a vertical settles —
       *   `rail: "journey"`, not the journey's flat one — but `/pvfilters`
       *   surfaces the choice **on the listing** in `FindItFast`, and this route
       *   leaves it **behind the Filters button** where it has always been.
       *
       *   It cost this route its only Size control for a few hours; the gated
       *   rail below is the answer that was flagged at the time — a Size row on
       *   a rail of its own, not `guidedPv` back.
       *
       * Not `locked` mode, which C and D use — that would take Category off the
       * rail, and Category is the cut this listing turns on.
       */
      controls={{
        verticalChips: false,
        priceChip: false,
        rail: "journey-gated",
        filterSheet: true,
        rangeInputs: true,
      }}
      /*
       * Both point here, and both must: the home button keeps a session inside
       * the route it opened, and the cards open `{base}/product/{id}`. This
       * route has its own `product/[productId]`, so a card never leaks into
       * `/pvfilters` or the journey. `/pvfilters2` *is* the listing — no
       * redirect in front of it, as `/c` and `/d` also land straight on theirs.
       */
      homeHref="/pvfilters2"
      productBasePath="/pvfilters2"
      // No Share on this bar in the screengrab, and dropping it is what lets
      // `KARTIK EXPORTERS` fit at 20px instead of truncating. The 3 is the
      // screengrab's basket count.
      appBar={{ showShare: false, cartBadge: 3 }}
      // 9px inset, 14px gap, 12px top and bottom on `#f7f7f7` — measured off the
      // storefront screengrab at 3×, against the shared card's 16px on white.
      listClassName="gap-[14px] bg-[#f7f7f7] px-[9px] pt-[12px] pb-[12px]"
    />
  );
}
