import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { verticalRoutes, verticalScope } from "@/lib/catalog/scope";

/**
 * Variant D — a **vertical-scoped** PLP. Sort and Filter as chips under the GOLD strip, as in Variant B.
 *
 * The page is one product vertical rather than a listing filtered down to
 * one, which is the whole variable being tested against A and B: there is no
 * Category row on the rail and no vertical chip in the strip, because neither
 * could do anything a URL change couldn't undo. The vertical-specific
 * attributes are therefore always on.
 *
 * Linked directly — there is no /d home or seller page, by choice, so the app
 * bar carries **no home button**: every href it could hold leads out of the
 * variant. Back is the way out. That also buys the title the width it needs,
 * these pages being titled by category rather than by seller.
 */
export function generateStaticParams() {
  return verticalRoutes();
}

export default async function VerticalPageVariantD({
  params,
}: PageProps<"/d/seller/[sellerId]/[categoryId]">) {
  const { sellerId, categoryId } = await params;
  const scope = verticalScope(sellerId, categoryId);
  if (!scope) notFound();

  return (
    <PlpScreen
      // The category leads, because the page is the category.
      title={scope.category.label}
      products={scope.products}
      variant="top-chips"
      lockedVertical={scope.category.id}
      homeHref={null}
    />
  );
}
