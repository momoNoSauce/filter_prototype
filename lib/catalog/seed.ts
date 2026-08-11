import type { Gender, Product, Seller, Variant } from "./types";

/**
 * Deterministic catalog generator.
 *
 * Everything is driven by a fixed-seed PRNG so facet counts are identical on
 * every reload and between server and client — a mismatch would both hydrate
 * badly and make the demo look broken.
 */
function mulberry32(seed: number) {
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
 * The six verticals in the Category tile grid. `genders` is deliberately
 * restrictive: picking Girls must make Formal Shirt and Ethnic Shirt vanish
 * from the Category facet entirely. That pruning is the whole point of the demo.
 */
/* Listed in the order the Figma tile grid shows them. */
export const CATEGORIES: {
  id: string;
  label: string;
  plural: string;
  weight: number;
  genders: Gender[];
}[] = [
  {
    id: "formal-shirt",
    label: "Formal Shirt",
    plural: "Formal Shirts",
    weight: 240,
    genders: ["men", "women", "boys"],
  },
  {
    id: "casual-shirt",
    label: "Casual Shirt",
    plural: "Casual Shirts",
    weight: 280,
    genders: ["men", "women", "boys", "girls"],
  },
  {
    id: "partywear",
    label: "Partywear",
    plural: "Partywear",
    weight: 120,
    genders: ["men", "women", "girls"],
  },
  {
    id: "long-kurta",
    label: "Long Kurta Set",
    plural: "Long Kurta Sets",
    weight: 90,
    genders: ["women", "girls"],
  },
  {
    id: "ethnic-shirt",
    label: "Ethnic Shirt",
    plural: "Ethnic Shirts",
    weight: 150,
    genders: ["men", "boys"],
  },
  {
    id: "trendy-shirt",
    label: "Trendy Shirt",
    plural: "Trendy Shirts",
    weight: 190,
    genders: ["men", "women", "boys", "girls"],
  },
];

/** Brands are category-restricted too, so the Brand facet prunes as well. */
export const BRANDS: { name: string; weight: number; categories: string[] }[] = [
  { name: "Camisa", weight: 22, categories: ["casual-shirt", "formal-shirt", "trendy-shirt"] },
  { name: "Spykar", weight: 16, categories: ["casual-shirt", "trendy-shirt", "partywear"] },
  { name: "Raymond", weight: 14, categories: ["formal-shirt", "partywear", "ethnic-shirt"] },
  { name: "Peter England", weight: 13, categories: ["formal-shirt", "casual-shirt"] },
  { name: "Monte Carlo", weight: 11, categories: ["trendy-shirt", "ethnic-shirt", "long-kurta"] },
  { name: "Killer", weight: 10, categories: ["casual-shirt", "trendy-shirt"] },
  { name: "Arrow", weight: 9, categories: ["formal-shirt", "partywear"] },
  { name: "Allen Solly", weight: 8, categories: ["formal-shirt", "casual-shirt", "partywear"] },
  { name: "Van Heusen", weight: 7, categories: ["formal-shirt", "partywear"] },
  { name: "Turtle", weight: 6, categories: ["casual-shirt", "ethnic-shirt", "long-kurta"] },
];

export const COLOURS: { name: string; hex: string; dark: boolean; weight: number }[] = [
  { name: "Black", hex: "#1a1a1a", dark: true, weight: 16 },
  { name: "White", hex: "#ffffff", dark: false, weight: 15 },
  { name: "Grey", hex: "#8a8a8a", dark: false, weight: 14 },
  { name: "Navy", hex: "#1f3a5f", dark: true, weight: 12 },
  { name: "Blue", hex: "#2f6fd0", dark: true, weight: 11 },
  { name: "Beige", hex: "#d9c9a8", dark: false, weight: 9 },
  { name: "Maroon", hex: "#7b2434", dark: true, weight: 8 },
  { name: "Olive", hex: "#6b7845", dark: true, weight: 6 },
  { name: "Pink", hex: "#e79ab3", dark: false, weight: 5 },
  { name: "Mustard", hex: "#e9c94a", dark: false, weight: 4 },
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
  { name: "GOLD Target Scheme", chance: 0.55 },
  { name: "Cashback", chance: 0.22 },
  { name: "Free Shipping", chance: 0.16 },
];

const DELIVERY_DAYS = [
  { days: 1, weight: 12 },
  { days: 2, weight: 24 },
  { days: 3, weight: 28 },
  { days: 5, weight: 22 },
  { days: 7, weight: 14 },
];

const MOQS = [
  { qty: 2, weight: 10 },
  { qty: 4, weight: 22 },
  { qty: 6, weight: 18 },
  { qty: 10, weight: 20 },
  { qty: 12, weight: 14 },
  { qty: 20, weight: 10 },
  { qty: 50, weight: 6 },
];

const GENDER_LABEL: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  boys: "Boys",
  girls: "Girls",
};

