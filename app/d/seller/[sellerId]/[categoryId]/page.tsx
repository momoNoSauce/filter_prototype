import { notFound } from "next/navigation";
import { VerticalPlp } from "@/components/plp/VerticalPlp";
import { verticalRoutes } from "@/lib/catalog/scope";

/**
 * Variant D at any seller/vertical pair — Sort and Filter as chips at the top, as in Variant B.
 *
 * `/d` itself is the demo link and lands on the default pair; this route exists
 * so every other one is reachable too.
 */
export function generateStaticParams() {
  return verticalRoutes();
}

export default async function VerticalPageVariantD({
  params,
}: PageProps<"/d/seller/[sellerId]/[categoryId]">) {
  const { sellerId, categoryId } = await params;
  const screen = VerticalPlp({
    sellerId,
    categoryId,
    variant: "top-chips",
    productBasePath: "/d",
  });
  if (!screen) notFound();
  return screen;
}
