"use client";

import { useEffect } from "react";

/**
 * The first tap on a phone takes the app fullscreen, so a demo reads as an app
 * rather than as a page in a browser.
 *
 * **It has to be a tap.** The Fullscreen API requires a user gesture and there
 * is no way around that — browsers removed the ability to hide the address bar
 * on load deliberately, a page that can hide the URL being a page that can
 * pretend to be another one. The old `window.scrollTo(0, 1)` trick is both long
 * dead and inapplicable here, the document never scrolling: `.device-screen` is
 * `100dvh` with its own scrollers inside.
 *
 * Renders nothing, and shows nothing. That is the point — the alternative was a
 * floating expand button, which is chrome in no Figma frame sitting on screens
 * stakeholders are meant to be judging. The tap they were going to make anyway
 * does the job, and still does whatever it was for: this listener never calls
 * `preventDefault`, so the card still opens and the chip still filters.
 *
 * **Phones only**, by `(pointer: coarse)`. On a desktop the app already sits in
 * `DeviceFrame`'s mockup with room to spare, so there is no chrome worth
 * taking, and a browser that went fullscreen on the first click of every dev
 * session would be its own bug report. Note iPhone Safari does not implement
 * `requestFullscreen` on elements at all — only on video — so this is inert
 * there and the feature test is what keeps it quiet rather than throwing.
 *
 * **The listener stays.** Exiting fullscreen — a back gesture, a swipe from the
 * edge — is usually accidental during a demo, so the next tap puts it back;
 * a one-shot listener would leave the bar up for the rest of the session. While
 * fullscreen it does nothing at all.
 */
export function FullscreenOnTap() {
  useEffect(() => {
    const root = document.documentElement;
    if (typeof root.requestFullscreen !== "function") return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const go = () => {
      if (document.fullscreenElement) return;
      // `navigationUI: "hide"` asks for the browser's own controls to go too,
      // which is the whole point; it is a hint and a browser may ignore it.
      // Rejections are ordinary — a gesture the browser didn't count as one,
      // a permissions policy — and there is nothing useful to do about them,
      // so the next tap simply tries again.
      root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    };

    // `pointerdown` rather than `click`: it is the earliest event that still
    // carries user activation, so the bar is already leaving as the finger
    // lands rather than after it lifts. Passive — nothing here cancels.
    document.addEventListener("pointerdown", go, { passive: true });
    return () => document.removeEventListener("pointerdown", go);
  }, []);

  return null;
}