/** Pack shapes, keyed by set size. Bigger packs price lower per piece. */
const SIZE_BREAKUPS: Record<number, string[]> = {
  2: ["S,S", "L,XL", "M,L"],
  4: ["M, L, XL, 2XL", "XS×2,S×2", "S, M, L, XL"],
  6: ["M×2,L×2,XL×2", "S,M,L,XL,2XL,3XL"],
  10: ["2XL", "L×4,XL×4,2XL×2"],
  12: ["S×3,M×3,L×3,XL×3"],
};

const SET_SIZES = [2, 4, 6, 10, 12];

function weightedPick<T>(rand: () => number, items: T[], weightOf: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = rand() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function buildVariants(rand: () => number, basePrice: number, baseMargin: number): Variant[] {
  const count = 2 + Math.floor(rand() * 3); // 2–4 packs
  const sizes = [...SET_SIZES].sort(() => rand() - 0.5).slice(0, count).sort((a, b) => a - b);

  return sizes.map((setOf, index) => {
    // Larger packs get a per-piece discount and a better margin.
    const discount = 1 - Math.min(0.28, Math.log2(setOf) * 0.05);
    const pricePerPc = roundTo(basePrice * discount, 5);
    const marginPct = Math.min(78, Math.round(baseMargin + index * (2 + rand() * 4)));
    const mrp = roundTo(pricePerPc / (1 - marginPct / 100), 10);

    return {
      setOf,
      sizeBreakup: pick(rand, SIZE_BREAKUPS[setOf]),
      mrp,
      pricePerPc,
      marginPct,
      shippingFee: roundTo(30 + rand() * 90, 10),
    };
  });
}

export function generateCatalog(): Product[] {
  const rand = mulberry32(0x50_1f_20_25);
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
    const gender = pick(rand, category.genders);

    const eligibleBrands = BRANDS.filter((b) => b.categories.includes(category.id));
    const brand = weightedPick(rand, eligibleBrands, (b) => b.weight);

    const colour = weightedPick(rand, COLOURS, (c) => c.weight);
    const fabric = weightedPick(rand, FABRICS, (f) => f.weight);
    const packType = weightedPick(rand, PACK_TYPES, (p) => p.weight);
    const delivery = weightedPick(rand, DELIVERY_DAYS, (d) => d.weight);
    const moq = weightedPick(rand, MOQS, (m) => m.weight);

    // Kids' and casual lines sit lower; partywear and kurta sets sit higher.
    const priceFloor = category.id === "partywear" || category.id === "long-kurta" ? 320 : 140;
    const priceCeil = category.id === "partywear" || category.id === "long-kurta" ? 1250 : 620;
    const kidsFactor = gender === "boys" || gender === "girls" ? 0.7 : 1;
    const basePrice = roundTo((priceFloor + rand() * (priceCeil - priceFloor)) * kidsFactor, 5);
    const baseMargin = 18 + Math.floor(rand() * 48);

    const offers = OFFERS.filter((o) => rand() < o.chance).map((o) => o.name);
    const code = 1000 + Math.floor(rand() * 8999);

    products.push({
      id: `p-${String(i + 1).padStart(4, "0")}`,
      title: `${brand.name} ${code} ${fabric.name} ${category.plural} for ${GENDER_LABEL[gender]}, ${colour.name}`,
      image: colour.dark ? "/figma/products/shirt-black.png" : "/figma/products/shirt-grey.png",
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
      moq: moq.qty,
      deliveryDays: delivery.days,
      offers,
      bestSeller: rand() < 0.18,
      listedDaysAgo: Math.floor(rand() * 180),
      popularity: Math.floor(rand() * 10000),
      variants: buildVariants(rand, basePrice, baseMargin),
    });
  }

  return products;
}
