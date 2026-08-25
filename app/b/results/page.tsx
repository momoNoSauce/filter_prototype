import { PlpScreen } from "@/components/plp/PlpScreen";
import { getCatalog } from "@/lib/catalog/products";
import { searchProducts } from "@/lib/catalog/search";

/**
 * Search results — variant /b's listing, and since 2026-08-25 the way into
 * the filter demo, where it used to be the Baheti storefront.
 *
 * The scope is the same one it always was: `shirt` matches all 1,070 products,
 * every category being a Shirt or a T-Shirt, so no facet count, test or demo
 * script moved when the framing changed.
 *
 * **Dynamic, not pre-rendered**, because the query is open-ended — there is no
 * finite set of `?q=` to enumerate, unlike the seller and vertical routes.
 *
 * The app bar carries the query as its title. No screengrab of the results
 * screen was supplied, so this reuses the standard `AppBar` rather than
 * inventing a second one; if the live app keeps the search field up there
 * instead, that is the thing to change.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  return (
    <PlpScreen
      title={query || "All products"}
      products={searchProducts(getCatalog(), query)}
      variant="top-chips"
      homeHref="/b"
      productBasePath="/b"
    />
  );
}
