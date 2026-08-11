import { generateCatalog } from "./seed";
import type { Product } from "./types";

/**
 * The catalog is deterministic, so generating it once per process is enough.
 * Both the server render and the client bundle build the same array from the
 * same seed.
 */
let cached: Product[] | null = null;

export function getCatalog(): Product[] {
  if (!cached) cached = generateCatalog();
  return cached;
}

export const STOREFRONT = {
  id: "baheti",
  name: "Baheti Garments",
} as const;
