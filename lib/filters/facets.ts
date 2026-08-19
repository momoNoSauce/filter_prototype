import {
  BRANDS,
  CATEGORIES,
  COLOURS,
  FABRICS,
  ALL_SIZES,
  OFFERS,
  PV_ATTRIBUTES,
  PV_ATTRIBUTE_OPTIONS,
  SELLERS,
} from "@/lib/catalog/seed";
import type { Product } from "@/lib/catalog/types";
import { activeVariant, sizeOptionId } from "./activeVariant";

export type PanelType = "tile" | "checkbox" | "swatch" | "range";

export interface FacetOption {
  id: string;
  label: string;
  /** Swatch panels only */
  hex?: string;
  /** Tile panels only */
  image?: string;
}

export interface FacetDef {
  id: string;
  label: string;
  panel: PanelType;
  /** Show the search field above the options */
  searchable: boolean;
  /**
   * The option ids this product belongs to. Returning several is legitimate —
   * "Within 3 days" and "Within 5 days" both match a 2-day product — and the
   * engine treats every facet the same way regardless of panel type.
   *
   * `sizes` is the current Size selection, and the *only* selection any facet
   * is allowed to see. Price and Margin need it because they read the pack the
   * card is showing, which a size filter moves; every other facet ignores it.
   * Passing the one selection that can move a value, rather than the whole
   * set, keeps that dependency visible instead of letting any facet quietly
   * depend on any other.
   */
  valuesOf: (product: Product, sizes?: string[]) => string[];
  options: FacetOption[];
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Category ids are declared in the catalog rather than slugged from the label,
 * because the labels carry apostrophes — slugging "Women's T-Shirts" would put
 * `women-s-t-shirts` in the URL and in the image filename. Products store the
 * display label, so the facet maps back through this.
 */
const CATEGORY_ID_BY_LABEL = new Map(CATEGORIES.map((c) => [c.label, c.id]));

/** Cumulative buckets: a 1-day product also satisfies "Within 3 days". */
const DELIVERY_BUCKETS = [
  { id: "d1", label: "Next day", maxDays: 1 },
  { id: "d2", label: "Within 2 days", maxDays: 2 },
  { id: "d3", label: "Within 3 days", maxDays: 3 },
  { id: "d5", label: "Within 5 days", maxDays: 5 },
  { id: "d7", label: "Within 7 days", maxDays: 7 },
];

const MOQ_BUCKETS = [
  { id: "moq-4", label: "Up to 4 pc", min: 0, max: 4 },
  { id: "moq-10", label: "5 – 10 pc", min: 5, max: 10 },
  { id: "moq-20", label: "11 – 20 pc", min: 11, max: 20 },
  { id: "moq-max", label: "More than 20 pc", min: 21, max: Infinity },
];

const PRICE_BUCKETS = [
  { id: "p-200", label: "Under ₹200", min: 0, max: 199 },
  { id: "p-400", label: "₹200 – ₹400", min: 200, max: 399 },
  { id: "p-600", label: "₹400 – ₹600", min: 400, max: 599 },
  { id: "p-900", label: "₹600 – ₹900", min: 600, max: 899 },
  { id: "p-max", label: "₹900 & above", min: 900, max: Infinity },
];

const MARGIN_BUCKETS = [
  { id: "m-30", label: "Under 30%", min: 0, max: 29 },
  { id: "m-45", label: "30% – 45%", min: 30, max: 44 },
  { id: "m-60", label: "45% – 60%", min: 45, max: 59 },
  { id: "m-max", label: "60% & above", min: 60, max: Infinity },
];

function bucketId<T extends { id: string; min: number; max: number }>(
  buckets: T[],
  value: number,
): string[] {
  const hit = buckets.find((b) => value >= b.min && value <= b.max);
  return hit ? [hit.id] : [];
}

/**
 * The vertical-specific attributes, built from one table rather than five
 * near-identical literals — they differ only in id and label, and five copies
 * of the same shape is five chances for one to drift.
 */
const PV_ATTRIBUTE_FACETS: FacetDef[] = PV_ATTRIBUTES.map(({ id, label }) => ({
  id,
  label,
  panel: "checkbox",
  searchable: false,
  valuesOf: (p) => [slug(p[id])],
  options: PV_ATTRIBUTE_OPTIONS[id].map((name) => ({ id: slug(name), label: name })),
}));

export const FACETS: FacetDef[] = [
  {
    id: "category",
    label: "Category",
    panel: "tile",
    searchable: true,
    valuesOf: (p) => {
      const id = CATEGORY_ID_BY_LABEL.get(p.category);
      return id ? [id] : [];
    },
    options: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      image: `/categories/${c.id}.jpg`,
    })),
  },
  {
    id: "delivery",
    label: "Delivery Time",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => DELIVERY_BUCKETS.filter((b) => p.deliveryDays <= b.maxDays).map((b) => b.id),
    options: DELIVERY_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "moq",
    label: "MOQ",
    panel: "range",
    searchable: false,
    valuesOf: (p) => bucketId(MOQ_BUCKETS, p.moq),
    options: MOQ_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "brand",
    label: "Brands",
    // Same tile grid as Category.
    panel: "tile",
    searchable: true,
    valuesOf: (p) => [slug(p.brand)],
    options: [...BRANDS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b) => ({ id: slug(b.name), label: b.name })),
  },
  {
    id: "price",
    label: "Price Range",
    panel: "range",
    searchable: false,
    valuesOf: (p, sizes) => bucketId(PRICE_BUCKETS, activeVariant(p, sizes).pricePerPc),
    options: PRICE_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "margin",
    label: "Margin",
    panel: "range",
    searchable: false,
    valuesOf: (p, sizes) => bucketId(MARGIN_BUCKETS, activeVariant(p, sizes).marginPct),
    options: MARGIN_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "size",
    label: "Size",
    panel: "checkbox",
    searchable: false,
    /**
     * Every size the product is made in, unioned across its packs — so ticking
     * L returns anything with at least one pack carrying L, and ticking M and
     * L returns anything carrying either. That is the engine's ordinary
     * OR-within-a-facet rule with no exception, which is why Size costs one
     * array entry like every other facet.
     *
     * Which of those packs the card then shows is a separate question, and the
     * only one Size answers differently — see `activeVariantIndex`.
     */
    valuesOf: (p) => [...new Set(p.variants.flatMap((v) => v.sizes))].map(sizeOptionId),
    options: ALL_SIZES.map((size) => ({ id: sizeOptionId(size), label: size })),
  },
  {
    id: "colour",
    label: "Colour",
    panel: "swatch",
    searchable: true,
    valuesOf: (p) => [slug(p.colour)],
    options: COLOURS.map((c) => ({ id: slug(c.name), label: c.name, hex: c.hex })),
  },
  {
    id: "seller",
    label: "Seller",
    panel: "checkbox",
    searchable: true,
    valuesOf: (p) => [p.sellerId],
    options: SELLERS.map((s) => ({ id: s.id, label: s.name })),
  },
  {
    id: "sellerCity",
    label: "Seller City",
    panel: "checkbox",
    searchable: true,
    valuesOf: (p) => [slug(p.sellerCity)],
    options: [...new Set(SELLERS.map((s) => s.city))]
      .sort()
      .map((city) => ({ id: slug(city), label: city })),
  },
  {
    /*
     * "Carries any offer at all" — its own facet rather than a fifth option
     * inside `offers`. Inside it, OR-within-a-facet would make Seller Offer
     * *widen* a Cashback selection instead of narrowing it; as a separate
     * facet the two AND, which is what a catch-all has to do.
     */
    id: "hasOffer",
    label: "Seller Offer",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => (p.offers.length ? ["any"] : []),
    options: [{ id: "any", label: "Seller Offer" }],
  },
  {
    id: "offers",
    label: "Offers",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => p.offers.map(slug),
    options: OFFERS.map((o) => ({ id: slug(o.name), label: o.name })),
  },
  {
    /*
     * Gender is reached differently in each variant, and behaves accordingly:
     *
     * - Variant A — the bottom-bar sheet, which is single-select by its own
     *   logic (journey mapping: nobody shops two genders at once). Not in that
     *   variant's rail at all.
     * - Variant B — a normal rail facet, multi-select like every other one,
     *   since there is no bottom bar to host a quick action.
     *
     * That's why there's no `single` flag here: the entry point decides, not
     * the facet.
     */
    id: "gender",
    label: "Gender",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => [p.gender],
    options: [
      { id: "men", label: "Men" },
      { id: "women", label: "Women" },
      { id: "boys", label: "Boys" },
      { id: "girls", label: "Girls" },
    ],
  },
  // The two below share the "More Filters" rail entry.
  {
    id: "fabric",
    label: "Fabric",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => [slug(p.fabric)],
    options: FABRICS.map((f) => ({ id: slug(f.name), label: f.name })),
  },
  ...PV_ATTRIBUTE_FACETS,
  {
    id: "tags",
    label: "Product Tags",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => (p.bestSeller ? ["best-seller"] : []),
    options: [{ id: "best-seller", label: "Best Seller" }],
  },
];

