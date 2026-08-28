"use client";

/**
 * A transient confirmation, centred just above the bottom bar.
 *
 * Not in the designs. It exists because dismissing a sheet throws its draft
 * away in silence: you tick two categories, tap the scrim by accident, and the
 * list is unchanged with nothing to say why. That reads as the filter being
 * broken rather than as a discard.
 *
 * Its lifetime is the CSS animation's — fade in, hold, fade out, then
 * `onDone` unmounts it on `animationend`. Same trick `Sheet` uses for its own
 * dismissal, and it keeps the duration in one place instead of pairing the
 * keyframes with a `setTimeout` free to drift out of step.
 *
 * The pill is the animated element and the wrapper does the centring, because
 * a `transform` in the keyframes would otherwise overwrite a centring
 * `-translate-x-1/2` and shunt it off to the right.
 */
export function Toast({
  text,
  onDone,
  bottom,
}: {
  text: string;
  onDone: () => void;
  /**
   * How far off the frame's foot to sit, in px.
   *
   * A number rather than the `clearsBottomBar` boolean it replaced: what has
   * to be cleared is the pill in A and C, the basket bar in B, D and the
   * journey, both, or neither, and only the caller knows which of those is on
   * screen right now. Asking the variant got it wrong in two of the four
   * combinations — see `toastBottom` in `PlpScreen`.
   */
  bottom: number;
}) {
  return (
    <div
      style={{ bottom }}
      className="pointer-events-none absolute inset-x-0 z-50 flex justify-center px-[16px]"
    >
      <div
        // Announced without stealing focus — the toast is never interactive,
        // and grabbing focus would drop the user out of the list they're in.
        role="status"
        aria-live="polite"
        onAnimationEnd={onDone}
        className="animate-toast max-w-full truncate rounded-[999px] bg-[#323232] px-[16px] py-[8px] text-[14px] leading-[16px] font-medium text-white shadow-[0px_2px_8px_rgba(0,0,0,0.25)]"
      >
        {text}
      </div>
    </div>
  );
}
