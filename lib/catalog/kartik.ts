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
const CASHBACK_AMOUNTS = [
  { amount: 100, weight: 70 },
  { amount: 200, weight: 30 },
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
