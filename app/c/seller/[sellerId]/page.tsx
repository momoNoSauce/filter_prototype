import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { getCatalog, STOREFRONT } from "@/lib/catalog/products";
import { SELLERS } from "@/lib/catalog/seed";

/**
 * Variant C's seller PLP — Sort and Filters pinned to the bottom, as in Variant A.
 *
 * The one thing that differs from A: a vertical is **browsed into**, not
 * ticked. The chips in the strip are links to that vertical's own page, and
 * Category leaves the Filters rail because navigating and ticking are two
 * answers to one question. Gender stays — several verticals are in scope here,
 * so it still cuts something.
 */
export function generateStaticParams() {
  return SELLERS.map((seller) => ({ sellerId: seller.id }));
}

export default async function SellerPageVariantC({
  params,
}: PageProps<"/c/seller/[sellerId]">) {
  const { sellerId } = await params;
  const seller = SELLERS.find((s) => s.id === sellerId);
  if (!seller) notFound();

  const catalog = getCatalog();
  const products =
    sellerId === STOREFRONT.id ? catalog : catalog.filter((p) => p.sellerId === sellerId);

  return (
    <PlpScreen
      title={seller.name}
      products={products}
      variant="bottom-bar"
      verticalMode={{ kind: "browse" }}
      verticalBasePath={`/c/seller/${sellerId}`}
      homeHref="/c"
    />
  );
}
