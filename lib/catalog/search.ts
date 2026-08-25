import type { Product } from "./types";

/**
 * Search, as the live SOLV app does it.
 *
 * Source is two screengrabs at 1080×2400 — exactly 3× the design, so every
 * value here was read off the raw pixels rather than eyeballed, the same way
 * the journey and the product card were. One shows the field empty with the
 * buyer's history; the other shows `shirt` typed with autocomplete under it.
 *
 * Everything in this file is a **fixture**, not a model of a search engine.
 * There is no backend, the demo types one word, and inventing a ranker would
 * be a lot of code standing behind a screengrab that already says what the
 * answer looks like.
 */

/**
 * The empty state's rows, verbatim from the screengrab and in its order —
 * this buyer's own history, so it reads as a used account rather than a fresh
 * install. `sdg` is a typo of theirs and is kept: the quirks in these grabs get
 * reproduced rather than tidied, which is the standing rule here.
 */
export const RECENT_SEARCHES = [
  "tshirt",
  "white shirt",
  "t shirt",
  "gym vest",
  "sdg",
  "t-shirt",
  "adr womens cotton round",
  "white shirt below 500",
];

export type Suggestion = {
  term: string;
  /** The green `Category Store` line the screengrab hangs under `shirt fabric`. */
  store?: boolean;
};

/**
 * The autocomplete vocabulary. The eight the screengrab shows for `shirt` lead
 * it, in its order, so typing that word reproduces the grab exactly — and
 * because the list is filtered by substring rather than looked up, any other
 * query still gets a plausible answer instead of an empty panel.
 */
const SUGGESTIONS: Suggestion[] = [
  { term: "shirt" },
  { term: "shirts" },
  { term: "shirt piece" },
  { term: "shirt mens" },
  { term: "shirts mens" },
  { term: "shirt men" },
  { term: "shirts tshirts" },
  { term: "shirt fabric", store: true },
  { term: "tshirt" },
  { term: "t-shirt" },
  { term: "white shirt" },
  { term: "formal shirt" },
  { term: "casual shirt" },
  { term: "kids tshirt" },
  { term: "cotton shirt" },
];

/** At most eight, which is what the screengrab fits above the keyboard. */
export function suggestionsFor(query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SUGGESTIONS.filter((s) => s.term.includes(q)).slice(0, 8);
}

/**
 * Products matching a query — a case-insensitive substring of the title, which
 * carries brand, fabric, category and colour, so one field covers all four.
 *
 * **`shirt` matches the whole catalog**, all 1,070, because every category is a
 * Shirt or a T-Shirt. That is not a shortcoming, it is why the search framing
 * could replace the Baheti storefront without moving a single documented count:
 * the scope is identical, and every facet figure, test and demo script still
 * holds. A narrower query prunes normally.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => p.title.toLowerCase().includes(q));
}
