import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { getCatalog } from "@/lib/catalog/products";
import { SELLERS } from "@/lib/catalog/seed";

export function generateStaticParams() {
  return SELLERS.map((seller) => ({ sellerId: seller.id }));
}

export default async function SellerPage({ params }: PageProps<"/seller/[sellerId]">) {
  const { sellerId } = await params;
  const seller = SELLERS.find((s) => s.id === sellerId);
  if (!seller) notFound();

  /*
   * Baheti Garments is treated as a storefront that aggregates several sellers
   * — the designs show a Seller facet with other names in it while the app bar
   * reads "Baheti Garments", so the whole catalog is in scope here. Every other
   * seller page is scoped to just that seller's stock.
   */
  const catalog = getCatalog();
  const products =
    sellerId === "baheti" ? catalog : catalog.filter((p) => p.sellerId === sellerId);

  return <PlpScreen title={seller.name} products={products} />;
}
