import type { Gender, Product, Seller, Variant } from "./types";
import { productImage } from "./productImage";

/**
 * Deterministic catalog generator.
 *
 * Everything is driven by a fixed-seed PRNG so facet counts are identical on
 * every reload and between server and client — a mismatch would both hydrate
 * badly and make the demo look broken.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SELLERS: Seller[] = [
  { id: "grasim", name: "Grasim Fabrics", city: "Surat" },
  { id: "gagan", name: "Gagan Garments Ltd.", city: "Ludhiana" },
  { id: "jannat", name: "Jannat Industriers Pvt Ltd", city: "Delhi" },
  { id: "heeralal", name: "Heeralal Garments Pvt Ltd", city: "Ludhiana" },
  { id: "baheti", name: "Baheti Garments", city: "Surat" },
  { id: "chalak", name: "Chalak Chatur Fashion", city: "Jaipur" },
  { id: "jalandhar", name: "Jalandhar Traders", city: "Jalandhar" },
  { id: "tirupur", name: "Tiruppur Knit House", city: "Tiruppur" },
];

/** Weighted so the Seller facet has a realistic long tail. Sums to 1070. */
const SELLER_WEIGHTS: Record<string, number> = {
  grasim: 300,
  gagan: 230,
  jannat: 160,
  heeralal: 140,
  baheti: 100,
  chalak: 60,
  jalandhar: 50,
  tirupur: 30,
};

/**
 * The seven categories in the Category tile grid, in the order the merchandising
 * list gives them.
 *
 * These labels name their audience — "Women's T-Shirts", "Boy's Casual Shirts" —
 * so category and gender are 1:1 here rather than many-to-many. That keeps the
 * pruning demo, and sharpens it: picking Girls leaves a single tile standing,
 * and picking Men leaves three. `gender` is still its own facet because each
 * variant reaches it differently, but it is now derivable from the category.
 *
 * `plural` is the gender-free noun used in product titles, so a title reads
 * "… Casual T-Shirts for Boys" and not "… Boy's Casual T-Shirts for Boys".
 *
 * `priceFloor`/`priceCeil` are per-category rather than a blanket rule: kids'
 * lines have to sit below adult ones, and formal above casual, or the Price
 * Range facet has nothing to separate.
 */
export const CATEGORIES: {
  id: string;
  label: string;
  plural: string;
  weight: number;
  gender: Gender;
  /**
   * Which attribute vocabulary the garment draws from. A shirt has a collar
   * and a button placket; a tee has a neckline and pulls over. Filtering both
   * from one list would offer *Spread Collar* on a t-shirt, so the vertical
   * picks the vocabulary the way it already picks the size vocabulary.
   */
  kind: "shirt" | "tee";
  priceFloor: number;
  priceCeil: number;
}[] = [
  {
    id: "womens-t-shirts",
    label: "Women's T-Shirts",
    plural: "T-Shirts",
    weight: 180,
    gender: "women",
    kind: "tee",
    priceFloor: 150,
    priceCeil: 450,
  },
  {
    id: "mens-formal-shirts",
    label: "Men's Formal Shirts",
    plural: "Formal Shirts",
    weight: 170,
    gender: "men",
    kind: "shirt",
    // Runs highest of the seven, and far enough to keep the top Price Range
    // bucket ("₹900 & above") populated — an option that can never appear is
    // worse than no option.
    priceFloor: 260,
    priceCeil: 1150,
  },
  {
    id: "mens-casual-t-shirts",
    label: "Men's Casual T-Shirts",
    plural: "Casual T-Shirts",
    weight: 210,
    gender: "men",
    kind: "tee",
    priceFloor: 160,
    priceCeil: 480,
  },
  {
    id: "mens-casual-shirts",
    label: "Men's Casual Shirts",
    plural: "Casual Shirts",
    weight: 190,
    gender: "men",
    kind: "shirt",
    priceFloor: 220,
    priceCeil: 780,
  },
  {
    id: "girls-t-shirts",
    label: "Girl's T-Shirts",
    plural: "T-Shirts",
    weight: 100,
    gender: "girls",
    kind: "tee",
    priceFloor: 110,
    priceCeil: 320,
  },
  {
    id: "boys-casual-shirts",
    label: "Boy's Casual Shirts",
    plural: "Casual Shirts",
    weight: 100,
    gender: "boys",
    kind: "shirt",
    priceFloor: 150,
    priceCeil: 430,
  },
  {
    id: "boys-casual-t-shirts",
    label: "Boy's Casual T-Shirts",
    plural: "Casual T-Shirts",
    weight: 120,
    gender: "boys",
    kind: "tee",
    priceFloor: 110,
    priceCeil: 330,
  },
];

