import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { getCatalog } from "@/lib/catalog/products";
import { SELLERS } from "@/lib/catalog/seed";

/**
 * Variant B of the PLP — Sort and Filter as chips under the GOLD strip, no
 * bottom bar, no Gender control.
 *
 * Deliberately a separate route rather than a query flag, so each variant has
 * its own shareable link and neither carries the other's state.
 * Variant A lives at /seller/[sellerId].
 */
export function generateStaticParams() {
  return SELLERS.map((seller) => ({ sellerId: seller.id }));
}

export default async function SellerPageVariantB({
  params,
}: PageProps<"/b/seller/[sellerId]">) {
  const { sellerId } = await params;
  const seller = SELLERS.find((s) => s.id === sellerId);
  if (!seller) notFound();

  const catalog = getCatalog();
  const products =
    sellerId === "baheti" ? catalog : catalog.filter((p) => p.sellerId === sellerId);

  return <PlpScreen title={seller.name} products={products} variant="top-chips" />;
}
