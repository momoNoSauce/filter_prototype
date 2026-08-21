"use client";

import { useCallback, useEffect, useState } from "react";
import { MaskIcon } from "@/components/ui/MaskIcon";

/** Measured off the screengrab at 2.5×: 704 × 684 device px. */
const CARD_W = 282;
const CARD_H = 274;
/** The blue band at the foot of the card — the tap target that dismisses it. */
const BUTTON_H = 43;

/**
 * The confetti shower: 24 pieces, **hand-written rather than random**.
 *
 * `left` in %, `delay` and `dur` in ms, `drift` the sideways travel, `spin` the
 * rotation, `w`/`h` the piece, and a colour from the app's own palette —
 * `primary`, the cashback orange, the ✕ green and the badge orange. A random
 * table would make every screenshot of this different, which is the same reason
 * the catalog's seed is fixed; and the pieces read as scattered either way.
 */
const CONFETTI = [
  { left: 4, delay: 0, dur: 1500, drift: 14, spin: 540, w: 7, h: 11, c: "#004ffa" },
  { left: 11, delay: 180, dur: 1700, drift: -12, spin: -420, w: 6, h: 6, c: "#fb9805" },
  { left: 17, delay: 60, dur: 1400, drift: 20, spin: 620, w: 9, h: 5, c: "#2e9e42" },
  { left: 23, delay: 320, dur: 1650, drift: -8, spin: 480, w: 6, h: 10, c: "#ff7711" },
  { left: 29, delay: 120, dur: 1550, drift: 16, spin: -560, w: 8, h: 8, c: "#004ffa" },
  { left: 35, delay: 420, dur: 1750, drift: -18, spin: 500, w: 5, h: 9, c: "#fb9805" },
  { left: 41, delay: 40, dur: 1450, drift: 10, spin: 660, w: 10, h: 6, c: "#2e9e42" },
  { left: 47, delay: 260, dur: 1600, drift: -14, spin: -520, w: 7, h: 7, c: "#ff7711" },
  { left: 53, delay: 100, dur: 1700, drift: 18, spin: 580, w: 6, h: 11, c: "#004ffa" },
  { left: 59, delay: 380, dur: 1500, drift: -10, spin: 440, w: 9, h: 5, c: "#fb9805" },
  { left: 65, delay: 20, dur: 1650, drift: 12, spin: -600, w: 7, h: 9, c: "#2e9e42" },
  { left: 71, delay: 300, dur: 1550, drift: -20, spin: 520, w: 6, h: 6, c: "#ff7711" },
  { left: 77, delay: 160, dur: 1750, drift: 8, spin: 640, w: 8, h: 10, c: "#004ffa" },
  { left: 83, delay: 440, dur: 1450, drift: -16, spin: -460, w: 5, h: 8, c: "#fb9805" },
  { left: 89, delay: 80, dur: 1600, drift: 14, spin: 560, w: 9, h: 7, c: "#2e9e42" },
  { left: 95, delay: 340, dur: 1700, drift: -12, spin: 480, w: 6, h: 10, c: "#ff7711" },
  { left: 8, delay: 520, dur: 1600, drift: 22, spin: -540, w: 6, h: 8, c: "#2e9e42" },
  { left: 26, delay: 600, dur: 1500, drift: -6, spin: 500, w: 8, h: 6, c: "#004ffa" },
  { left: 44, delay: 560, dur: 1700, drift: 10, spin: 620, w: 5, h: 11, c: "#fb9805" },
  { left: 62, delay: 640, dur: 1550, drift: -18, spin: -580, w: 9, h: 6, c: "#ff7711" },
  { left: 80, delay: 500, dur: 1650, drift: 16, spin: 460, w: 7, h: 9, c: "#004ffa" },
  { left: 92, delay: 680, dur: 1500, drift: -10, spin: 600, w: 6, h: 7, c: "#2e9e42" },
  { left: 14, delay: 720, dur: 1600, drift: 12, spin: -500, w: 8, h: 9, c: "#ff7711" },
  { left: 68, delay: 760, dur: 1550, drift: -14, spin: 540, w: 6, h: 6, c: "#fb9805" },
];

/**
 * *Congrats! You've unlocked a new offer!* — the dialog the live app throws when
 * a line crosses the free-delivery threshold.
 *
 * **The card is the screengrab itself**, cropped and corner-clipped, on
 * instruction: the message never varies, the truck is a piece of artwork nothing
 * in `public/figma/` supplies, and re-typesetting it would only invite the two
 * to drift. The crop is the card's exact bounding box, so the grey scrim pixels
 * left in its four corners are precisely what `rounded-[13px]` +
 * `overflow-hidden` clips away — the radius is measured off those same corners.
 *
 * What is live rather than painted: the scrim, the ✕ above the card, and an
 * invisible button over the blue band. All three dismiss, which is every route
 * the screengrab offers.
 *
 * The ✕ is `MaskIcon`, not `<img>`: `close.svg` is black, for the sheets that
 * carry it on white, and here it sits on the scrim and has to be white.
 *
 * Dismissal is animated the way `Sheet` does it — `onClose` fires on
 * `animationend`, so the exit is never cut short.
 */
export function FreeDeliveryDialog({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div
      role="dialog"
      aria-label="Free delivery unlocked"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center"
    >
      <button
        aria-label="Close"
        onClick={requestClose}
        className={`absolute inset-0 cursor-default bg-black/40 ${
          closing ? "animate-scrim-out" : "animate-scrim-in"
        }`}
      />

      {/*
        The confetti falls **over** the card, and over the whole frame rather
        than the card alone: a shower that stops at a 282px box reads as a
        pattern inside a panel, where one crossing the screen reads as thrown at
        it. `pointer-events-none` so the card underneath is still tappable, and
        **not rendered at all** under `prefers-reduced-motion` — a shower of
        falling shapes is precisely what that setting is for, so there is nothing
        to collapse to one frame.
      */}
      {!closing && <Confetti />}

      <div
        className={`relative z-10 ${closing ? "animate-dialog-out" : "animate-dialog-in"}`}
        style={{ width: CARD_W }}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onClose();
        }}
      >
        {/* Above the card and just inside its right edge, as drawn. */}
        <button
          aria-label="Close"
          onClick={requestClose}
          className="absolute -top-[32px] right-[7px] flex size-[26px] cursor-pointer items-center justify-center"
        >
          <MaskIcon src="/figma/icons/close.svg" className="size-[19px]" color="#ffffff" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Congrats! You've unlocked a new offer — free delivery on this item"
          width={CARD_W}
          height={CARD_H}
          className="block w-full rounded-[13px]"
          src="/journey/free-delivery-dialog.png"
        />

        {/* Over the painted button. Transparent because the label is in the
            crop — drawing `Super! Thank you` again on top would double it at
            the first font-metric difference. */}
        <button
          onClick={requestClose}
          style={{ height: BUTTON_H }}
          className="absolute inset-x-0 bottom-0 w-full cursor-pointer rounded-b-[13px]"
        >
          <span className="sr-only">Super! Thank you</span>
        </button>
      </div>
    </div>
  );
}

/** The shower itself — see `CONFETTI` for why the table is hand-written. */
function Confetti() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden motion-reduce:hidden"
    >
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block rounded-[1px]"
          style={{
            left: `${piece.left}%`,
            width: piece.w,
            height: piece.h,
            backgroundColor: piece.c,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.dur}ms`,
            // Consumed by the keyframe, so one animation covers 24 paths.
            ["--drift" as string]: `${piece.drift}px`,
            ["--spin" as string]: `${piece.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