export const FACET_BY_ID = new Map(FACETS.map((f) => [f.id, f]));

/**
 * The left rail of the Filters screen. Most entries map to one facet;
 * "More Filters" stacks three.
 */
export interface RailEntry {
  id: string;
  label: string;
  facetIds: string[];
}

/**
 * Which control model the screen is running. The rail differs between the two
 * because each variant hands a different set of facets to its own controls,
 * and a facet must never be reachable from two places at once.
 */
export type PlpVariant = "bottom-bar" | "top-chips";

/** Everything below Category and Gender — identical in both variants. */
const COMMON_RAIL: RailEntry[] = [
  { id: "delivery", label: "Delivery Time", facetIds: ["delivery"] },
  { id: "moq", label: "MOQ", facetIds: ["moq"] },
  { id: "brand", label: "Brands", facetIds: ["brand"] },
  { id: "price", label: "Price Range", facetIds: ["price"] },
  { id: "margin", label: "Margin", facetIds: ["margin"] },
  // Not in the Figma rail, which predates the facet. Placed with the other
  // garment attributes rather than at the top, so the designed order above it
  // is left alone — worth a designer's call, since size is the filter an
  // apparel buyer reaches for first.
  { id: "size", label: "Size", facetIds: ["size"] },
  { id: "colour", label: "Colour", facetIds: ["colour"] },
  // Not vertical-specific despite being asked for alongside them: Cotton and
  // Denim mean the same on a shirt as on a tee, where a collar has no tee
  // equivalent at all. So it sits here, once, rather than appearing in the
  // vertical block and again in More Filters.
  { id: "fabric", label: "Fabric", facetIds: ["fabric"] },
  { id: "seller", label: "Seller", facetIds: ["seller"] },
  { id: "sellerCity", label: "Seller City", facetIds: ["sellerCity"] },
  // `hasOffer` is reached from a chip, but it has to be listed here too, or a
  // chip-applied filter would survive Clear Filters and go uncounted by the
  // Filters badge with no control left to undo it once the chip strip changes.
  { id: "offers", label: "Offers", facetIds: ["hasOffer", "offers"] },
  { id: "more", label: "More Filters", facetIds: ["tags"] },
];

