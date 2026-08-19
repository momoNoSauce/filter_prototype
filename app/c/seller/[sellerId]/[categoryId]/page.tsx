import { notFound } from "next/navigation";
import { PlpScreen } from "@/components/plp/PlpScreen";
import { verticalRoutes, verticalScope } from "@/lib/catalog/scope";

/**
 * Variant C — a **vertical-scoped** PLP. Sort and Filters pinned to the bottom, as in Variant A.
 *
 * The page is one product vertical rather than a listing filtered down to
 * one, which is the whole variable being tested against A and B: there is no
 * Category row on the rail and no vertical chip in the strip, because neither
 * could do anything a URL change couldn't undo. The vertical-specific
 * attributes are therefore always on.
 *
 * Reached by browsing: /c → /c/seller/[sellerId] → tap a vertical chip. The
 * app bar still carries **no home button** here, now for the plainer reason
 * that the title needs the width — these pages are titled by category, and the
 * frame's 20px was sized for a seller name. Back walks the loop it came down.
 */
export function generateStaticParams() {
  return verticalRoutes();
}

export default async function VerticalPageVariantC({
  params,
}: PageProps<"/c/seller/[sellerId]/[categoryId]">) {
  const { sellerId, categoryId } = await params;
  const scope = verticalScope(sellerId, categoryId);
  if (!scope) notFound();

  return (
    <PlpScreen
      // The category leads, because the page is the category.
      title={scope.category.label}
      products={scope.products}
      variant="bottom-bar"
      verticalMode={{ kind: "locked", id: scope.category.id }}
      homeHref={null}
    />
  );
}
