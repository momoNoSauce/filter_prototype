import { notFound } from "next/navigation";
import { VerticalPlp } from "@/components/plp/VerticalPlp";
import { verticalRoutes } from "@/lib/catalog/scope";

/**
 * Variant C at any seller/vertical pair — Sort and Filters pinned to the bottom, as in Variant A.
 *
 * `/c` itself is the demo link and lands on the default pair; this route exists
 * so every other one is reachable too.
 */
export function generateStaticParams() {
  return verticalRoutes();
}

export default async function VerticalPageVariantC({
  params,
}: PageProps<"/c/seller/[sellerId]/[categoryId]">) {
  const { sellerId, categoryId } = await params;
  const screen = VerticalPlp({ sellerId, categoryId, variant: "bottom-bar" });
  if (!screen) notFound();
  return screen;
}
