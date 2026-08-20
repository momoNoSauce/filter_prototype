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
      variant="bottom-bar"
      homeHref="/userjourney"
      card={JourneyProductCard}
      // No Share on this bar in the screengrab, and dropping it is also what
      // lets `KARTIK EXPORTERS` fit at 20px instead of truncating.
      appBar={{ showShare: false, cartBadge: 3 }}
      aboveList={<SellerHeader name={KARTIK.name} />}
      // Hidden for now — see `SHOW_CART_BAR`. Wired rather than removed so it
      // returns by flipping one constant.
      belowList={SHOW_CART_BAR ? <CartBar /> : undefined}
      // 9px inset and a 14px gap on `#f7f7f7`, all measured off the screengrab
      // at 3× — against the shared card's 16px on white.
      listClassName="gap-[14px] bg-[#f7f7f7] px-[9px] pt-[12px] pb-[12px]"
    />
  );
}
