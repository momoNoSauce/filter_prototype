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
export const GENERATED_PRODUCT_IMAGES: ReadonlySet<string> = new Set<string>([]);

/**
 * `/products/{gender}-{kind}-{colour}.png` when that file has been generated,
 * else the Figma render the catalog shipped with.
 */
export function productImage(
  colour: { name: string; dark: boolean },
  kind: "shirt" | "tee",
  gender: Gender,
): string {
  const file = `${gender}-${kind}-${colourSlug(colour.name)}.png`;
  if (GENERATED_PRODUCT_IMAGES.has(file)) return `/products/${file}`;
  // The two-render fallback, unchanged: dark colours get the black shirt, light
  // ones the grey. Wrong garment for four of seven categories, which is the
  // whole reason the generated set exists.
  return colour.dark ? "/figma/products/shirt-black.png" : "/figma/products/shirt-grey.png";
}
