"use client";

import { useCallback, useEffect, useState } from "react";
import { MaskIcon } from "@/components/ui/MaskIcon";

/** Measured off the screengrab at 2.5×: 704 × 684 device px. */
const CARD_W = 282;
const CARD_H = 274;
/** The blue band at the foot of the card — the tap target that dismisses it. */
const BUTTON_H = 43;

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

      <div
        className={`relative ${closing ? "animate-dialog-out" : "animate-dialog-in"}`}
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
