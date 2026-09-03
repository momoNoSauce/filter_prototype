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
  /**
   * Override the default match, which is set membership over `valuesOf`.
   *
   * Exactly one facet needs this — Price, since 2026-08-28, because a typed
   * `min–max` is not one of a fixed set of ids and so has nothing for
   * `valuesOf` to return. The alternative was letting `valuesOf` see the price
   * selection, and the registry's standing rule is that **Size is the only
   * selection any facet may see**; widening that to "any facet may see its own"
   * would make the dependency invisible again.
   *
   * It stays a registry field rather than an engine special case, so adding a
   * facet is still one array entry and every facet still runs through one code
   * path. `valuesOf` must keep working regardless — the counts are tallied from
   * it, and a facet that only knew how to `match` could not be counted.
   */
  matches?: (product: Product, chosen: string[], sizes?: string[]) => boolean;
  /**
   * Accept a selection id that isn't one of `options` — the companion to
   * `matches`, and needed by the same one facet.
   *
   * `parseSelections` validates every id in the query string against the
   * facet's options, which is what stops a hand-typed `?seller=nonsense`
   * filtering a listing to nothing. A typed price range is legitimate and in no
   * option list, so Price widens the test rather than the guard being dropped:
   * `?price=150-450` survives a reload, `?price=junk` still doesn't.
   *
   * A facet that overrides `matches` almost certainly needs this too — without
   * it the selection works in-session and vanishes on refresh, which is exactly
   * how this was found.
   */
  accepts?: (id: string) => boolean;
}

/**
 * A typed price range, as it appears in a selection and in the URL: `150-450`,
 * `150-` for a floor alone, `-450` for a ceiling alone.
 *
 * Plain digits and a hyphen rather than a prefixed id, so the URL reads
 * `?price=150-450`. It cannot collide with a band: every bucket id starts with
 * a letter and a hyphen (`p-200`, `p-max`), and this must start with a digit or
 * the hyphen itself.
 */
const PRICE_RANGE_RE = /^(\d*)-(\d*)$/;

export function parsePriceRange(id: string): { min: number; max: number } | null {
  const hit = PRICE_RANGE_RE.exec(id);
  if (!hit) return null;
  const [, lo, hi] = hit;
  // `-` alone is not a range; at least one end has to be given.
  if (!lo && !hi) return null;
  return { min: lo ? Number(lo) : 0, max: hi ? Number(hi) : Infinity };
}

/** The selection id for a typed range, or `null` when neither end is set. */
export function priceRangeId(min: string, max: string): string | null {
  const lo = min.replace(/\D/g, "");
  const hi = max.replace(/\D/g, "");
  return lo || hi ? `${lo}-${hi}` : null;
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
  valuesOf: (p) => [slug(p[id])],
  options: PV_ATTRIBUTE_OPTIONS[id].map((name) => ({ id: slug(name), label: name })),
}));

