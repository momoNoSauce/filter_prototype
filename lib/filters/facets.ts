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

export type PanelType = "tile" | "thumb" | "checkbox" | "swatch" | "range";

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
 * A typed range, as it appears in a selection and in the URL: `150-450`,
 * `150-` for a floor alone, `-450` for a ceiling alone.
 *
 * Plain digits and a hyphen rather than a prefixed id, so the URL reads
 * `?price=150-450`. It cannot collide with a band on any of the three facets
 * that take one: every bucket id starts with a letter and a hyphen (`p-200`,
 * `m-30`, `moq-4`), and this must start with a digit or the hyphen itself.
 *
 * **Named for the shape rather than for Price** since 2026-09-03, when Margin
 * and MOQ were asked for the same control. The three differ only in the number
 * they compare against, which is what `RANGE_FACETS` below carries.
 */
const TYPED_RANGE_RE = /^(\d*)-(\d*)$/;

export function parseTypedRange(id: string): { min: number; max: number } | null {
  /*
   * A one-character gate before the regex, and it is not a micro-optimisation
   * for its own sake. `matches` runs this **per product per selected value**,
   * and three facets have carried a `matches` since 2026-09-03 rather than one:
   * the 720-walk guard below (`never lets a visible option lead to an empty
   * page`) went from ~5s to over its 30s budget on the regex alone. Every band
   * id begins with a letter, so this returns on the first charCode for all of
   * them, and a range must begin with a digit or the hyphen itself.
   */
  const first = id.charCodeAt(0);
  if (first !== 45 /* - */ && !(first >= 48 && first <= 57)) return null;
  const hit = TYPED_RANGE_RE.exec(id);
  if (!hit) return null;
  const [, lo, hi] = hit;
  // `-` alone is not a range; at least one end has to be given.
  if (!lo && !hi) return null;
  return { min: lo ? Number(lo) : 0, max: hi ? Number(hi) : Infinity };
}