/**
 * Brands are category-restricted too, so the Brand facet prunes as well. Kids'
 * lines carry the fewest brands, which is both true to trade and what makes
 * Boy's Casual T-Shirts collapse the Brands grid to two tiles.
 */
export const BRANDS: { name: string; weight: number; categories: string[] }[] = [
  {
    name: "Camisa",
    weight: 22,
    categories: ["mens-casual-shirts", "mens-formal-shirts", "mens-casual-t-shirts"],
  },
  {
    name: "Spykar",
    weight: 16,
    categories: ["mens-casual-shirts", "mens-casual-t-shirts", "womens-t-shirts"],
  },
  { name: "Raymond", weight: 14, categories: ["mens-formal-shirts", "mens-casual-shirts"] },
  {
    name: "Peter England",
    weight: 13,
    categories: ["mens-formal-shirts", "mens-casual-shirts", "mens-casual-t-shirts"],
  },
  {
    name: "Monte Carlo",
    weight: 11,
    categories: ["womens-t-shirts", "boys-casual-t-shirts", "girls-t-shirts"],
  },
  {
    name: "Killer",
    weight: 10,
    categories: [
      "mens-casual-t-shirts",
      "mens-casual-shirts",
      "womens-t-shirts",
      "boys-casual-t-shirts",
    ],
  },
  { name: "Arrow", weight: 9, categories: ["mens-formal-shirts", "mens-casual-shirts"] },
  {
    name: "Allen Solly",
    weight: 8,
    categories: [
      "mens-formal-shirts",
      "womens-t-shirts",
      "boys-casual-shirts",
      "girls-t-shirts",
    ],
  },
  { name: "Van Heusen", weight: 7, categories: ["mens-formal-shirts", "womens-t-shirts"] },
  {
    name: "Turtle",
    weight: 6,
    categories: ["mens-casual-shirts", "mens-formal-shirts", "boys-casual-shirts"],
  },
];

/*
 * Twenty colours, ordered by weight so the panel reads commonest-first.
 *
 * It was ten until 2026-08-20, and ten fit inside the fold — 520px of rows in
 * a 690px panel — which left the search field above them with nothing to do.
 * Twenty runs to 1,040px and is the first facet in the app that genuinely
 * needs searching; see `lib/filters/panelFit.ts`.
 *
 * Safe for the seed: `weightedPick` draws exactly one `rand()` however long
 * the array is, so the sequence never shifts and every documented count holds
 * — 1,070 total, Girls 97, Men 575, `₹900 & above` 37, the seven category
 * counts and the thirteen size counts. Only colour's own distribution moves,
 * which is the point. `dark` picks between the two product renders, so every
 * entry needs one.
 */
export const COLOURS: { name: string; hex: string; dark: boolean; weight: number }[] = [
  { name: "Black", hex: "#1a1a1a", dark: true, weight: 16 },
  { name: "White", hex: "#ffffff", dark: false, weight: 15 },
  { name: "Grey", hex: "#8a8a8a", dark: false, weight: 14 },
  { name: "Navy", hex: "#1f3a5f", dark: true, weight: 12 },
  { name: "Blue", hex: "#2f6fd0", dark: true, weight: 11 },
  { name: "Red", hex: "#c0392b", dark: true, weight: 10 },
  { name: "Beige", hex: "#d9c9a8", dark: false, weight: 9 },
  { name: "Maroon", hex: "#7b2434", dark: true, weight: 8 },
  { name: "Green", hex: "#2e7d4f", dark: true, weight: 8 },
  { name: "Olive", hex: "#6b7845", dark: true, weight: 6 },
  { name: "Teal", hex: "#17807e", dark: true, weight: 6 },
  { name: "Pink", hex: "#e79ab3", dark: false, weight: 5 },
  { name: "Purple", hex: "#6b4c9a", dark: true, weight: 5 },
  { name: "Brown", hex: "#6f4e37", dark: true, weight: 5 },
  { name: "Sky Blue", hex: "#7fb8e0", dark: false, weight: 5 },
  { name: "Mustard", hex: "#e9c94a", dark: false, weight: 4 },
  { name: "Rust", hex: "#b5551f", dark: true, weight: 4 },
  { name: "Lavender", hex: "#b9a7d6", dark: false, weight: 3 },
  { name: "Cream", hex: "#f2ead8", dark: false, weight: 3 },
  { name: "Coral", hex: "#f07a5f", dark: false, weight: 3 },
];