export const FACETS: FacetDef[] = [
  {
    id: "category",
    label: "Category",
    panel: "tile",
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
    valuesOf: (p) => DELIVERY_BUCKETS.filter((b) => p.deliveryDays <= b.maxDays).map((b) => b.id),
    options: DELIVERY_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "moq",
    label: "MOQ",
    panel: "range",
    valuesOf: (p) => bucketId(MOQ_BUCKETS, p.moq),
    options: MOQ_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "brand",
    label: "Brands",
    // Same tile grid as Category.
    panel: "tile",
    valuesOf: (p) => [slug(p.brand)],
    options: [...BRANDS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b) => ({ id: slug(b.name), label: b.name })),
  },
  {
    id: "price",
    label: "Price Range",
    panel: "range",
    valuesOf: (p, sizes) => bucketId(PRICE_BUCKETS, activeVariant(p, sizes).pricePerPc),
    options: PRICE_BUCKETS.map(({ id, label }) => ({ id, label })),
    /*
     * Bands and typed ranges in one facet (2026-08-28). A–D tick bands; the
     * journey types a range. Both are "which prices", so one facet holds them
     * — two would AND against each other, and a buyer who typed 150–450 would
     * then have to clear a band to see anything.
     *
     * A range and a band still OR, like any two values within a facet. Nothing
     * offers both at once today: the journey's panel has no bands and A–D have
     * no inputs.
     *
     * `min > max` is left to match nothing rather than being swapped or
     * suppressed. It is a transient typing state, the footer says `Show 0
     * results` the moment it happens, and correcting it is one keystroke —
     * where silently swapping the ends filters on something the buyer did not
     * type.
     */
    accepts: (id) => parsePriceRange(id) !== null,
    matches: (p, chosen, sizes) => {
      const price = activeVariant(p, sizes).pricePerPc;
      return chosen.some((id) => {
        const range = parsePriceRange(id);
        return range
          ? price >= range.min && price <= range.max
          : bucketId(PRICE_BUCKETS, price).includes(id);
      });
    },
  },
  {
    id: "margin",
    label: "Margin",
    panel: "range",
    valuesOf: (p, sizes) => bucketId(MARGIN_BUCKETS, activeVariant(p, sizes).marginPct),
    options: MARGIN_BUCKETS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: "size",
    label: "Size",
    panel: "checkbox",
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
    valuesOf: (p) => [slug(p.colour)],
    options: COLOURS.map((c) => ({ id: slug(c.name), label: c.name, hex: c.hex })),
  },
  {
    id: "seller",
    label: "Seller",
    panel: "checkbox",
    valuesOf: (p) => [p.sellerId],
    options: SELLERS.map((s) => ({ id: s.id, label: s.name })),
  },
  {
    id: "sellerCity",
    label: "Seller City",
    panel: "checkbox",
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
    valuesOf: (p) => (p.offers.length ? ["any"] : []),
    options: [{ id: "any", label: "Seller Offer" }],
  },
  {
    id: "offers",
    label: "Offers",
    panel: "checkbox",
    valuesOf: (p) => p.offers.map(slug),
    // Retired offers are still drawn, to hold the seed — see OFFERS — but no
    // product carries one, so listing it would be a permanently empty option.
    // Nothing is retired since Target Scheme came back on 2026-08-28; the
    // filter stays because it is the mechanism for retiring the next one
    // without re-rolling the catalog, not because it currently drops anything.
    options: OFFERS.filter((o) => !o.retired).map((o) => ({ id: slug(o.name), label: o.name })),
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
    valuesOf: (p) => [slug(p.fabric)],
    options: FABRICS.map((f) => ({ id: slug(f.name), label: f.name })),
  },
  ...PV_ATTRIBUTE_FACETS,
  {
    id: "tags",
    label: "Product Tags",
    panel: "checkbox",
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
/**
 * The Filters rail, in order.
 *
 * The sequence follows a **reference apparel PLP** (Flipkart, screengrabbed
 * 2026-08-19) rather than the Figma frame, which ordered these before most of
 * them existed: Brand, Size, Colour, Gender, Fabric, then the garment
 * attributes, then Price, then the commercial filters. It is the order a
 * clothing buyer is used to, and the frame has no opinion about the ten rows
 * it never drew.
 *
 * Departures from the reference, all because the reference has no equivalent:
 *
 * - **Category and Gender lead**, in that order, ahead of Brands. The
 *   reference has no category filter at all — you are already inside one,
 *   which is exactly variants C and D, where both rows are gone — and puts
 *   Gender fourth. Together they decide who the garment is for, which a buyer
 *   settles before picking a label off it.
 * - **Neck Type and Closure Type** follow Fit, Pattern and Sleeve Type, the
 *   three the reference does carry, rather than interleaving.
 * - **Size** keeps the reference's third slot rather than joining the block,
 *   even though it is shown on the same terms — it reads as a garment basic
 *   beside Brand and Colour, not as a vertical-specific attribute.
 * - **Margin** sits with Price, being the other number a retailer buys on.
 * - **Seller and Seller City** are B2B and land with the commercial filters.
 * - **The vertical block trails the commercial rows** (2026-08-19), where the
 *   reference interleaves it up beside Fabric. Interleaving meant picking a
 *   vertical pushed **Price Range from 6th to 12th** and below the fold, so
 *   the rail a buyer had learned was not the rail they got back. Moving the
 *   block past Seller City holds every commercial row still instead.
 *
 *   Gender leaving and Size arriving then cancel exactly, so **Colour through
 *   Seller City sit at the same index in both states** — nine rows that do not
 *   move. Only Brands shifts, up one into Gender's slot.
 * - **More Filters** stays last, as the catch-all.
 *
 * One ordered list rather than a base plus insertions — slicing around a block
 * was going to be the thing that quietly put a row in the wrong place.
 */
const RAIL_ORDER: (RailEntry & {
  only?: "filter";
  /** Shown only while the vertical block is — inside one vertical, or locked. */
  vertical?: true;
  /** The reverse: shown only while the block is *not*. */
  notVertical?: true;
})[] = [
  { id: "category", label: "Category", facetIds: ["category"], only: "filter" },
  /*
   * Ahead of Brands, where the reference puts it fourth. Category and Gender
   * are the two cuts that decide *who the garment is for*, and a buyer settles
   * that before picking a label off it.
   *
   * It leaves the moment a vertical is settled. Category → gender is 1:1, so
   * one vertical is one audience and the row could then only offer the single
   * value every product in scope already has — dead by the same test
   * `discriminatingOptions` applies to the offer chips. `notVertical` covers
   * `locked` too, C and D having settled their vertical by being the page.
   */
  { id: "gender", label: "Gender", facetIds: ["gender"], notVertical: true },
  { id: "brand", label: "Brands", facetIds: ["brand"] },
  /*
   * Vertical-only, though it keeps its place in the reference order rather
   * than joining the block below.
   *
   * A size means nothing across verticals: M in menswear is not M in
   * womenswear, so a single M row spanning both would merge two different
   * garments' measurements behind one checkbox. The catalog already splits
   * kids from adults — age bands against letters — and this is the same
   * argument carried the rest of the way.
   */
  { id: "size", label: "Size", facetIds: ["size"], vertical: true },
  { id: "colour", label: "Colour", facetIds: ["colour"] },
  // Not vertical-specific despite being asked for with them — Cotton and Denim
  // mean the same on a shirt as on a tee, where a collar has no tee equivalent
  // at all. So it sits here always, rather than in the block and in More
  // Filters both.
  { id: "fabric", label: "Fabric", facetIds: ["fabric"] },

  { id: "price", label: "Price Range", facetIds: ["price"] },
  { id: "margin", label: "Margin", facetIds: ["margin"] },
  { id: "moq", label: "MOQ", facetIds: ["moq"] },
  { id: "delivery", label: "Delivery Time", facetIds: ["delivery"] },
  // `hasOffer` is reached from a chip, but it has to be listed here too, or a
  // chip-applied filter would survive Clear Filters and go uncounted by the
  // Filters badge with no control left to undo it once the chip strip changes.
  { id: "offers", label: "Offers", facetIds: ["hasOffer", "offers"] },
  { id: "seller", label: "Seller", facetIds: ["seller"] },
  { id: "sellerCity", label: "Seller City", facetIds: ["sellerCity"] },

  /*
   * The vertical-specific block, shown only inside exactly one vertical: across
   * verticals a Neck Type list offers *Spread Collar* beside *Round Neck*,
   * which answers nothing anyone is still asking.
   *
   * It trails the commercial rows rather than interleaving beside Fabric the
   * way the reference does — see the header. Five rows landing mid-rail pushed
   * Price Range six places down and out of sight.
   */
  { id: "fit", label: "Fit", facetIds: ["fit"], vertical: true },
  { id: "pattern", label: "Pattern", facetIds: ["pattern"], vertical: true },
  { id: "sleeve", label: "Sleeve Type", facetIds: ["sleeve"], vertical: true },
  { id: "neck", label: "Neck Type", facetIds: ["neck"], vertical: true },
  { id: "closure", label: "Closure Type", facetIds: ["closure"], vertical: true },

  { id: "more", label: "More Filters", facetIds: ["tags"] },
];

/**
 * The facets the vertical-specific rows own, for the orphan check below. Typed
 * as strings because every caller is testing an arbitrary selection key.
 */
export const PV_FACET_IDS: Set<string> = new Set(
  RAIL_ORDER.filter((r) => r.vertical).flatMap((r) => r.facetIds),
);

/** Whether the rail is showing its vertical-specific block. */
export const inSingleVertical = (category?: string[]) => category?.length === 1;

/**
 * The one product vertical in play, or `null` when none or several are.
 *
 * **A vertical can be settled without being ticked.** Ticking a Category tile
 * is the obvious way, but a Gender cut does it too: category → gender is 1:1, so
 * on a storefront carrying one women's vertical, *Gender → Women* leaves exactly
 * one PV standing. That matters because Size and the five attribute rows are
 * vertical-only, and the reason they are is about **scope, not about which
 * control narrowed it** — "M in menswear is not M in womenswear" stops being
 * true the moment only one vertical is in scope, however it got that way.
 * Testing the category *selection* alone left the rail with no Size row on a
 * page that had already narrowed to one vertical.
 *
 * **Only Category and Gender can settle it.** Those two are what decide who the
 * garment is for; everything else describes the garment. Letting any incidental
 * narrowing count — a colour that happens to exist in one vertical, a price band
 * only one line reaches — would make five rows appear and disappear as a buyer
 * ticks unrelated boxes, which is exactly what the 2026-08-19 reorder set out to
 * stop.
 */
export function settledVertical(
  products: { category: string; gender: string }[],
  /**
   * Any selections object. Typed as the general record rather than
   * `{ category, gender }` so callers can pass what they already hold — only
   * those two keys are ever read, for the reason above.
   */
  selections: Readonly<Record<string, string[] | undefined>>,
  mode: VerticalMode = FILTER_VERTICALS,
): string | null {
  // Under `locked` the vertical *is* the page and was never a selection.
  if (mode.kind === "locked") return mode.id;
  if (inSingleVertical(selections.category)) return selections.category![0];

  const genders = selections.gender;
  if (!genders?.length) return null;

  const cats = selections.category;
  const ids = new Set<string>();
  for (const p of products) {
    const id = CATEGORY_ID_BY_LABEL.get(p.category);
    if (!id) continue;
    // Respect a multi-category selection too: Girls' + Women's tees narrowed to
    // Women is still one vertical.
    if (cats?.length && !cats.includes(id)) continue;
    if (!genders.includes(p.gender)) continue;
    ids.add(id);
    if (ids.size > 1) return null;
  }
  return ids.size === 1 ? [...ids][0] : null;
}


/**
 * How a screen treats product verticals — the axis C and D added.
 *
 * - `filter` — A and B. A vertical is a facet like any other: Category is a
 *   rail row, the chips toggle it, and the attribute block appears once
 *   exactly one is picked.
 * - `locked` — C and D. The vertical *is* the page. No Category row, no Gender
 *   row, no vertical chips, and the attribute block permanently on.
 */
export type VerticalMode = { kind: "filter" } | { kind: "locked"; id: string };

export const FILTER_VERTICALS: VerticalMode = { kind: "filter" };

/**
 * The Filters rail — identical in both A and B since Category left A's bottom
 * bar on 2026-08-19, so what separates those two is only where Sort and
 * Filters sit.
 *
 * It takes the **category selection** because the vertical block appears once
 * exactly one vertical is settled, and `mode` because C and D fix the vertical
 * as page scope instead.
 */
/**
 * `/userjourney`'s rail, from the 2026-08-28 stakeholder whiteboard.
 *
 * **A second order, not a re-order of the first.** A–D keep `RAIL_ORDER`, which
 * follows a reference apparel PLP and is pinned by its own test; this is one
 * route's request and the two are allowed to disagree. The 2×2 is a comparison
 * of control *placement*, and the journey has never been part of it.
 *
 * The sequence asked for was Sort · Price · Margin · MOQ · Category · Brand ·
 * Seller · Seller Location · Attributes. Two readings of it:
 *
 * - **Sort isn't here.** It is the rail's first row on this route, but it is
 *   not a facet — `FilterScreen` prepends it, so this array stays a list of
 *   facets and nothing may look up a sort in `FACET_BY_ID`.
 * - **"Attributes" is eight rows, not one** (settled on the call): Colour,
 *   Fabric and Size join the five vertical-specific rows at the foot, because
 *   the note grouped them by position rather than asking for one panel. One
 *   merged row would have stacked ~60 options behind a single entry and earned
 *   a search field.
 *
 * **Six rows were dropped outright**: Gender, Delivery Time, Offers, More
 * Filters, Seller and Seller City. Three of those have consequences worth
 * keeping in view —
 *
 * - **Gender** was this journey's documented cut. *Category → Women's T-Shirts*
 *   replaces it and settles the vertical identically, Kartik carrying exactly
 *   three verticals of which one is women's. The demo script changed with it.
 * - **Offers** owned `hasOffer` and `offers`, which the three strip chips
 *   select. With no rail row they no longer count toward the Filters badge —
 *   correct, since a lit chip already reports itself and double-reporting is
 *   what that badge rule exists to prevent — but Clear Filters must still reach
 *   them, or `All filters cleared` closes onto two lit chips. `PlpScreen` passes
 *   them to `FilterScreen` as `clearsAlso` for exactly that reason.
 * - **Seller and Seller City** went on 2026-09-03, and they are the one pair
 *   the whiteboard *did* ask for. **You are already inside one seller** — this
 *   route is Kartik's storefront and nothing else is in scope — so both rows
 *   are dead controls by the same test that took Gender off C and D's rail: a
 *   filter that can only offer the single value every product in scope already
 *   has. Measured rather than reasoned, against `getKartikCatalog()`: Seller
 *   counts **no options at all** (Kartik is his own `Seller`, not one of
 *   `SELLERS`' eight, so every option in that panel is a zero and zeroes are
 *   hidden) and Seller City counts exactly **one**, Tiruppur 540, which is all
 *   of them. An empty panel and a one-option panel, where A–D show eight and
 *   six real choices — the rows only ever looked like controls here.
 *
 *   They take no `clearsAlso` entry, unlike Offers: nothing on this listing
 *   selects them, so there is no lit chip for `All filters cleared` to close
 *   onto. The one case left is a hand-written `?seller=grasim`, which no click
 *   can reach and which empties the listing — and the empty state's own Clear
 *   Filters commits `{}`, every selection rather than the rail's, so it clears
 *   that too and the URL goes bare. Verified, not assumed. That is what makes
 *   these safe to drop where a chip-backed facet would not be.
 *
 * Colour and Fabric stay visible whether or not a vertical is settled. Grouping
 * them under "attributes" is about where they sit, not when they show: Cotton
 * means the same on a shirt as on a tee, which is the standing argument for
 * Fabric never having joined the vertical block.
 */
const JOURNEY_RAIL_ORDER: typeof RAIL_ORDER = [
  { id: "price", label: "Price Range", facetIds: ["price"] },
  { id: "margin", label: "Margin", facetIds: ["margin"] },
  { id: "moq", label: "MOQ", facetIds: ["moq"] },
  { id: "category", label: "Category", facetIds: ["category"], only: "filter" },
  { id: "brand", label: "Brands", facetIds: ["brand"] },
  // Seller and Seller City sat here until 2026-09-03 — an empty panel and a
  // one-option panel on a single-seller storefront. See the header.
  // The attribute block. Colour and Fabric always; the rest only inside one
  // settled vertical, exactly as in the default rail.
  { id: "colour", label: "Colour", facetIds: ["colour"] },
  { id: "fabric", label: "Fabric", facetIds: ["fabric"] },
  { id: "size", label: "Size", facetIds: ["size"], vertical: true },
  { id: "fit", label: "Fit", facetIds: ["fit"], vertical: true },
  { id: "neck", label: "Neck Type", facetIds: ["neck"], vertical: true },
  { id: "sleeve", label: "Sleeve Type", facetIds: ["sleeve"], vertical: true },
  { id: "pattern", label: "Pattern", facetIds: ["pattern"], vertical: true },
  { id: "closure", label: "Closure Type", facetIds: ["closure"], vertical: true },
];

/**
 * Which rail a screen shows. `"default"` is A–D and every route that says
 * nothing; `"journey"` is the 2026-08-28 order above. A named preset rather
 * than an array prop because these pages are Server Components handing props to
 * a Client one, and a name keeps the arrays — and the tests that pin them —
 * in this file.
 */
export type RailPreset = "default" | "journey";

const RAILS: Record<RailPreset, typeof RAIL_ORDER> = {
  default: RAIL_ORDER,
  journey: JOURNEY_RAIL_ORDER,
};

export function getRail(
  category?: string[],
  mode: VerticalMode = FILTER_VERTICALS,
  settled: string | null = null,
  preset: RailPreset = "default",
): RailEntry[] {
  const locked = mode.kind === "locked";
  /*
   * **Two questions, not one.** Whether Gender is *redundant* is narrow: only a
   * ticked category (or a page that fixes the vertical) implies the gender, so
   * only then can the row go without stranding the selection. Whether the
   * vertical-specific rows *show* is about scope, and a Gender cut narrows scope
   * just as effectively.
   *
   * Sharing one flag meant a Gender cut that settled a vertical took the Gender
   * row off the rail while its selection survived — a live filter with no
   * control to show or undo it, which is the exact trap `dropOrphanedSelections`
   * exists to prevent. Caught by a test, not by reading.
   */
  const genderRedundant = locked || inSingleVertical(category);
  const showVertical = genderRedundant || settled !== null;

  return RAILS[preset].filter(
    (row) =>
      !(locked && row.only === "filter") &&
      !(row.vertical && !showVertical) &&
      !(row.notVertical && genderRedundant),
  ).map(({ id, label, facetIds }) => ({ id, label, facetIds }));
}

/**
 * Facets the Filters screen owns, for the given variant. Anything mutating the
 * draft — notably Clear Filters — must filter through this, so a facet the
 * screen doesn't display can never be cleared by it.
 */
export function getRailFacetIds(
  category?: string[],
  mode: VerticalMode = FILTER_VERTICALS,
  settled: string | null = null,
  preset: RailPreset = "default",
): Set<string> {
  return new Set(getRail(category, mode, settled, preset).flatMap((entry) => entry.facetIds));
}

/**
 * Drop selections whose rail row isn't showing.
 *
 * A filter still narrowing the list with nothing left to display or undo it is
 * the exact trap the `hasOffer` rail entry exists to avoid — it would survive
 * Clear Filters, go uncounted by the badge, and quietly hide products.
 *
 * **Two sets trade places across that line, so this guard runs both ways.**
 * Inside one vertical the attribute rows are on the rail and Gender is off it;
 * outside one it is the other way round. Whichever side is off screen is the
 * side that has been orphaned.
 *
 * Dropping Gender on the way in costs nothing, category → gender being 1:1: the
 * selection was implied by the vertical, so the result set is unchanged. The one
 * case where it *does* move is a contradiction — `?category=girls-t-shirts` with
 * `?gender=men` — which resolves an empty page rather than causing one.
 *
 * Applied wherever selections change rather than only in the Filters screen,
 * because a chip tap can cross the line too, and `parseSelections` can be handed
 * a URL that was never reachable by clicking at all.
 *
 * **The two questions are not the same question**, which one flag used to
 * assume. Whether the attribute rows are showing is about scope — a vertical
 * settled by a Gender cut shows them just as much as one settled by a Category
 * tick. Whether Gender is *orphaned* is narrower: only a category that was
 * actually ticked makes the Gender selection redundant, because only then was it
 * implied. Dropping Gender whenever scope narrowed would delete the very cut
 * that narrowed it — the filter would erase itself the instant it succeeded, and
 * widening scope back would re-show the row, hand the vertical back, and
 * oscillate.
 */
export function dropOrphanedSelections<T extends Record<string, string[]>>(
  selections: T,
  mode: VerticalMode = FILTER_VERTICALS,
  settled: string | null = null,
): T {
  // Under `locked` the vertical is the page, so the block is always on — and
  // `category` isn't in the selections to prove it.
  const byCategory =
    mode.kind === "locked" || inSingleVertical(selections.category);
  // Scope may be one vertical without a category selection saying so.
  const showVertical = byCategory || settled !== null;

  const orphaned = (id: string) => {
    if (byCategory) return id === "gender";
    return showVertical ? false : PV_FACET_IDS.has(id);
  };

  if (!Object.keys(selections).some(orphaned)) return selections;

  return Object.fromEntries(
    Object.entries(selections).filter(([id]) => !orphaned(id)),
  ) as T;
}
