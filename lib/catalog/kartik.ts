import {
  ADULT_RUNS,
  ADULT_SIZES,
  CATEGORIES,
  COLOURS,
  DELIVERY_DAYS,
  FABRICS,
  KIDS_RUNS,
  KIDS_SIZES,
  MOQS,
  OFFERS,
  PACK_TYPES,
  TEE_ATTRIBUTES,
  buildVariants,
  mulberry32,
  weightedPick,
} from "./seed";
import type { Product, Seller } from "./types";

/**
 * Kartik Exporters — the storefront the user journey walks through.
 *
 * **A separate catalog, on its own PRNG streams.** Kartik's products are not
 * part of the 1,070: they generate independently and are only ever in scope on
 * his storefront. That is deliberate and is the whole reason this file exists
 * rather than a few more entries in `seed.ts` — determinism is load-bearing
 * there, and adding products to the main sequence would have moved every count
 * documented in `plan.md` and `progress_tracker.md` (the 1,070 total, Girls 97,
 * Men 575, `₹900 & above` 37, all seven category counts and all thirteen size
 * counts). Nothing in A, B, C or D can see this set, and nothing here can shift
 * a number over there.
 *
 * Built from the same primitives as the main catalog — same colours, fabrics,
 * tee attribute vocabulary, size runs and pack builder — so a Kartik product is
 * an ordinary `Product` and the filter engine needs no special case at all.
 */
export const KARTIK: Seller = {
  id: "kartik",
  name: "Kartik Exporters",
  // Not in the screengrabs, which only ever show the name. Imphal is the
  // buyer's city in the journey, so the seller sits elsewhere — otherwise
  // "not available in our catchment area" makes no sense.
  city: "Tiruppur",
};

/**
 * The single brand on the storefront, from the co-branded home banner
 * ("Zenifit — Kartik exporters").
 *
 * Every product in the screengrabs is a Zenifit, so the Brands panel here shows
 * exactly one tile. That makes Brands a dead control on this route — the same
 * thing `discriminatingOptions` hides for an offer every product carries — and
 * it is left visible on purpose: it is true to the storefront, and a buyer
 * seeing one tile learns something a hidden row wouldn't tell them.
 */
export const ZENIFIT = "Zenifit";

/**
 * Kartik's three product verticals. **Tees only** — no formal shirts, no casual
 * shirts, and notably no Girl's T-Shirts.
 *
 * That last omission is what makes the journey's central cut work: there is
 * exactly one women's vertical in scope, so `Gender → Women` settles a single
 * PV on its own, which is what unlocks the Size row. Add a second women's
 * category here and the S/M/L step stops being reachable.
 */
export const KARTIK_CATEGORY_IDS = [
  "mens-casual-t-shirts",
  "womens-t-shirts",
  "boys-casual-t-shirts",
] as const;

const KARTIK_CATEGORIES = CATEGORIES.filter((c) =>
  (KARTIK_CATEGORY_IDS as readonly string[]).includes(c.id),
);

/** Kartik's catalog size, echoing the three verticals' share of the main one. */
const KARTIK_SIZE = 540;

/**
 * Cashback is shown as a rupee amount on this card — an orange ribbon across
 * the top-left corner and a pill under the price — where the main catalog only
 * ever carries the offer's name. The two values are the ones in the
 * screengrabs.
 */
/**
 * The rupee value on a Cashback offer.
 *
 * **Widened on 2026-09-03**, from a flat 100/200, so the new Cashback *range*
 * has something to range over — two values make four bands where three are
 * always empty. 100 and 200 keep the weight, the screengrab this route is built
 * from showing `₹100 Cashback`; the rest are the tail.
 *
 * Free to widen, for the reason `COLOURS` was free to go from ten to twenty:
 * `weightedPick` draws **once** however long the table is, so no draw moves and
 * no count that isn't about cashback amounts changes.
 */
const CASHBACK_AMOUNTS = [
  { amount: 50, weight: 12 },
  { amount: 100, weight: 40 },
  { amount: 150, weight: 14 },
  { amount: 200, weight: 22 },
  { amount: 300, weight: 8 },
  { amount: 500, weight: 4 },
];

/**
 * The seller's own discount off the invoice, in **percent** — the magnitude
 * behind the *Seller Offer* chip (2026-09-03, on request).
 *
 * **Not margin, and the distinction is load-bearing.** Margin on MRP is
 * `(mrp − pricePerPc) / mrp`, the retailer's markup, and it is already a facet.
 * This is what the *seller* knocks off what the retailer pays, which is an
 * independent number: a 10% seller offer on a 45%-margin tee is an ordinary
 * thing to see. Ranging one on the other would give two rail rows filtering the
 * same figure under two names, which is the dead-control trap wearing a
 * different hat — don't "simplify" them together.
 *
 * It exists wherever `hasOffer` does, that chip being the catch-all for "the
 * seller is running something on this".
 */