/**
 * Rows the rail only shows once the shopper is inside **exactly one** product
 * vertical.
 *
 * Across verticals these are noise: a Neck Type list spanning every category
 * offers *Spread Collar* beside *Round Neck*, and neither answers a question
 * anyone is asking while still deciding between shirts and tees. Inside one
 * vertical they are the filters that remain.
 *
 * Fabric is deliberately **not** here, though it was asked for alongside them.
 * Its values don't vary by vertical — Cotton and Denim mean the same on a
 * shirt as on a tee, where a collar has no tee equivalent at all — so it is an
 * ordinary rail row instead, visible whether or not a vertical is settled.
 */
const PV_RAIL: RailEntry[] = PV_ATTRIBUTES.map(({ id, label }) => ({
  id,
  label,
  facetIds: [id],
}));

/**
 * The facets `PV_RAIL` owns, for the orphan check below. Typed as strings
 * because every caller is testing an arbitrary selection key against it.
 */
export const PV_FACET_IDS: Set<string> = new Set(PV_ATTRIBUTES.map(({ id }) => String(id)));

/** Whether the rail is showing its vertical-specific block. */
export const inSingleVertical = (category?: string[]) => category?.length === 1;

/** First in both rails. */
const CATEGORY_ENTRY: RailEntry = { id: "category", label: "Category", facetIds: ["category"] };

/** Second in both rails, directly under Category. */
const GENDER_ENTRY: RailEntry = { id: "gender", label: "Gender", facetIds: ["gender"] };

/**
 * The Filters rail — now **identical in both variants**.
 *
 * Category moved out of A's bottom bar and into this rail on 2026-08-19, so
 * the last facet-level difference between the variants is gone. What remains
 * between them is Sort and Filters at the bottom versus the same two as chips
 * at the top, which is the only thing the A/B was ever meant to test.
 *
 * The `variant` parameter went with the difference. What it takes instead is
 * the **category selection**, because the rail grows a vertical-specific block
 * once exactly one vertical is settled — see `PV_RAIL`.
 */
export function getRail(category?: string[]): RailEntry[] {
  const base = [CATEGORY_ENTRY, GENDER_ENTRY, ...COMMON_RAIL];
  if (!inSingleVertical(category)) return base;

  // Ahead of *More Filters*, which is the catch-all and should stay last.
  const tail = base.length - 1;
  return [...base.slice(0, tail), ...PV_RAIL, ...base.slice(tail)];
}

/**
 * Facets the Filters screen owns, for the given variant. Anything mutating the
 * draft — notably Clear Filters — must filter through this, so a facet the
 * screen doesn't display can never be cleared by it.
 */
export function getRailFacetIds(category?: string[]): Set<string> {
  return new Set(getRail(category).flatMap((entry) => entry.facetIds));
}

/**
 * Drop vertical-specific selections the rail is no longer showing.
 *
 * Leaving a single vertical takes their controls off screen with it, and a
 * filter still narrowing the list with nothing left to display or undo it is
 * the exact trap the `hasOffer` rail entry exists to avoid — it would survive
 * Clear Filters, go uncounted by the badge, and quietly hide products.
 *
 * Applied wherever selections change rather than only in the Filters screen,
 * because a chip tap can leave a vertical too, and `parseSelections` can be
 * handed a URL that was never reachable by clicking at all.
 */
export function dropOrphanedAttributes<T extends Record<string, string[]>>(selections: T): T {
  if (inSingleVertical(selections.category)) return selections;
  if (!Object.keys(selections).some((id) => PV_FACET_IDS.has(id))) return selections;

  return Object.fromEntries(
    Object.entries(selections).filter(([id]) => !PV_FACET_IDS.has(id)),
  ) as T;
}
