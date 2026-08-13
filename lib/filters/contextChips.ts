import type { Product } from "@/lib/catalog/types";
import {
  discriminatingOptions,
  facetOptionsWithCounts,
  type CountedOption,
  type Selections,
} from "./engine";

export interface ContextChip {
  facetId: string;
  option: CountedOption;
}

/**
 * Which contextual chips the strip below the GOLD bar should carry.
 *
 * Shared by both variants: in A it is the whole of that strip, in B it follows
 * the Sort and Filter chips after the divider the frame already draws for it.
 *
 * The strip answers whichever question the shopper hasn't settled yet:
 *
 * - **Not inside a single product vertical** — none picked, or several — the
 *   open question is *which vertical*, so it offers those.
 * - **Inside exactly one** — the vertical is settled and the open questions
 *   are price and offers, so it offers those instead.
 *
 * Pure, and separate from the rendering, because the interesting part is this
 * selection rule rather than the markup.
 */
export function contextChips(products: Product[], selections: Selections): ContextChip[] {
  const inSingleVertical = (selections.category ?? []).length === 1;

  if (!inSingleVertical) {
    return facetOptionsWithCounts(products, selections, "category").map((option) => ({
      facetId: "category",
      option,
    }));
  }

  return SINGLE_VERTICAL_CHIPS.flatMap(({ facetId, only, discriminating }) => {
    const options = discriminating
      ? discriminatingOptions(products, selections, facetId)
      : facetOptionsWithCounts(products, selections, facetId);

    return options
      .filter((option) => !only || only.includes(option.id))
      .map((option) => ({ facetId, option }));
  });
}

/**
 * The single-vertical strip, in order: price bands, then the three offers.
 *
 * `discriminating` carries the "only if the products don't all share it" rule
 * — an offer every product in the vertical already has is a chip that filters
 * nothing. It is deliberately off for price: a band holding the entire
 * vertical is possible in principle, but hiding it would strand a narrow
 * catalog with an empty strip, and zero-count bands already drop out anyway.
 *
 * `only` keeps the offers list to the two that were asked for. Bulk Offer and
 * GOLD Target Scheme stay in the Filters panel rather than the strip.
 */
const SINGLE_VERTICAL_CHIPS: {
  facetId: string;
  /** Restrict to these option ids. Omitted means every option the facet has. */
  only?: string[];
  discriminating?: boolean;
}[] = [
  { facetId: "price" },
  { facetId: "hasOffer", discriminating: true },
  { facetId: "offers", only: ["cashback", "free-delivery"], discriminating: true },
];