export const PACK_TYPES = [
  { name: "Solid Size Pack", weight: 45 },
  { name: "Mixed Size Pack", weight: 35 },
  { name: "Assorted Colour Pack", weight: 20 },
];

export const FABRICS = [
  { name: "Cotton", weight: 30 },
  { name: "Cotton Linen", weight: 22 },
  { name: "Rayon", weight: 16 },
  { name: "Polyester Blend", weight: 14 },
  { name: "Denim", weight: 10 },
  { name: "Silk Blend", weight: 8 },
];

export const OFFERS = [
  { name: "Bulk Offer", chance: 0.42 },
  /*
   * Retired 2026-08-19 with the rest of the GOLD branding, but **still drawn**.
   * `OFFERS.filter` runs its predicate once per entry, so deleting this one
   * would take a `rand()` call out of the middle of the sequence and re-roll
   * the entire catalog — every count in the docs with it. Drawn and discarded
   * costs nothing and keeps the seed where it is.
   */
  { name: "GOLD Target Scheme", chance: 0.55, retired: true },
  { name: "Cashback", chance: 0.22 },
  { name: "Free Delivery", chance: 0.16 },
];

export const DELIVERY_DAYS = [
  { days: 1, weight: 12 },
  { days: 2, weight: 24 },
  { days: 3, weight: 28 },
  { days: 5, weight: 22 },
  { days: 7, weight: 14 },
];

export const MOQS = [
  { qty: 2, weight: 10 },
  { qty: 4, weight: 22 },
  { qty: 6, weight: 18 },
  { qty: 10, weight: 20 },
  { qty: 12, weight: 14 },
  { qty: 20, weight: 10 },
  { qty: 50, weight: 6 },
];

export const GENDER_LABEL: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  boys: "Boys",
  girls: "Girls",
};

/**
 * Size vocabularies, in size order.
 *
 * Kids' lines are sold by age band in this market rather than by letter, so
 * the size facet's options depend on the category exactly the way brands and
 * price bands already do. It also sharpens the pruning demo the way the
 * category list does: pick Girls and every letter size leaves the Size panel,
 * pick Men and every age band does.
 */
export const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
export const KIDS_SIZES = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"];

export const ALL_SIZES = [...ADULT_SIZES, ...KIDS_SIZES];

/**
 * The contiguous stretch of its vocabulary one product is made in — a tee that
 * comes in S–XL, not one drawing a fresh size for every pack.
 *
 * Modelling the run at the **product** level is what makes Size worth
 * filtering on. Drawing sizes per pack instead lets 2–4 packs union together
 * into near-total coverage: measured against the old table, L reached 96% of
 * the catalog and M 93%, so ticking either pruned ~4% and the control was
 * dead. Runs put that back under the seller's control, where it belongs.
 *
 * Weighted toward the middle of each vocabulary, because that is where real
 * apparel sits — but not so far that XS or 3XL becomes unreachable. An option
 * that can never appear is worse than no option.
 */
export const ADULT_RUNS = [
  { start: 1, len: 2, weight: 12 }, // S–M
  { start: 2, len: 2, weight: 16 }, // M–L
  { start: 3, len: 2, weight: 14 }, // L–XL
  { start: 4, len: 2, weight: 8 }, //  XL–2XL
  { start: 1, len: 3, weight: 12 }, // S–L
  { start: 2, len: 3, weight: 14 }, // M–XL
  { start: 3, len: 3, weight: 6 }, //  L–2XL
  { start: 0, len: 2, weight: 6 }, //  XS–S
  { start: 5, len: 2, weight: 6 }, //  2XL–3XL
  { start: 1, len: 4, weight: 4 }, //  S–XL
  { start: 0, len: 7, weight: 2 }, //  the full range, rare
];

export const KIDS_RUNS = [
  { start: 0, len: 2, weight: 14 }, // 2-3Y–4-5Y
  { start: 1, len: 2, weight: 16 }, // 4-5Y–6-7Y
  { start: 2, len: 2, weight: 16 }, // 6-7Y–8-9Y
  { start: 3, len: 2, weight: 12 }, // 8-9Y–10-11Y
  { start: 4, len: 2, weight: 8 }, //  10-11Y–12-13Y
  { start: 0, len: 3, weight: 12 }, // 2-3Y–6-7Y
  { start: 1, len: 3, weight: 12 }, // 4-5Y–8-9Y
  { start: 2, len: 3, weight: 6 }, //  6-7Y–10-11Y
  { start: 0, len: 6, weight: 4 }, //  the full range, rare
];


