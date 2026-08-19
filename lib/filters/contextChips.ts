import type { Product } from "@/lib/catalog/types";
import {
  discriminatingOptions,
  facetOptionsWithCounts,
  type CountedOption,
  type Selections,
} from "./engine";
import { FILTER_VERTICALS, type VerticalMode } from "./facets";

/**
 * The strip carries three kinds of chip, and they render differently enough
 * that the kind is part of the data rather than something the view infers.
 */
export type ContextChip =
  /** Product vertical: a thumbnail, a two-line label, and a remove ✕ once picked. */
  | { kind: "vertical"; facetId: "category"; option: CountedOption }
  /** Price: one chip opening a dropdown over the bands, rather than a chip each. */
  | { kind: "price"; facetId: "price"; options: CountedOption[] }
  /** Plain Material filter chip — the three offers. */
  | { kind: "filter"; facetId: string; option: CountedOption };

/**
 * Which contextual chips the strip below the app bar should carry.
 *
 * Shared by both variants: in A it is the whole of that strip, in B it follows
 * the Sort and Filter chips after the divider the frame already draws for it.
 *
 * The strip answers whichever question the shopper hasn't settled yet:
 *
 * - **Not inside a single product vertical** — none picked, or several — the
 *   open question is *which vertical*, so it offers those.
 * - **Inside exactly one** — the vertical leads, still removable by its ✕ so
 *   the strip is also the way back out, and price and offers follow it.
 * - **`locked`** (C and D) — the *page* is a vertical, so there is no vertical
 *   to offer and none to remove. The strip is price and offers only. Leading
 *   it with an unremovable chip would be a ✕ that isn't there, and a removable
 *   one would have to unmake the page.
 *
 * Pure, and separate from the rendering, because the interesting part is this
 * selection rule rather than the markup.
 */
export function contextChips(
  products: Product[],
  selections: Selections,
  mode: VerticalMode = FILTER_VERTICALS,
): ContextChip[] {
  const locked = mode.kind === "locked";
  const picked = selections.category ?? [];
  const verticals = locked ? [] : facetOptionsWithCounts(products, selections, "category");

  if (!locked && picked.length !== 1) {
    return verticals.map((option) => ({ kind: "vertical", facetId: "category", option }));
  }

  const current = locked ? undefined : verticals.find((option) => option.id === picked[0]);

  return [
    // Leads the strip. `facetOptionsWithCounts` keeps a selected option even at
    // zero, so this is only missing if the id in the URL isn't a real vertical.
    ...(current
      ? [{ kind: "vertical" as const, facetId: "category" as const, option: current }]
      : []),
    {
      kind: "price",
      facetId: "price",
      options: facetOptionsWithCounts(products, selections, "price"),
    },
    ...OFFER_CHIPS.flatMap(({ facetId, only }) =>
      discriminatingOptions(products, selections, facetId)
        .filter((option) => !only || only.includes(option.id))
        .map((option) => ({ kind: "filter" as const, facetId, option })),
    ),
  ];
}

/**
 * The three offer chips, in order.
 *
 * They use `discriminatingOptions`, which carries the "only if the products
 * don't all share it" rule — an offer every product in the vertical already
 * has is a chip that filters nothing.
 *
 * Price deliberately doesn't get that treatment: its bands are behind a
 * dropdown that always shows, and hiding a band holding the whole vertical
 * would strand a narrow catalog with an empty menu. Zero-count bands still
 * drop out, as they do everywhere.
 *
 * `only` keeps the list to the two specific offers asked for. Bulk Offer and
 * Bulk Offer stays in the Filters panel rather than the strip.
 */
const OFFER_CHIPS: { facetId: string; only?: string[] }[] = [
  { facetId: "hasOffer" },
  { facetId: "offers", only: ["cashback", "free-delivery"] },
];
