import type { Gender } from "./types";

/**
 * Which picture a product shows.
 *
 * The catalog has always had **two** shirt renders, the only ones in the Figma
 * file, picked by whether the colour is dark or light — so a Coral tee for girls
 * showed a grey button-up. The fix (2026-08-21, on request) is one image per
 * *wearer × garment × colour*, generated rather than sourced: a model on a white
 * background, in the colour and garment the title claims.
 *
 * **The axis is `gender × kind`, not adult/kid × kind.** Six pairs occur in the
 * catalog — women-tee, men-tee, men-shirt, girls-tee, boys-tee, boys-shirt —
 * because no category sells a women's or girl's shirt. Collapsing women and men
 * into "adult" would put a man on a Women's T-Shirt card, which is the same class
 * of mismatch this replaces. Twenty colours over six pairs is **120 files**.
 *
 * The files are **JPEG at 276px wide** — 3× the 92px the card draws them at, and
 * ~16KB each, so 120 of them is under 2MB in the repo. Generated with Magnific's
 * Nano Banana 2 Lite: a model on seamless white, waist-up, no print or logo.
 *
 * Nothing here touches the seed's PRNG: the image was always *derived* from the
 * colour rather than drawn, so changing the derivation moves no count.
 */

/** `Sky Blue` → `sky-blue`, which is the filename form. */
export const colourSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/**
 * The generated files that exist, by name. **Empty until the art lands**, and the
 * resolver falls back to the two Figma renders for anything missing — so the
 * catalog is never pointed at a 404, and images can arrive in batches (one
 * colour, one wearer) without a flag day.
 *
 * A set rather than a filesystem check: this runs in the browser as well as on
 * the server, and the seed is built in both.
 */
export const GENERATED_PRODUCT_IMAGES: ReadonlySet<string> = new Set<string>([
  "boys-shirt-beige.jpg",
  "boys-shirt-black.jpg",
  "boys-shirt-blue.jpg",
  "boys-shirt-brown.jpg",
  "boys-shirt-coral.jpg",
  "boys-shirt-cream.jpg",
  "boys-shirt-green.jpg",
  "boys-shirt-grey.jpg",
  "boys-shirt-lavender.jpg",
  "boys-shirt-maroon.jpg",
  "boys-shirt-mustard.jpg",
  "boys-shirt-navy.jpg",
  "boys-shirt-olive.jpg",
  "boys-shirt-pink.jpg",
  "boys-shirt-purple.jpg",
  "boys-shirt-red.jpg",
  "boys-shirt-rust.jpg",
  "boys-shirt-sky-blue.jpg",
  "boys-shirt-teal.jpg",
  "boys-shirt-white.jpg",
  "boys-tee-beige.jpg",
  "boys-tee-black.jpg",
  "boys-tee-blue.jpg",
  "boys-tee-brown.jpg",
  "boys-tee-coral.jpg",
  "boys-tee-cream.jpg",
  "boys-tee-green.jpg",
  "boys-tee-grey.jpg",
  "boys-tee-lavender.jpg",
  "boys-tee-maroon.jpg",
  "boys-tee-mustard.jpg",
  "boys-tee-navy.jpg",
  "boys-tee-olive.jpg",
  "boys-tee-pink.jpg",
  "boys-tee-purple.jpg",
  "boys-tee-red.jpg",
  "boys-tee-rust.jpg",
  "boys-tee-sky-blue.jpg",
  "boys-tee-teal.jpg",
  "boys-tee-white.jpg",
  "girls-tee-beige.jpg",
  "girls-tee-black.jpg",
  "girls-tee-blue.jpg",
  "girls-tee-brown.jpg",
  "girls-tee-coral.jpg",
  "girls-tee-cream.jpg",
  "girls-tee-green.jpg",
  "girls-tee-grey.jpg",
  "girls-tee-lavender.jpg",
  "girls-tee-maroon.jpg",
  "girls-tee-mustard.jpg",
  "girls-tee-navy.jpg",
  "girls-tee-olive.jpg",
  "girls-tee-pink.jpg",
  "girls-tee-purple.jpg",
  "girls-tee-red.jpg",
  "girls-tee-rust.jpg",
  "girls-tee-sky-blue.jpg",
  "girls-tee-teal.jpg",
  "girls-tee-white.jpg",
  "men-shirt-beige.jpg",
  "men-shirt-black.jpg",
  "men-shirt-blue.jpg",
  "men-shirt-brown.jpg",
  "men-shirt-coral.jpg",
  "men-shirt-cream.jpg",
  "men-shirt-green.jpg",
  "men-shirt-grey.jpg",
  "men-shirt-lavender.jpg",
  "men-shirt-maroon.jpg",
  "men-shirt-mustard.jpg",
  "men-shirt-navy.jpg",
  "men-shirt-olive.jpg",
  "men-shirt-pink.jpg",
  "men-shirt-purple.jpg",
  "men-shirt-red.jpg",
  "men-shirt-rust.jpg",
  "men-shirt-sky-blue.jpg",
  "men-shirt-teal.jpg",
  "men-shirt-white.jpg",
  "men-tee-beige.jpg",
  "men-tee-black.jpg",
  "men-tee-blue.jpg",
  "men-tee-brown.jpg",
  "men-tee-coral.jpg",
  "men-tee-cream.jpg",
  "men-tee-green.jpg",
  "men-tee-grey.jpg",
  "men-tee-lavender.jpg",
  "men-tee-maroon.jpg",
  "men-tee-mustard.jpg",
  "men-tee-navy.jpg",
  "men-tee-olive.jpg",
  "men-tee-pink.jpg",
  "men-tee-purple.jpg",
  "men-tee-red.jpg",
  "men-tee-rust.jpg",
  "men-tee-sky-blue.jpg",
  "men-tee-teal.jpg",
  "men-tee-white.jpg",
  "women-tee-beige.jpg",
  "women-tee-black.jpg",
  "women-tee-blue.jpg",
  "women-tee-brown.jpg",
  "women-tee-coral.jpg",
  "women-tee-cream.jpg",
  "women-tee-green.jpg",
  "women-tee-grey.jpg",
  "women-tee-lavender.jpg",
  "women-tee-maroon.jpg",
  "women-tee-mustard.jpg",
  "women-tee-navy.jpg",
  "women-tee-olive.jpg",
  "women-tee-pink.jpg",
  "women-tee-purple.jpg",
  "women-tee-red.jpg",
  "women-tee-rust.jpg",
  "women-tee-sky-blue.jpg",
  "women-tee-teal.jpg",
  "women-tee-white.jpg",
]);

/**
 * `/products/{gender}-{kind}-{colour}.jpg` when that file has been generated,
 * else the Figma render the catalog shipped with.
 */
export function productImage(
  colour: { name: string; dark: boolean },
  kind: "shirt" | "tee",
  gender: Gender,
): string {
  const file = `${gender}-${kind}-${colourSlug(colour.name)}.jpg`;
  if (GENERATED_PRODUCT_IMAGES.has(file)) return `/products/${file}`;
  // The two-render fallback, unchanged: dark colours get the black shirt, light
  // ones the grey. Wrong garment for four of seven categories, which is the
  // whole reason the generated set exists.
  return colour.dark ? "/figma/products/shirt-black.png" : "/figma/products/shirt-grey.png";
}
