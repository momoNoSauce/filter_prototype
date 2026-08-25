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
       * **The floating pill, on UXR** (2026-08-25). This screen has been on
       * top chips since 2026-08-20, and the reason has expired twice over.
       *
       * It went there because the basket bar owns the foot of this listing and
       * a *pinned, full-width* Sort/Filters bar was a second bar competing for
       * the same edge — true of the bar Figma `638:2836` draws, and the journey
       * was where that was concrete, being the one screen here with a basket
       * bar at all. Figma `697:2658` answered it on 2026-08-21: a floating
       * 240px pill that rides 12px above the basket bar rather than taking a
       * band off the frame, which is what un-parked A and C. `pillBottom` in
       * `PlpScreen` already reads `CART_BAR_H`, so nothing competes here either.
       *
       * That left the journey on top chips for a narrower reason — its
       * screengrab shows top chips — and **research now says the bottom
       * placement tests better**, which outranks a still frame of one screen.
       * So the demonstration flow shows the placement the evidence prefers.
       *
       * This is a departure from the screengrab, and the first one on this
       * route that is about *behaviour* rather than pixels: the card, the
       * chrome and every measured value here still follow it.
       */
      variant="bottom-bar"
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