/** The selection id for a typed range, or `null` when neither end is set. */
export function typedRangeId(min: string, max: string): string | null {
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

/**
 * The three offer magnitudes (2026-09-03, on request), each ranged over the
 * unit the offer is quoted in: **Cashback in ₹, Seller Offer in %, SOLV Target
 * Scheme in ₹**.
 *
 * They exist on Kartik's catalog alone, so their rows are on `/userjourney`'s
 * rail and not A–D's — the main catalog carries the offer *names* without
 * magnitudes, and inventing figures there would put cashback ribbons on four
 * signed-off cards. See `JOURNEY_RAIL_ORDER`.
 *
 * A product without the offer has no value, so `valuesOf` returns nothing and
 * every band excludes it — which is what a buyer asking for "₹200 cashback or
 * more" means.
 */
const CASHBACK_BUCKETS = [
  { id: "cb-100", label: "Under ₹100", min: 0, max: 99 },
  { id: "cb-200", label: "₹100 – ₹200", min: 100, max: 200 },
  { id: "cb-400", label: "₹200 – ₹400", min: 201, max: 400 },
  { id: "cb-max", label: "₹400 & above", min: 401, max: Infinity },
];

const SELLER_OFFER_BUCKETS = [
  { id: "so-10", label: "Upto 10%", min: 0, max: 9 },
  { id: "so-15", label: "10% – 15%", min: 10, max: 15 },
  { id: "so-20", label: "15% – 20%", min: 16, max: 20 },
  { id: "so-max", label: "20% & above", min: 21, max: Infinity },
];

const TARGET_SCHEME_BUCKETS = [
  { id: "ts-500", label: "Under ₹500", min: 0, max: 499 },
  { id: "ts-1k", label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { id: "ts-2k", label: "₹1,000 – ₹2,000", min: 1001, max: 2000 },
  { id: "ts-max", label: "₹2,000 & above", min: 2001, max: Infinity },
];

const MARGIN_BUCKETS = [
  { id: "m-30", label: "Upto 30%", min: 0, max: 29 },
  { id: "m-45", label: "30% – 45%", min: 30, max: 44 },
  { id: "m-60", label: "45% – 60%", min: 45, max: 59 },
  { id: "m-max", label: "60% & above", min: 60, max: Infinity },
];

/**
 * **A percentage's first bucket reads `Upto X`, never `Under X`** (2026-09-08,
 * on request: *"it's never Under 10%, it's Upto 10%"* — and, on the correction
 * that followed, **percentages only**). So Seller Offer and Margin on MRP say
 * `Upto 10%` and `Upto 30%`, while the three money bands keep `Under ₹200`,
 * `Under ₹100`, `Under ₹500` and MOQ keeps `Up to 4 pc`.
 *
 * A rate and an amount are read differently: a discount is quoted as a ceiling
 * the seller might reach — *upto* 10% off — where a price is a threshold you
 * stay under. `Upto` closed up is the Indian retail idiom, and the standing
 * rule here is that the live app's vocabulary wins over a tidier one; the
 * product card sets `MRP/PC` beside `SET of:` for the same reason.
 *
 * **No band's arithmetic moved.** `Upto 10%` is still 0–9, so every documented
 * count is untouched — this is a copy change on two labels.
 */
function bucketId<T extends { id: string; min: number; max: number }>(
  buckets: T[],
  value: number,
): string[] {
  const hit = buckets.find((b) => value >= b.min && value <= b.max);
  return hit ? [hit.id] : [];
}

/**
 * Every facet whose options are **bands over a number** — Price, Margin on MRP
 * and MOQ, plus the three offer magnitudes. The first three also carry a
 * **typed min/max above those bands** on `/userjourney` (Price from
 * 2026-08-28, the other two from 2026-09-03, `controls.rangeInputs`); A–D show
 * the bands alone.
 *
 * **All six take the boxes again** since 2026-09-07: the three offer
 * magnitudes lost them that morning, when their rows merged into one *All
 * Offers* panel with nowhere to put three pairs, and got them back the same
 * evening once the rows split apart again — *"bring back the input range and
 * similar behaviour for the three offers"*. Similar means identical: one
 * table, one control, one exclusivity rule, one refusal toast.
 *
 * One table rather than six near-identical literals, the way
 * `PV_ATTRIBUTE_FACETS` is built: they differ only in the number they compare
 * against, and six copies of `accepts`/`matches` is six chances for one to
 * drift. The reasoning is the same for all of them —
 *
 * **Bands and typed ranges live on one facet.** Both answer "which prices" (or
 * margins, or order quantities), so one facet holds them: two would AND
 * against each other, and a buyer who typed 150–450 would have to clear a band
 * to see anything. Inside the facet they OR like any two values, which is why
 * the panel keeps the two controls mutually exclusive rather than letting a
 * band widen a typed range — see `FilterScreen`.
 *
 * **`matches` needs `accepts`.** The default match is set membership over
 * `valuesOf`, and a typed range is in no option list; `accepts` is what lets
 * `parseSelections` keep `?price=150-450` through a reload while still dropping
 * `?price=junk`. A facet given one and not the other works in-session and
 * empties on refresh, which is exactly how this was found in August.
 *
 * **`min > max` is refused by the control, not here.** `RangeInputs` withholds
 * an inverted pair from the draft and says so on blur, so nothing in the engine
 * has to swap or suppress the ends. A hand-written `?margin=60-30` still
 * reaches this and still matches nothing, which is honest rather than silently
 * filtering on a range nobody typed.
 *
 * `valueOf` takes `sizes` because Price and Margin read the pack the card is
 * showing and a Size filter moves it — the one selection any facet may see.
 * MOQ and the three offer figures ignore it, all four being properties of the
 * product rather than of the pack.
 */
const RANGE_FACETS: {
  id: string;
  label: string;
  buckets: { id: string; label: string; min: number; max: number }[];
  valueOf: (p: Product, sizes?: string[]) => number;
  /**
   * `false` where the facet shows its bands **without** the typed boxes.
   *
   * **Nothing sets it today**, and it is kept because this flipped twice on
   * 2026-09-07: the three offer magnitudes lost their boxes when their rows
   * merged into one panel — which had nowhere to put three pairs — and took
   * them back when the rows split apart again hours later. A route or a facet
   * that wants bands alone is one word, and the machinery below is what makes
   * it one word.
   *
   * It also drops `accepts` and `matches`, which exist only to serve a typed
   * range: with no control able to produce `?cashback=100-200`, honouring one
   * from a hand-written URL would be a filter nothing on the screen can show or
   * undo. The bands still work through the default set-membership match, which
   * is what a band is.
   */
  typed?: false;
}[] = [
  {
    id: "price",
    label: "Price Range",
    buckets: PRICE_BUCKETS,
    valueOf: (p, sizes) => activeVariant(p, sizes).pricePerPc,
  },
  {
    /*
     * **"Margin on MRP", not "Margin"** (2026-09-03, on request). The number is
     * `(mrp − pricePerPc) / mrp`, which the seed builds from the other end —
     * `mrp = pricePerPc / (1 − marginPct / 100)` — so the label now names the
     * base it is a percentage *of*. A retailer reading a bare "45%" beside a
     * price has two candidate denominators and no way to tell which.
     */
    id: "margin",
    label: "Margin on MRP",
    buckets: MARGIN_BUCKETS,
    valueOf: (p, sizes) => activeVariant(p, sizes).marginPct,
  },
  { id: "moq", label: "MOQ", buckets: MOQ_BUCKETS, valueOf: (p) => p.moq },
  /*
   * The three offer magnitudes. `valueOf` returns **-1** where the offer is
   * absent, rather than 0: a zero would land in the first band and offer
   * *Under ₹100 cashback* on a product carrying no cashback at all, which is
   * the same lie as a count that promises a result the tap can't deliver. -1
   * falls outside every bucket and below every typed floor, so those products
   * simply don't appear — and `matches` is written off the same figure, so the
   * bands and the boxes agree.
   */
  {
    id: "cashback",
    label: "Cashback",
    buckets: CASHBACK_BUCKETS,
    valueOf: (p) => p.cashback ?? -1,
  },
  {
    id: "sellerOffer",
    label: "Seller Offer",
    buckets: SELLER_OFFER_BUCKETS,
    valueOf: (p) => p.sellerOfferPct ?? -1,
  },
  {
    id: "targetScheme",
    label: "SOLV Target Scheme",
    buckets: TARGET_SCHEME_BUCKETS,
    valueOf: (p) => p.targetScheme ?? -1,
  },
];

/**
 * Which facets take a typed range — the panel and the exclusivity rule ask.
 *
 * All of `RANGE_FACETS` again since 2026-09-07 — the three offer magnitudes
 * were bands only for the hours their rows were merged. It is still computed
 * from the flag rather than hard-coded, so the subset case stays one word away.
 */
export const TYPED_RANGE_FACET_IDS: Set<string> = new Set(
  RANGE_FACETS.filter((r) => r.typed !== false).map((r) => r.id),
);

/** One range facet, by id, for placing in `FACETS` without moving its order. */
function rangeFacet(id: string): FacetDef {
  const { label, buckets, valueOf, typed } = RANGE_FACETS.find((r) => r.id === id)!;
  const bands: FacetDef = {
    id,
    label,
    // Bands over a number, whether or not the panel puts boxes above them —
    // which is what lets `needsSearch` tell a numeric vocabulary from a list of
    // names. See `panelFit`.
    panel: "range",
    valuesOf: (p, sizes) => bucketId(buckets, valueOf(p, sizes)),
    options: buckets.map((b) => ({ id: b.id, label: b.label })),
  };
  // No boxes, no hooks: the default match is set membership over `valuesOf`,
  // which is exactly a band, and `accepts` would be honouring a range nothing
  // can type.
  if (typed === false) return bands;
  return {
    ...bands,
    accepts: (optionId) => parseTypedRange(optionId) !== null,
    matches: (p, chosen, sizes) => {
      const value = valueOf(p, sizes);
      return chosen.some((optionId) => {
        const range = parseTypedRange(optionId);
        return range
          ? value >= range.min && value <= range.max
          : bucketId(buckets, value).includes(optionId);
      });
    },
  };
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
    // A row per option with its photograph, since 2026-09-03 — `"tile"` was
    // the Figma grid, and no facet claims it now. See `ThumbRow`.
    panel: "thumb",
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
  // The three range facets — bands plus a typed min/max — are built from
  // `TYPED_RANGES` and placed by hand, so `FACETS`' order, which is the query
  // string's order, does not move.
  rangeFacet("moq"),
  {
    id: "brand",
    label: "Brands",
    // Same rows as Category — with a grey box rather than a logo, no brand
    // assets having been sourced. See `ThumbRow`.
    panel: "thumb",
    valuesOf: (p) => [slug(p.brand)],
    options: [...BRANDS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b) => ({ id: slug(b.name), label: b.name })),
  },
  rangeFacet("price"),
  rangeFacet("margin"),
  // The offer magnitudes, beside the two facets whose chips they qualify.
  rangeFacet("cashback"),
  rangeFacet("sellerOffer"),
  rangeFacet("targetScheme"),
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
  /**
   * Hidden when the page's *scope* holds at most one of this row's values —
   * `/userjourney`'s Brands, Seller and Seller City since 2026-09-07.
   *
   * The question is where the buyer **landed**, not what they have ticked, so
   * it is answered from the page's products by `singleValuedFacets` and never
   * from the selections: a row that appeared and vanished as boxes were ticked
   * is the churn the 2026-08-19 reorder exists to prevent.
   *
   * Not set on `RAIL_ORDER`'s own rows, deliberately. A–D span ten brands,
   * eight sellers and six cities, so the flag would never fire there — and
   * `/seller/[sellerId]` is documented as a storefront *aggregating* sellers,
   * which is a reading this would quietly overturn. Setting it there is a
   * one-word change if that reading ever flips.
   */
  hideIfSingle?: true;
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
  { id: "margin", label: "Margin on MRP", facetIds: ["margin"] },
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
const pvFacetIds = (rail: typeof RAIL_ORDER) =>
  new Set(rail.filter((r) => r.vertical).flatMap((r) => r.facetIds));

/**
 * A–D's vertical-only facets. `dropOrphanedSelections` reads the per-preset
 * table instead (`PV_FACET_IDS_BY_PRESET`), the two rails having disagreed
 * about Size since 2026-09-07 — this stays exported as the default rail's
 * answer, which is what every caller reasoning about A–D wants.
 */
export const PV_FACET_IDS: Set<string> = pvFacetIds(RAIL_ORDER);

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
 * `/userjourney`'s rail — the 2026-08-28 stakeholder whiteboard, re-ordered on
 * **2026-09-07** on request:
 *
 *     Price Range · Margin on MRP · MOQ · Category · Brands · Seller ·
 *     Seller City · Size · Colour · Offers, then Fabric and the garment
 *     attributes.
 *
 * **A second order, not a re-order of the first.** A–D keep `RAIL_ORDER`, which
 * follows a reference apparel PLP and is pinned by its own test; this is one
 * route's request and the two are allowed to disagree. The 2×2 is a comparison
 * of control *placement*, and the journey has never been part of it. Confirmed
 * on the request: this route only.
 *
 * Four things in it are not just a sequence —
 *
 * **The three offer magnitudes are a row each, at the foot** (2026-09-07,
 * second pass). They were merged behind one *All Offers* row for a few hours
 * that morning — one rail row can carry several facets, and the panel heads
 * each with its facet label, which was the sketch that came with the first
 * request — and the ask reversed: three types of offer, three rows, last of all
 * the filters. **They carry the typed min/max again** — dropped that morning
 * with the merge, which had nowhere to put three pairs of boxes, and asked back
 * hours after the split: the same control Price, Margin and MOQ carry, from the
 * same table, with the same exclusivity and the same refusal toast. What did
 * *not* come back is the panel heading: the rail row names each panel in
 * primary two columns to the left, so the offer's name and chip art inside it
 * were repeating it.
 *
 * **The chips stay binary and this row does not replace them.** The chip asks
 * *is there one*, the row asks *how big*, on different facets — the chips
 * select `offers`/`hasOffer`, which hold names, and this holds numbers — so the
 * two AND. `hasOffer` and `offers` are still off this rail and still reached
 * through `clearsAlso`, or `All filters cleared` would close onto a lit chip.
 *
 * **Three rows hide when the buyer *landed* inside one value** (`hideIfSingle`,
 * 2026-09-07, and the reason Seller and Seller City are back in the list at
 * all). Brands, Seller and Seller City are dead controls on a storefront that
 * carries one brand in one city — which Kartik's is, all 540 products being
 * `Zenifit` out of Tiruppur — and live the moment a listing spans more than
 * one. Measured off scope rather than off the selections, so a row can't come
 * and go as boxes are ticked; see `singleValuedFacets`. This is what closes the
 * empty Brands panel logged as open question 4a, and it restores the two rows
 * dropped by hand on 2026-09-03 as a rule instead of a deletion.
 *
 * **Size and Colour are off this rail** (2026-09-08, on request). Size was
 * briefly the interesting one: A–D show it only inside a settled vertical, on
 * the argument that M in menswear is not M in womenswear, and on 2026-09-07
 * this route asked for it always — which is why `dropOrphanedSelections` reads
 * *this* rail's vertical-only set (`PV_FACET_IDS_BY_PRESET`) rather than one
 * shared set. That split still earns its place: A–D drop a Size cut when the
 * vertical goes, and this rail has no Size row to drop one for.
 *
 * **Gender, Delivery Time, More Filters and — since the second 2026-09-07 pass
 * — Fabric stay dropped.** Gender was this journey's documented cut until
 * 2026-08-28; *Category → Women's T-Shirts*
 * replaces it and settles the vertical identically, Kartik carrying exactly
 * three verticals of which one is women's.
 *
 * Only the five garment attributes wait for a settled vertical. Colour and
 * Fabric used to sit above them and show either way — Cotton means the same on
 * a shirt as on a tee — and neither is on this rail any more.
 */
const JOURNEY_RAIL_ORDER: typeof RAIL_ORDER = [
  { id: "price", label: "Price Range", facetIds: ["price"] },
  { id: "margin", label: "Margin on MRP", facetIds: ["margin"] },
  { id: "moq", label: "MOQ", facetIds: ["moq"] },
  { id: "category", label: "Category", facetIds: ["category"], only: "filter" },
  { id: "brand", label: "Brands", facetIds: ["brand"], hideIfSingle: true },
  { id: "seller", label: "Seller", facetIds: ["seller"], hideIfSingle: true },
  {
    id: "sellerCity",
    label: "Seller City",
    facetIds: ["sellerCity"],
    hideIfSingle: true,
  },
  /*
   * Size and Colour had rows here until 2026-09-08, when both were dropped on
   * request — Size global (it was vertical-only on A–D's rail and this route
   * had asked for it always), Colour beside it. Both keep their `FACETS` entry
   * for A–D; the only way to reach either here is a hand-written `?size=m`,
   * which no click can produce and which the empty state's own Clear Filters
   * resolves — the same accepted case as `?fabric=cotton`.
   */
  // Fabric had a row here until 2026-09-07 (second pass), when it was dropped
  // on request. It stays in `FACETS` for A–D, which still carry the row; the
  // only way to reach it here is a hand-written `?fabric=cotton`, the same
  // accepted case as `?seller=grasim` — no click can produce it, and the empty
  // state's own Clear Filters commits every selection rather than the rail's.
  { id: "fit", label: "Fit", facetIds: ["fit"], vertical: true },
  { id: "neck", label: "Neck Type", facetIds: ["neck"], vertical: true },
  { id: "sleeve", label: "Sleeve Type", facetIds: ["sleeve"], vertical: true },
  { id: "pattern", label: "Pattern", facetIds: ["pattern"], vertical: true },
  { id: "closure", label: "Closure Type", facetIds: ["closure"], vertical: true },
  /*
   * **A row each, at the foot of the rail** (2026-09-07, second pass, on
   * request: *"split All Offers, go back to three types of offers, at the last
   * of all filters"*). They spent the morning merged behind one *All Offers*
   * row; the three-row shape is what 2026-09-03 built and what this returns to,
   * moved from beside the commercial numbers to the end.
   *
   * **Last in the array is last in both states.** The five garment attributes
   * are `vertical: true` and sit above them, so outside a vertical these three
   * follow Colour and inside one they follow Closure Type — the foot either
   * way, which is what the request asks for and what an index-based insert
   * would have got wrong.
   *
   * **The typed min/max is back on all three** (2026-09-07, on request, hours
   * after the split): boxes above the bands, exclusive with them, each
   * disabling the other, an inverted pair refused on blur with a toast naming
   * the facet — the same control Price, Margin and MOQ carry, from the same
   * table. They had come off that morning with the merge, one panel having
   * nowhere to put three pairs of boxes.
   *
   * **The chips stay binary and these rows do not replace them** — the chip
   * asks *is there one*, the row asks *how big*, on different facets, so the
   * two AND. `hasOffer` and `offers` are still off this rail and still reached
   * by `clearsAlso`.
   */
  { id: "cashback", label: "Cashback", facetIds: ["cashback"] },
  { id: "sellerOffer", label: "Seller Offer", facetIds: ["sellerOffer"] },
  { id: "targetScheme", label: "SOLV Target Scheme", facetIds: ["targetScheme"] },
];

/**
 * Which rail a screen shows. `"default"` is A–D and every route that says
 * nothing; `"journey"` is the 2026-08-28 order above. A named preset rather
 * than an array prop because these pages are Server Components handing props to
 * a Client one, and a name keeps the arrays — and the tests that pin them —
 * in this file.
 *
 * **`"journey-flat"` is that same rail with the vertical block switched off**
 * (2026-09-09, on request: *this is what we are launching now*). Same array,
 * same order, same `hideIfSingle` rows — it differs in one thing, that settling
 * a vertical no longer grows the rail. See `FLAT_RAILS`.
 */
export type RailPreset = "default" | "journey" | "journey-flat";

const RAILS: Record<RailPreset, typeof RAIL_ORDER> = {
  default: RAIL_ORDER,
  journey: JOURNEY_RAIL_ORDER,
  // The same array. `FLAT_RAILS` is what makes the two differ, so the order,
  // the labels and every row's flags are stated once — a row added to the
  // journey rail is on both rails, which is the point of not copying it.
  "journey-flat": JOURNEY_RAIL_ORDER,
};

/**
 * Rails on which the **vertical block never appears**: settling a product
 * vertical adds no rows, and a selection on one of those facets is orphaned in
 * every state rather than only outside a vertical.
 *
 * `/userjourney` since 2026-09-09, on request — *"remove the behaviour of
 * showing more filters when a pv is selected, this is what we are launching
 * now"*. The rail is a flat 7 rows on Kartik's scope, whatever the buyer ticks,
 * and the bottom sheet a flat 530 with it (`sheetHeightPct` reads the rail, so
 * that follows for free).
 *
 * **A property of the rail, not a `controls` flag.** Two things have to agree
 * about it — `getRail`, which decides whether the rows show, and
 * `dropOrphanedSelections`, which decides whether a selection on them survives
 * — and they are reached by different callers with different props. Hanging it
 * off the preset that both already carry is what keeps them from disagreeing;
 * that disagreement is exactly the orphan trap, and it has been introduced here
 * twice before.
 *
 * **`/pvfilters` deliberately keeps `"journey"`.** The two listings were
 * un-shared the same morning precisely so this deletion could land on one of
 * them; product-vertical filtering carries on there.
 */
const FLAT_RAILS: ReadonlySet<RailPreset> = new Set<RailPreset>(["journey-flat"]);

/**
 * Each rail's vertical-only facets, which stopped being one set on 2026-09-07:
 * Size is vertical-only in A–D and global on the journey. Declared here rather
 * than beside `PV_FACET_IDS` because both arrays have to exist first.
 */
const PV_FACET_IDS_BY_PRESET: Record<RailPreset, Set<string>> = {
  default: PV_FACET_IDS,
  journey: pvFacetIds(JOURNEY_RAIL_ORDER),
  // The same five garment attributes — but on a flat rail they are orphaned in
  // *every* state, not just outside a vertical, because no state puts a row
  // back. `dropOrphanedSelections` is where that difference is applied.
  "journey-flat": pvFacetIds(JOURNEY_RAIL_ORDER),
};

/**
 * The facets a listing can be *scoped* to, and so the only ones a rail row may
 * hide itself over — see `hideIfSingle`.
 *
 * Three, not every facet. A single-brand storefront has no use for a Brands
 * row; a listing that happens to carry one colour is a filter doing its job,
 * and taking Colour away would be removing the control that got it there.
 */
const SCOPE_FACET_IDS = ["brand", "seller", "sellerCity"] as const;

/**
 * Which of those the given scope has **at most one value of** — the input to
 * `getRail`'s `hideIfSingle`.
 *
 * Asked of the page's products, once, rather than of the buyer's selections:
 * the rule is about where they landed. Pure and exported so `PlpScreen`'s badge
 * and the Filters screen's rail read the same answer.
 *
 * **Zero counts as one.** On Kartik's storefront the Seller panel draws no
 * options at all — he is his own seller and not one of `SELLERS`' eight, so
 * every option in it is a hidden zero — and an empty panel is as dead a control
 * as a one-option one. Measured on 2026-09-03, which is what took both rows off
 * that rail by hand before this rule replaced the deletion.
 */
export function singleValuedFacets(products: Product[]): Set<string> {
  const dead = new Set<string>();
  for (const id of SCOPE_FACET_IDS) {
    const facet = FACET_BY_ID.get(id)!;
    const seen = new Set<string>();
    for (const product of products) {
      for (const value of facet.valuesOf(product)) seen.add(value);
      if (seen.size > 1) break;
    }
    if (seen.size <= 1) dead.add(id);
  }
  return dead;
}

/** Nothing is scoped down — the default for every caller that can't say. */
const NO_SINGLES: ReadonlySet<string> = new Set();

export function getRail(
  category?: string[],
  mode: VerticalMode = FILTER_VERTICALS,
  settled: string | null = null,
  preset: RailPreset = "default",
  /**
   * Facets the page's scope has at most one value of, from
   * `singleValuedFacets` — what `hideIfSingle` rows are tested against.
   * Defaults to nothing scoped out, so every existing caller is unchanged.
   */
  scopeSingles: ReadonlySet<string> = NO_SINGLES,
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
  /*
   * **A flat rail answers no** whatever the scope — see `FLAT_RAILS`. It is
   * checked here rather than by stripping the rows out of a third array, so the
   * journey and `/pvfilters` still read one `JOURNEY_RAIL_ORDER` and a row
   * added to it lands on both.
   */
  const showVertical =
    !FLAT_RAILS.has(preset) && (genderRedundant || settled !== null);

  return RAILS[preset]
    .filter(
      (row) =>
        !(locked && row.only === "filter") &&
        !(row.vertical && !showVertical) &&
        !(row.notVertical && genderRedundant) &&
        // `every`, not `some`: a row carrying several facets is only dead when
        // scope has silenced all of them.
        !(row.hideIfSingle && row.facetIds.every((id) => scopeSingles.has(id))),
    )
    .map(({ id, label, facetIds }) => ({ id, label, facetIds }));
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
  scopeSingles: ReadonlySet<string> = NO_SINGLES,
): Set<string> {
  return new Set(
    getRail(category, mode, settled, preset, scopeSingles).flatMap((entry) => entry.facetIds),
  );
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
  /**
   * Which rail's vertical-only set to measure against, since the two disagree
   * about Size (2026-09-07): vertical-only in A–D, global on `/userjourney`.
   * Reading the default set on the journey would delete a live Size cut the
   * moment the buyer unticked their category — while its row stayed on the
   * rail, which is the orphan trap pointing the wrong way.
   */
  preset: RailPreset = "default",
): T {
  // Under `locked` the vertical is the page, so the block is always on — and
  // `category` isn't in the selections to prove it.
  const byCategory =
    mode.kind === "locked" || inSingleVertical(selections.category);
  // Scope may be one vertical without a category selection saying so — unless
  // the rail never shows the block at all, which is the whole of `FLAT_RAILS`.
  const showVertical =
    !FLAT_RAILS.has(preset) && (byCategory || settled !== null);

  /**
   * **Two independent orphans, not a branch between them**, since 2026-09-09.
   *
   * It used to read `if (byCategory) return id === "gender"`, which was right
   * only because a settled category always turned the attribute rows *on*: the
   * early return could skip the attribute test because that test was always
   * false there. On a flat rail it isn't — ticking a category shows no rows —
   * so the early return would have kept `?fit=slim` alive with nothing to
   * display or undo it. That is the trap this function exists for, arriving
   * through the door the function itself left open.
   *
   * As two clauses the behaviour on every existing rail is unchanged: where
   * `byCategory` holds, `showVertical` holds with it, so the first clause is
   * false and only Gender is dropped, exactly as before.
   */
  const orphaned = (id: string) =>
    (!showVertical && PV_FACET_IDS_BY_PRESET[preset].has(id)) ||
    (byCategory && id === "gender");

  if (!Object.keys(selections).some(orphaned)) return selections;

  return Object.fromEntries(
    Object.entries(selections).filter(([id]) => !orphaned(id)),
  ) as T;
}
