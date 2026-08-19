import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { getCatalog, STOREFRONT } from "@/lib/catalog/products";
import { SELLERS } from "@/lib/catalog/seed";

/**
 * Variant D's seller PLP — Sort and Filter as chips at the top, as in Variant B.
 *
 * The one thing that differs from B: a vertical is **browsed into**, not
 * ticked. The chips in the strip are links to that vertical's own page, and
 * Category leaves the Filters rail because navigating and ticking are two
 * answers to one question. Gender stays — several verticals are in scope here,
 * so it still cuts something.
 */
export function generateStaticParams() {
  return SELLERS.map((seller) => ({ sellerId: seller.id }));
}

export default async function SellerPageVariantD({
  params,
}: PageProps<"/d/seller/[sellerId]">) {
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
      variant="top-chips"
      verticalMode={{ kind: "browse" }}
      verticalBasePath={`/d/seller/${sellerId}`}
      homeHref="/d"
    />
  );
}
