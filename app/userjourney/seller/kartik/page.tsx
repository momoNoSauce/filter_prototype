import { PlpScreen } from "@/components/plp/PlpScreen";
import { SellerHeader } from "@/components/journey/StorefrontChrome";
import { KARTIK, getKartikCatalog } from "@/lib/catalog/kartik";

/**
 * Kartik Exporters' storefront — the listing the user journey filters and sorts.
 *
 * `filter` mode, not `locked`: the storefront carries three tee verticals, and
 * the journey's central cut is *Gender → Women*, which needs the Gender row on
 * the rail. Picking it leaves one vertical standing, which is what puts Size
 * there — see `settledVertical`.
 *
 * Everything here beyond the card and chrome is the shared `PlpScreen`: same
 * engine, same rail, same sheets, same Sort options. Only the skin is the
 * journey's, so a filter behaves identically to the way it does in A–D.
 */
export default function Page() {
  return (
    <PlpScreen
      // Caps, as the live app's bar sets it — and title case in the header
      // block below, which is the app's own inconsistency, not ours.
      title={KARTIK.name.toUpperCase()}
      products={getKartikCatalog()}
      /*
       * **Top chips** (2026-08-28, on the stakeholder review).
       *
       * This is the third placement this screen has held and a reversal of the
       * 2026-08-25 move onto the floating pill, which was made on UXR reading
       * the bottom placement as testing better. That research is not
       * withdrawn — the call here is a stakeholder's, and it returns the
       * journey to the placement its own screengrab shows, so the route is
       * once again 1:1 with the live app in behaviour as well as pixels.
       *
       * Nothing about the pill was wrong: Figma `697:2658` floats it 12px
       * above the basket bar rather than taking a band off the frame, and
       * `pillBottom` reads `CART_BAR_H`, so the bottom-edge collision that
       * parked A and C in the first place does not apply here. A and C keep
       * it, which is what still makes this a *placement* A/B rather than two
       * different screens.
       *
       * If the pill comes back, the one thing to re-check is the toast: it
       * clears whatever is actually at the foot now, and it reads the pill's
       * own offset to do it. See `toastBottom` in `PlpScreen`.
       */
      variant="top-chips"
      /*
       * **Where this listing's controls live** — four departures from the
       * documented layout, all from the 2026-08-28 stakeholder review, and all
       * on this route only. A–D pass nothing and are untouched.
       *
       * - **No vertical chips.** A buyer already inside Kartik's storefront
       *   hasn't come to choose between tee types, so the strip leads with the
       *   filters that would otherwise wait behind a vertical being settled.
       *   The *picked* chip goes too, so the strip carries none in any state —
       *   the cost, accepted on the call, being that nothing on the listing
       *   then names the cut and the Filters badge is the only report of it.
       * - **No Price chip.** Price Range stays a rail facet, so the bands are
       *   still reachable in the Filters panel and nothing is orphaned.
       * - ~~**Sort inside Filters**~~ — **reversed on 2026-09-03**, on the
       *   request. Sort is a chip on the strip again, beside Filter, as the
       *   live app's own bar has it and as B and D carry it. It was the first
       *   row of the Filters rail between 08-28 and 09-03, joining the draft
       *   there; `sortInFilters` still does that and nothing passes it today.
       *   The cost of having it back is the cost B and D pay: a sort applies
       *   on tap rather than on `Show N results`, so the ✕ has nothing to
       *   discard and the only way back is another tap — the sheet marking
       *   `Popularity (Default)` is what makes that findable. Clear Filters
       *   still resets it, as it does in every variant: it commits
       *   `DEFAULT_SORT` whether or not Sort is on that screen, which is why
       *   the documented demo has the URL going bare.
       * - **This route's own rail order**, with Gender, Delivery Time, Offers,
       *   More Filters, Seller and Seller City dropped — see
       *   `JOURNEY_RAIL_ORDER`. Three of those cost something and all three
       *   are paid for there: Gender was this journey's documented cut, and
       *   *Category → Women's T-Shirts* now makes it and settles the vertical
       *   identically; Offers owned the facets the three strip chips select,
       *   so `PlpScreen` hands them to the Filters screen as `clearsAlso` and
       *   Clear Filters still reaches them; Seller and Seller City went on
       *   2026-09-03 because a buyer standing in Kartik's storefront is
       *   already inside the only seller in scope, which left one panel empty
       *   and the other holding a single option every product has.
       * - **Every range facet carries a typed min and max above its bands** —
       *   Price Range from 2026-08-28, and **Margin on MRP and MOQ from
       *   2026-09-03**, on the request and on the same argument. The bands are
       *   the fast path and keep their counts; the boxes cover a range nobody
       *   predicted. Per facet the two are exclusive — typing clears a ticked
       *   band and ticking a band clears what was typed, since both are values
       *   on one facet and would otherwise OR into a wider result. Each box
       *   carries its own unit: ₹ before the number, % and `pc` after theirs.
       *   A–D show the bands alone.
       * - **Filters is a bottom sheet**, not a full-bleed panel, so the
       *   listing stays visible behind it and the buyer keeps the context they
       *   are filtering. It also shortens the panel, so lists earn a search
       *   field sooner there — see `SHEET_PANEL_VIEWPORT`.
       *
       * What is left in the strip is `Sort` and `Filter`, then the four offer
       * chips.
       *
       * None of this is `locked` mode, which C and D use — that would take
       * Category off the rail as well, and Category is now this journey's
       * central cut, the thing that settles the vertical and puts Size there.
       */
      controls={{
        verticalChips: false,
        priceChip: false,
        rail: "journey",
        filterSheet: true,
        rangeInputs: true,
      }}
      homeHref="/userjourney"
      productBasePath="/userjourney"
      // No Share on this bar in the screengrab, and dropping it is also what
      // lets `KARTIK EXPORTERS` fit at 20px instead of truncating.
      appBar={{ showShare: false, cartBadge: 3 }}
      aboveList={<SellerHeader name={KARTIK.name} />}
      // 9px inset and a 14px gap on `#f7f7f7`, all measured off the screengrab
      // at 3× — against the shared card's 16px on white. **No top padding**:
      // the seller block is the first thing in the scroller and is white, so
      // 12px of `#f7f7f7` above it read as a stray band between it and the chip
      // strip rather than as breathing room. The first *card* still clears it,
      // the header's own `mb` plus the list gap sitting between the two.
      listClassName="gap-[14px] bg-[#f7f7f7] px-[9px] pb-[12px]"
    />
  );
}
