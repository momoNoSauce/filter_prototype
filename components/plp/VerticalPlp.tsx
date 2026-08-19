import { PlpScreen } from "./PlpScreen";
import { verticalScope } from "@/lib/catalog/scope";
import type { PlpVariant } from "@/lib/filters/facets";

/**
 * A vertical-scoped PLP — variants C and D.
 *
 * The page **is** one product vertical rather than a listing filtered to one,
 * which is the whole variable being tested against A and B: no Category row on
 * the rail, no Gender row (one vertical is one audience), no vertical chip in
 * the strip, and the vertical-specific attributes always on.
 *
 * Shared by four routes — `/c`, `/d`, and the two deep-link routes under them —
 * so the two variants can only differ by where Sort and Filters sit.
 *
 * Returns `null` for a seller with no stock in the vertical, which the routes
 * turn into a 404: better than a listing reading "No products match" with no
 * filter to blame it on.
 */
export function VerticalPlp({
  sellerId,
  categoryId,
  variant,
}: {
  sellerId: string;
  categoryId: string;
  variant: PlpVariant;
}) {
  const scope = verticalScope(sellerId, categoryId);
  if (!scope) return null;

  return (
    <PlpScreen
      // The category leads, because the page is the category.
      title={scope.category.label}
      products={scope.products}
      variant={variant}
      verticalMode={{ kind: "locked", id: scope.category.id }}
      // No home button: these have no home of their own, and the title needs
      // the width — see `AppBar`.
      homeHref={null}
    />
  );
}