const SELLER_OFFER_PCT = [
  { pct: 5, weight: 26 },
  { pct: 8, weight: 22 },
  { pct: 10, weight: 20 },
  { pct: 12, weight: 14 },
  { pct: 15, weight: 10 },
  { pct: 20, weight: 6 },
  { pct: 25, weight: 2 },
];

/**
 * The **rupee payout** on a SOLV Target Scheme (2026-09-03, on request).
 *
 * Two readings of "target scheme in ₹" and this takes the one a buyer filters
 * on: what the scheme *pays* if you hit it, not the spend it asks for. A
 * retailer sorting stock by scheme value wants "worth ₹1,000 to me", and the
 * qualifying spend is a property of the scheme rather than of the product.
 * Flagged for the stakeholder round — if it is meant to be the target instead,
 * only this table and its label move.
 */
const TARGET_SCHEME_AMOUNTS = [
  { amount: 200, weight: 24 },
  { amount: 500, weight: 30 },
  { amount: 1000, weight: 24 },
  { amount: 2000, weight: 14 },
  { amount: 5000, weight: 8 },
];

/**
 * Product titles follow the screengrabs, which are a different shape from the
 * main catalog's `"{brand} {code} {fabric} {plural} for {Gender}, {colour}"`.
 * Observed:
 *
 *     Zenifit Women's Cotton Round Neck Regular Half sleeves Printed T-Shirt, Cloud Burst
 *     Zenifit Unisex Cotton Round Neck Half Sleeves Printed T-Shirt, Dark Grey
 *
 * **Two quirks, reproduced rather than tidied**, per the instruction to follow
 * them: the adult line carries its fit (`Regular`) and lowercases the `s` in
 * `Half sleeves`, while the kids' line drops the fit entirely and title-cases
 * `Half Sleeves`. Both are inferred from one sample each, so they are a rule
 * this file invented from n=2 — worth confirming against more of the real app.
 *
 * Kids' garments read **Unisex** rather than `Boy's`, which is the screengrab's
 * own word for a boys' tee.
 */
function kartikTitle(
  gender: string,
  fabric: string,
  neck: string,
  fit: string,
  sleeve: string,
  pattern: string,
  colour: string,
) {
  const kids = gender === "boys" || gender === "girls";
  // "Half Sleeve" → "Half Sleeves"; "Sleeveless" has no plural to add.
  const plural = sleeve.endsWith("Sleeve") ? `${sleeve}s` : sleeve;
  const audience = kids
    ? "Unisex"
    : gender === "women"
      ? "Women's"
      : "Men's";

  const parts = [ZENIFIT, audience, fabric, neck];
  // The kids' line omits the fit; the adult line strips the redundant " Fit".
  if (!kids) parts.push(fit.replace(/ Fit$/, ""));
  parts.push(kids ? plural : plural.replace("Sleeves", "sleeves"));
  parts.push(pattern, "T-Shirt");

  return `${parts.join(" ")}, ${colour}`;
}

/**
 * The tee renders cropped from the journey screengrabs — real assets from the
 * shipping app, not stock photography, which the card has always refused.
 *
 * There is **no men's tee render**, the screengrabs never showing one, so men's
 * products fall back to the Figma shirt render. That is the same mismatch
 * already logged against the main catalog ("a card titled … Casual T-Shirts
 * shows a button-up") and it wants the same fix: a designer exporting tee
 * renders. It does not touch the journey itself, which ends in womenswear.
 */
const TEE_RENDERS: Record<string, string[]> = {
  women: [
    "/journey/products/tee-navy.png",
    "/journey/products/tee-teal.png",
    "/journey/products/tee-bottle-green.png",
  ],
  boys: ["/journey/products/tee-grey.png"],
};

const SHIRT_FALLBACK = {
  dark: "/figma/products/shirt-black.png",
  light: "/figma/products/shirt-grey.png",
};

function kartikImage(gender: string, dark: boolean, pickIndex: number) {
  const renders = TEE_RENDERS[gender];
  if (renders) return renders[pickIndex % renders.length];
  return dark ? SHIRT_FALLBACK.dark : SHIRT_FALLBACK.light;
}

/**
 * Kartik's catalog, generated deterministically like the main one and from its
 * own seeds so the two can never interfere.
 *
 * The stream layout mirrors `generateCatalog` for the same reason it exists
 * there: sizes and vertical-specific attributes take their own streams, so
 * adding or removing one of those draws can't shift the others.
 */
