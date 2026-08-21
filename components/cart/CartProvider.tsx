"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * What the basket holds. **One line**, which is all this prototype ever adds:
 * the detail screen's stepper against one pack of one product.
 *
 * `total` is carried rather than derived. The listing needs it too, and a
 * listing scoped to another catalog — `/b` and `/userjourney` do not share
 * one — could not look the product up to price it. The screen that knows the
 * product computes it once.
 */
export type CartLine = {
  productId: string;
  variantIndex: number;
  /** Sets, not pieces: `qty × variant.setOf` is the piece count. */
  qty: number;
  total: number;
};

const CartContext = createContext<{
  line: CartLine | null;
  setLine: (line: CartLine | null) => void;
}>({ line: null, setLine: () => {} });

/**
 * Holds the basket **above the routes**, in the root layout, so it survives the
 * whole demo: every move between screens here is a client-side navigation —
 * `<Link>` on the cards, `router.push` on the home button, `router.back()` on
 * the back arrow — and React state above the router outlives all three. That is
 * what makes the bar persistent on the listing after you add from a detail
 * screen.
 *
 * Deliberately **not** in `sessionStorage`: a hard reload starts the demo again,
 * which is the behaviour you want when you hand someone a URL, and storage would
 * have to be read in an effect to avoid a hydration mismatch — a basket bar that
 * appears a frame late on every load, to solve a problem nobody has.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [line, setLine] = useState<CartLine | null>(null);
  const set = useCallback((next: CartLine | null) => setLine(next), []);
  const value = useMemo(() => ({ line, setLine: set }), [line, set]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
