import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/journey/ProductDetail";
import { getKartikCatalog } from "@/lib/catalog/kartik";

/**
 * The journey's product detail screen — where `VIEW DETAILS` lands.
 *
 * Scoped to Kartik's catalog rather than the main one: this screen was built
 * from his storefront's screengrab, and A–D's cards deliberately still don't
 * navigate, so a `p-****` id here would render a card design its product has
 * never been shown in.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getKartikCatalog().find((p) => p.id === productId);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