/**
 * Attributes that belong to the **product vertical**, not to the catalog at
 * large: how the garment closes, how it fits, what it does at the neck, what
 * is printed on it, how long the sleeve is.
 *
 * Two vocabularies, because a shirt and a tee do not share these. A shirt has
 * a collar and a button placket; a tee has a neckline and pulls over. Offering
 * *Spread Collar* on a t-shirt would be the same mistake as offering `2XL` on
 * a garment sized in age bands, and the fix is the same one: the vertical
 * picks the vocabulary.
 *
 * Weighted rather than uniform, so the options separate — *Full Button
 * Placket* is most shirts and *Pullover* is most tees, and the rarer ones stay
 * reachable without being everywhere.
 */
const SHIRT_ATTRIBUTES = {
  closure: [
    { name: "Full Button Placket", weight: 62 },
    { name: "Half Placket", weight: 20 },
    { name: "Snap Button", weight: 12 },
    { name: "Zipper", weight: 6 },
  ],
  fit: [
    { name: "Regular Fit", weight: 40 },
    { name: "Slim Fit", weight: 34 },
    { name: "Relaxed Fit", weight: 18 },
    { name: "Boxy Fit", weight: 8 },
  ],
  neck: [
    { name: "Spread Collar", weight: 34 },
    { name: "Button-Down Collar", weight: 26 },
    { name: "Cutaway Collar", weight: 16 },
    { name: "Mandarin Collar", weight: 14 },
    { name: "Club Collar", weight: 10 },
  ],
  pattern: [
    { name: "Solid", weight: 34 },
    { name: "Checked", weight: 24 },
    { name: "Striped", weight: 20 },
    { name: "Printed", weight: 14 },
    { name: "Textured", weight: 8 },
  ],
  sleeve: [
    { name: "Full Sleeve", weight: 52 },
    { name: "Half Sleeve", weight: 36 },
    { name: "Roll-Up Sleeve", weight: 12 },
  ],
};

export const TEE_ATTRIBUTES = {
  closure: [
    { name: "Pullover", weight: 74 },
    { name: "Henley Placket", weight: 16 },
    { name: "Quarter Zip", weight: 10 },
  ],
  fit: [
    { name: "Regular Fit", weight: 38 },
    { name: "Slim Fit", weight: 26 },
    { name: "Oversized", weight: 22 },
    { name: "Relaxed Fit", weight: 14 },
  ],
  neck: [
    { name: "Round Neck", weight: 44 },
    { name: "Polo Collar", weight: 22 },
    { name: "V-Neck", weight: 16 },
    { name: "Henley Neck", weight: 10 },
    { name: "Boat Neck", weight: 8 },
  ],
  pattern: [
    { name: "Solid", weight: 36 },
    { name: "Graphic Print", weight: 26 },
    { name: "Striped", weight: 18 },
    { name: "Colour Block", weight: 12 },
    { name: "Tie-Dye", weight: 8 },
  ],
  sleeve: [
    { name: "Half Sleeve", weight: 58 },
    { name: "Full Sleeve", weight: 22 },
    { name: "Sleeveless", weight: 12 },
    { name: "Three-Quarter Sleeve", weight: 8 },
  ],
};

export type PvAttributeId = keyof typeof SHIRT_ATTRIBUTES;

/** Rail order, and the label each attribute carries there. */
export const PV_ATTRIBUTES: { id: PvAttributeId; label: string }[] = [
  { id: "fit", label: "Fit" },
  { id: "neck", label: "Neck Type" },
  { id: "sleeve", label: "Sleeve Type" },
  { id: "pattern", label: "Pattern" },
  { id: "closure", label: "Closure Type" },
];

/**
 * Every value either vocabulary can produce, shirts first. The facet needs the
 * union because its option list is fixed while the catalog in scope is not —
 * zero-count options drop out on their own, which is what makes picking a
 * shirt vertical clear the necklines and picking a tee clear the collars.
 */
export const PV_ATTRIBUTE_OPTIONS: Record<PvAttributeId, string[]> = Object.fromEntries(
  PV_ATTRIBUTES.map(({ id }) => [
    id,
    [...new Set([...SHIRT_ATTRIBUTES[id], ...TEE_ATTRIBUTES[id]].map((v) => v.name))],
  ]),
) as Record<PvAttributeId, string[]>;

