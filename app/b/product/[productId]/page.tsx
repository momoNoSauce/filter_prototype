import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/journey/ProductDetail";
import { getCatalog } from "@/lib/catalog/products";

/**
 * Variant B's product detail screen — where a card opens.
 *
 * **The screen is the journey's**, `components/journey/ProductDetail`, because
 * it is the only detail design that exists: Figma draws the home, the PLP and
 * the sheets, and the live app's screengrab is the only source for this one.
 * Reusing it beats inventing a second detail design for the same app, and it is
 * parameterised rather than copied — `homeHref` keeps B a closed loop, and B
 * passes no basket count, having no basket.
 *
 * Dynamic, deliberately: the catalog is 1,070 products and pre-rendering a page
 * each would double the build for screens a demo opens two of.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getCatalog().find((p) => p.id === productId);
  if (!product) notFound();

  return <ProductDetail product={product} homeHref="/b" />;
}
