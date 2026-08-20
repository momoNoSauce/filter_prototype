import { PlpScreen } from "@/components/plp/PlpScreen";
import { JourneyProductCard } from "@/components/journey/JourneyProductCard";
import {
  CartBar,
  SHOW_CART_BAR,
  SellerHeader,
} from "@/components/journey/StorefrontChrome";
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
      // **Top chips, not the bottom bar** (2026-08-20). The basket bar owns the
      // foot of this screen in the live app — `SHOW_CART_BAR` only hides it —
      // so a pinned Sort/Filters bar would be a second bar competing for the
      // same edge. That is what ruled the bottom-bar placement out generally;
      // the journey is where it was concrete, since it is the one screen here
      // that has a basket bar at all.
      variant="top-chips"
      homeHref="/userjourney"
      card={JourneyProductCard}
      productBasePath="/userjourney"
      // No Share on this bar in the screengrab, and dropping it is also what
      // lets `KARTIK EXPORTERS` fit at 20px instead of truncating.
      appBar={{ showShare: false, cartBadge: 3 }}
      aboveList={<SellerHeader name={KARTIK.name} />}
      // Hidden for now — see `SHOW_CART_BAR`. Wired rather than removed so it
      // returns by flipping one constant.
      belowList={SHOW_CART_BAR ? <CartBar /> : undefined}
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
