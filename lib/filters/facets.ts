import {
  BRANDS,
  CATEGORIES,
  COLOURS,
  FABRICS,
  OFFERS,
  PACK_TYPES,
  SELLERS,
} from "@/lib/catalog/seed";
import { defaultVariant, type Product } from "@/lib/catalog/types";

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
   * Only one option can be held at a time — picking a second replaces the
   * first. Behaviour only: the row still renders as a checkbox, matching every
   * other facet.
   */
  single?: boolean;
  /**
   * The option ids this product belongs to. Returning several is legitimate —
   * "Within 3 days" and "Within 5 days" both match a 2-day product — and the
   * engine treats every facet the same way regardless of panel type.
   */
  valuesOf: (product: Product) => string[];
  options: FacetOption[];
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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

export const FACETS: FacetDef[] = [
  {
    id: "category",
    label: "Category",
    panel: "tile",
    searchable: true,
    valuesOf: (p) => [slug(p.category)],
    options: CATEGORIES.map((c) => ({
      id: slug(c.label),
      label: c.label,
      image: `/categories/${slug(c.label)}.jpg`,
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
    valuesOf: (p) => bucketId(PRICE_BUCKETS, defaultVariant(p).pricePerPc),
    options: PRICE_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "margin",
    label: "Margin",
    panel: "range",
    searchable: false,
    valuesOf: (p) => bucketId(MARGIN_BUCKETS, defaultVariant(p).marginPct),
    options: MARGIN_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "packType",
    label: "Pack Type",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => [slug(p.packType)],
    options: PACK_TYPES.map((p) => ({ id: slug(p.name), label: p.name })),
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
    id: "offers",
    label: "Offers",
    panel: "checkbox",
    searchable: false,
    valuesOf: (p) => p.offers.map(slug),
    options: OFFERS.map((o) => ({ id: slug(o.name), label: o.name })),
  },
  {
    id: "gender",
    label: "Gender",
    panel: "checkbox",
    searchable: false,
    // Journey mapping showed nobody shops two genders at once.
    single: true,
    // Not in RAIL — the bottom-bar sheet is the only way to set this. It stays
    // in the registry so the engine, the URL and facet counts all still see it.
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
export const RAIL: { id: string; label: string; facetIds: string[] }[] = [
  { id: "category", label: "Category", facetIds: ["category"] },
  { id: "delivery", label: "Delivery Time", facetIds: ["delivery"] },
  { id: "moq", label: "MOQ", facetIds: ["moq"] },
  { id: "brand", label: "Brands", facetIds: ["brand"] },
  { id: "price", label: "Price Range", facetIds: ["price"] },
  { id: "margin", label: "Margin", facetIds: ["margin"] },
  { id: "packType", label: "Pack Type", facetIds: ["packType"] },
  { id: "colour", label: "Colour", facetIds: ["colour"] },
  { id: "seller", label: "Seller", facetIds: ["seller"] },
  { id: "sellerCity", label: "Seller City", facetIds: ["sellerCity"] },
  { id: "offers", label: "Offers", facetIds: ["offers"] },
  { id: "more", label: "More Filters", facetIds: ["fabric", "tags"] },
];

/**
 * Facets the Filters screen owns.
 *
 * `gender` is deliberately absent: the bottom-bar sheet is its only entry
 * point, so the Filters screen must neither list it nor clear it. Everything
 * that touches the draft filters through this set.
 */
export const RAIL_FACET_IDS = new Set(RAIL.flatMap((entry) => entry.facetIds));
