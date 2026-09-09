import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/journey/ProductDetail";
import { getKartikCatalog } from "@/lib/catalog/kartik";

/**
 * `/pvfilters`' product detail screen — where `VIEW DETAILS` lands, the twin of
 * the journey's own.
 *
 * Scoped to Kartik's catalog rather than the main one, for the reason the
 * journey's is: this screen was built from his storefront's screengrab, and a
 * `p-****` id here would render a card design its product has never been shown
 * in.
 *
 * **`homeHref` is passed explicitly.** `ProductDetail` defaults it to
 * `/userjourney`, which is the route it was built from — left off, a card opened
 * from `/pvfilters` would put the buyer back in the journey and the loop would
 * leak.
 *
 * **`ProductDetail` is still shared, unlike the listing.** The two listings were
 * deliberately un-shared on 2026-09-09 so `/userjourney` can have things removed
 * from it; this screen is a different case — it is one screen behind four routes
 * (journey, here, B and D), parameterised the way `PlpScreen` is, and forking a
 * whole screen is not what un-sharing a prop block was. If the journey needs
 * something *taken off* the detail screen, that is a prop on `ProductDetail`
 * with a default that leaves the other three alone — the pattern `cartBadge`
 * already sets.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getKartikCatalog().find((p) => p.id === productId);
  if (!product) notFound();

  // 3 in the basket, as the screengrab has it — the journey's page passes the
  // same. B and D pass none.
  return (
    <ProductDetail product={product} homeHref="/pvfilters" cartBadge={3} />
  );
}
