"use client";

import { useRef, useState } from "react";

/**
 * Scroll delta that counts as a direction, in px. Without it a trackpad's
 * one-pixel jitter flips a bar on and off while the list sits still.
 */
const SCROLL_EPS = 4;

/**
 * Hide a fixed bar on the way down, bring it back on the way up.
 *
 * Shared by the chip strip and the basket bar, which want the same rule with one
 * difference — `foldsBeforeHide`. The strip waits **two folds**, measured against
 * the scroller's own height so it means the same thing on any frame: a buyer who
 * has barely started scrolling hasn't asked for the room. The basket bar waits
 * for nothing, because getting out of the way promptly is the whole point of a
 * bar that never leaves otherwise.
 *
 * `track` is called from an existing `onScroll` rather than owning the listener,
 * since both callers already have one — the listing pages its cards from it.
 */
export function useHideOnScroll({ foldsBeforeHide = 0 } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const track = (el: HTMLElement) => {
    const y = el.scrollTop;
    const dy = y - lastY.current;
    lastY.current = y;
    if (y <= el.clientHeight * foldsBeforeHide) setHidden(false);
    else if (dy > SCROLL_EPS) setHidden(true);
    else if (dy < -SCROLL_EPS) setHidden(false);
  };

  return { hidden, track };
}