export function generateKartikCatalog(): Product[] {
  const rand = mulberry32(0x6b_a7_74_1c);
  const sizeRand = mulberry32(0x6b_a7_51_2e);
  const attrRand = mulberry32(0x6b_a7_5a_77);
  /*
   * **A fourth stream, for the offer magnitudes** (2026-09-03). The Seller
   * Offer percentage and the Target Scheme payout are new per-product
   * properties, and the standing rule is that each gets its own stream: two
   * more draws on `rand` would re-roll every product after them and move all
   * 540 documented counts — the women's 191 the demo script walks through
   * included.
   *
   * Cashback stays on `rand`, where it already was: its draw is not new, only
   * the table it picks from is longer, and `weightedPick` draws once whatever
   * the length.
   */
  const offerRand = mulberry32(0x6b_a7_0f_e3);
  const products: Product[] = [];

  for (let i = 0; i < KARTIK_SIZE; i += 1) {
    const category = weightedPick(rand, KARTIK_CATEGORIES, (c) => c.weight);
    const gender = category.gender;

    const colour = weightedPick(rand, COLOURS, (c) => c.weight);
    const fabric = weightedPick(rand, FABRICS, (f) => f.weight);
    const packType = weightedPick(rand, PACK_TYPES, (p) => p.weight);
    const delivery = weightedPick(rand, DELIVERY_DAYS, (d) => d.weight);
    const moq = weightedPick(rand, MOQS, (m) => m.weight);

    const { priceFloor, priceCeil } = category;
    const basePrice = Math.round((priceFloor + rand() * (priceCeil - priceFloor)) / 5) * 5;
    const baseMargin = 18 + Math.floor(rand() * 48);

    const kids = gender === "boys" || gender === "girls";
    const vocabulary = kids ? KIDS_SIZES : ADULT_SIZES;
    const run = weightedPick(sizeRand, kids ? KIDS_RUNS : ADULT_RUNS, (r) => r.weight);
    const sizeRun = vocabulary.slice(run.start, run.start + run.len);

    // Tees throughout — Kartik carries no shirts, so the shirt vocabulary is
    // never reached and `category.kind` is always "tee".
    const attrs = TEE_ATTRIBUTES;
    const closure = weightedPick(attrRand, attrs.closure, (a) => a.weight).name;
    const fit = weightedPick(attrRand, attrs.fit, (a) => a.weight).name;
    const neck = weightedPick(attrRand, attrs.neck, (a) => a.weight).name;
    const pattern = weightedPick(attrRand, attrs.pattern, (a) => a.weight).name;
    const sleeve = weightedPick(attrRand, attrs.sleeve, (a) => a.weight).name;

    const offers = OFFERS.filter((o) => rand() < o.chance)
      .filter((o) => !o.retired)
      .map((o) => o.name);
    const cashback = offers.includes("Cashback")
      ? weightedPick(rand, CASHBACK_AMOUNTS, (c) => c.weight).amount
      : undefined;
    /*
     * **Both drawn unconditionally, then kept only where the offer is.** The
     * conditions are deterministic, so drawing inside them would work — but the
     * house rule here is that a stream's draw count per product never depends
     * on anything else, which is what makes it safe to change an offer chance
     * later without re-rolling the two figures after it. Same reasoning as
     * `shippingFee` and `packType`, which are still drawn and simply unread.
     */
    const sellerOfferDraw = weightedPick(offerRand, SELLER_OFFER_PCT, (o) => o.weight).pct;
    const targetSchemeDraw = weightedPick(
      offerRand,
      TARGET_SCHEME_AMOUNTS,
      (t) => t.weight,
    ).amount;
    const sellerOfferPct = offers.length ? sellerOfferDraw : undefined;
    const targetScheme = offers.includes("SOLV Target Scheme") ? targetSchemeDraw : undefined;
    const render = Math.floor(rand() * 3);

    products.push({
      id: `k-${String(i + 1).padStart(4, "0")}`,
      title: kartikTitle(gender, fabric.name, neck, fit, sleeve, pattern, colour.name),
      image: kartikImage(gender, colour.dark, render),
      brand: ZENIFIT,
      category: category.label,
      gender,
      sellerId: KARTIK.id,
      sellerName: KARTIK.name,
      sellerCity: KARTIK.city,
      colour: colour.name,
      colourHex: colour.hex,
      packType: packType.name,
      fabric: fabric.name,
      fit,
      neck,
      sleeve,
      pattern,
      closure,
      moq: moq.qty,
      deliveryDays: delivery.days,
      offers,
      cashback,
      sellerOfferPct,
      targetScheme,
      bestSeller: rand() < 0.18,
      listedDaysAgo: Math.floor(rand() * 180),
      popularity: Math.floor(rand() * 10000),
      variants: buildVariants(
        rand,
        sizeRun,
        packType.name === "Solid Size Pack",
        basePrice,
        baseMargin,
      ),
    });
  }

  return products;
}

/** Deterministic, so once per process is enough — same as the main catalog. */
let cached: Product[] | null = null;

export function getKartikCatalog(): Product[] {
  if (!cached) cached = generateKartikCatalog();
  return cached;
}