const SET_SIZES = [2, 4, 6, 10, 12];


export function weightedPick<T>(rand: () => number, items: T[], weightOf: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = rand() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

/**
 * One pack's contents, drawn from the product's size run.
 *
 * A **Solid Size Pack** is one size for the whole carton — which is what that
 * pack type has always claimed on the card and what the old flat table never
 * honoured. Every other pack type spreads across a window of the run, the
 * middle sizes taking the remainder the way a real size curve does.
 *
 * Quantities always sum to `setOf`. A retailer reads this line to work out
 * what actually arrives, so a breakup that does not add up is a wrong answer
 * to the only question the line exists to answer.
 */
function buildBreakup(roll: number, run: string[], solid: boolean, setOf: number) {
  if (solid) return [{ size: run[Math.floor(roll * run.length)], qty: setOf }];

  // Capped at four sizes. A carton spread over all seven runs the pill's
  // `whitespace-nowrap` label past the 360px frame, so it can only ever show
  // one end of itself — and the live app's own cards spread over three.
  const span = Math.min(run.length, 4, 2 + Math.floor(roll * (run.length - 1)));
  const start = Math.floor((run.length - span) / 2);
  const window = run.slice(start, start + span);

  const middle = (window.length - 1) / 2;
  const order = [...window.keys()].sort(
    (a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b,
  );

  const qty: number[] = new Array(window.length).fill(0);
  for (let i = 0; i < setOf; i += 1) qty[order[i % order.length]] += 1;

  return window.map((size, i) => ({ size, qty: qty[i] })).filter((part) => part.qty > 0);
}

export function buildVariants(
  rand: () => number,
  run: string[],
  solid: boolean,
  basePrice: number,
  baseMargin: number,
): Variant[] {
  const count = 2 + Math.floor(rand() * 3); // 2–4 packs

  // A full Fisher–Yates over the five set sizes, then take the first `count`.
  //
  // This was `[...SET_SIZES].sort(() => rand() - 0.5)`, which is the shuffle
  // antipattern and broke the one invariant this whole file exists to hold. A
  // comparator returning a coin flip is not a consistent ordering function, so
  // V8 is free to walk the array however it likes: both the resulting order and
  // **the number of `rand()` calls consumed** (measured: 6, 7 or 8) are
  // implementation-defined. Since this draws from the *main* stream inside the
  // per-product loop, a different draw count re-rolls every product after it.
  //
  // That was not theoretical. Vercel builds on Node 24 and this machine runs
  // Node 26, and the two disagreed: same seed, Node 24 gave `2,6,12,10,4` and
  // Node 26 gave `6,12,2,4,10`. Production served a different catalog from the
  // one every test and every documented count described — 55 vertical routes
  // locally against 56 there, `Men` 575 against 590, and five of the seven
  // category counts apart. The tests passed on the machine that wrote them.
  //
  // Fisher–Yates takes exactly `SET_SIZES.length - 1` draws, always, whatever
  // the values are and whatever engine runs it. The catalog re-rolled once when
  // this landed and cannot drift again. **Any future shuffle here must have a
  // draw count fixed by the array's length, never by a comparator.**
  const pool = [...SET_SIZES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const sizes = pool.slice(0, count).sort((a, b) => a - b);

  return sizes.map((setOf, index) => {
    // Larger packs get a per-piece discount and a better margin.
    const discount = 1 - Math.min(0.28, Math.log2(setOf) * 0.05);
    const pricePerPc = roundTo(basePrice * discount, 5);
    const marginPct = Math.min(78, Math.round(baseMargin + index * (2 + rand() * 4)));
    const mrp = roundTo(pricePerPc / (1 - marginPct / 100), 10);

    // Still exactly one draw, in the slot the old `pick(rand, SIZE_BREAKUPS)`
    // occupied, so moving to size runs left the main sequence — and every
    // documented facet count with it — untouched.
    const breakup = buildBreakup(rand(), run, solid, setOf);

    return {
      setOf,
      sizes: breakup.map((part) => part.size),
      sizeBreakup: breakup.map((part) => `${part.size}/${part.qty}`).join(", "),
      mrp,
      pricePerPc,
      marginPct,
      /*
       * Nothing reads this any more — the card's `+₹50 shipping fee` line went
       * on 2026-08-20, not being a real charge. The draw stays exactly where it
       * is: it sits mid-sequence, so removing the `rand()` would shift every
       * draw after it and re-roll the whole catalog, moving every count in the
       * docs. Same reason `packType` outlived its filter and the retired GOLD
       * offer is still drawn and discarded.
       */
      shippingFee: roundTo(30 + rand() * 90, 10),
    };
  });
}

export function generateCatalog(): Product[] {
  const rand = mulberry32(0x50_1f_20_25);
  // Sizes draw from their own stream. Size runs are one extra decision per
  // product, and taking it from `rand` would have shifted every draw after it
  // — re-rolling the whole catalog and invalidating every count in the docs.
  // A second stream keeps the main sequence byte-for-byte what it was.
  const sizeRand = mulberry32(0x51_2e_50_17);
  // A third stream, for the same reason as the second: five more draws per
  // product on the main one would have re-rolled the catalog and moved every
  // count in the docs.
  const attrRand = mulberry32(0x5a_77_20_19);
  const products: Product[] = [];

  // Expand the seller weights into a flat draw pool so the totals land exactly.
  const sellerPool: Seller[] = [];
  for (const seller of SELLERS) {
    for (let i = 0; i < SELLER_WEIGHTS[seller.id]; i += 1) sellerPool.push(seller);
  }
  // Fisher–Yates with the seeded PRNG, so sellers interleave rather than clump.
  for (let i = sellerPool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [sellerPool[i], sellerPool[j]] = [sellerPool[j], sellerPool[i]];
  }

  for (let i = 0; i < sellerPool.length; i += 1) {
    const seller = sellerPool[i];
    const category = weightedPick(rand, CATEGORIES, (c) => c.weight);
    // The category names its audience, so gender follows from it rather than
    // being drawn separately.
    const gender = category.gender;

    const eligibleBrands = BRANDS.filter((b) => b.categories.includes(category.id));
    const brand = weightedPick(rand, eligibleBrands, (b) => b.weight);

    const colour = weightedPick(rand, COLOURS, (c) => c.weight);
    const fabric = weightedPick(rand, FABRICS, (f) => f.weight);
    const packType = weightedPick(rand, PACK_TYPES, (p) => p.weight);
    const delivery = weightedPick(rand, DELIVERY_DAYS, (d) => d.weight);
    const moq = weightedPick(rand, MOQS, (m) => m.weight);

    // Each category carries its own band — kids' below adults', formal above
    // casual — so the Price Range buckets have something to separate.
    const { priceFloor, priceCeil } = category;
    const basePrice = roundTo(priceFloor + rand() * (priceCeil - priceFloor), 5);
    const baseMargin = 18 + Math.floor(rand() * 48);

    // Kids' lines are sized by age band, adults' by letter. One run per
    // product, not per pack — see ADULT_RUNS.
    const kids = gender === "boys" || gender === "girls";
    const vocabulary = kids ? KIDS_SIZES : ADULT_SIZES;
    const run = weightedPick(sizeRand, kids ? KIDS_RUNS : ADULT_RUNS, (r) => r.weight);
    const sizeRun = vocabulary.slice(run.start, run.start + run.len);

    // Vertical-specific attributes, drawn from the vocabulary the garment kind
    // uses. Fixed order — closure, fit, neck, pattern, sleeve — because the
    // stream's meaning depends on it.
    const attrs = category.kind === "shirt" ? SHIRT_ATTRIBUTES : TEE_ATTRIBUTES;
    const closure = weightedPick(attrRand, attrs.closure, (a) => a.weight).name;
    const fit = weightedPick(attrRand, attrs.fit, (a) => a.weight).name;
    const neck = weightedPick(attrRand, attrs.neck, (a) => a.weight).name;
    const pattern = weightedPick(attrRand, attrs.pattern, (a) => a.weight).name;
    const sleeve = weightedPick(attrRand, attrs.sleeve, (a) => a.weight).name;

    const offers = OFFERS.filter((o) => rand() < o.chance)
      .filter((o) => !o.retired)
      .map((o) => o.name);
    const code = 1000 + Math.floor(rand() * 8999);

    products.push({
      id: `p-${String(i + 1).padStart(4, "0")}`,
      title: `${brand.name} ${code} ${fabric.name} ${category.plural} for ${GENDER_LABEL[gender]}, ${colour.name}`,
      // Derived, never drawn — see `productImage`, which falls back to these two
      // Figma renders for any wearer/garment/colour whose art hasn't landed yet.
      image: productImage(colour, category.kind, gender),
      brand: brand.name,
      category: category.label,
      gender,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerCity: seller.city,
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
