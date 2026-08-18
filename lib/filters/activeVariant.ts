import type { Product, Variant } from "@/lib/catalog/types";

export const SIZE_FACET_ID = "size";

/**
 * A size's option id. `Variant.sizes` carries display labels — "3XL", "4-5Y" —
 * so anything comparing a pack against a selection has to map them the same
 * way the facet's options were built. Declared once here and imported by
 * `FACETS`, because two copies of this drifting apart silently pins every card
 * to pack #1 with nothing failing.
 */
export const sizeOptionId = (size: string) =>
  size.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Which pack a card is talking about.
 *
 * Sizes live on the pack, not the product, so a size filter matches a product
 * whenever *any* of its packs carries a selected size (plain OR-within-a-facet
 * — see `FACETS`). That leaves a second question the engine still has to
 * answer: once the product is in, which of its two-to-four packs is the one
 * being shown and priced?
 *
 * The answer is the **first pack from the left** that carries a selected size.
 * Pills run in ascending set size, so that is the smallest pack a retailer can
 * buy their size in — the low-commitment default.
 *
 * This is deliberately the same pack for display and for ranking. Leaving sort
 * on pack #1 while the card printed pack #3's price made "Price/pc low → high"
 * order the list by numbers nobody could see, which reads as broken sorting.
 *
 * Selection order is ignored: `sizes` is a set, so the leftmost *pack* wins,
 * never the first size the retailer happened to tap.
 */
export function activeVariantIndex(product: Product, sizes?: string[]): number {
  if (!sizes?.length) return 0;
  const hit = product.variants.findIndex((v) =>
    v.sizes.some((s) => sizes.includes(sizeOptionId(s))),
  );
  // A product filtered *in* by size always has a hit. Counting passes can ask
  // about products that were not, so fall back rather than returning -1.
  return hit === -1 ? 0 : hit;
}

export function activeVariant(product: Product, sizes?: string[]): Variant {
  return product.variants[activeVariantIndex(product, sizes)];
}
