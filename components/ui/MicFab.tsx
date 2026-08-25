/**
 * The floating mic — voice search, bottom right, on the home and on every
 * listing.
 *
 * **Inert**, like `More info ›`: there is no voice search behind it, and a
 * button that opens nothing is worse than one that plainly does nothing, so it
 * is `pointer-events-none` and taps fall through to the card underneath.
 *
 * Every number is measured off the live app's screengrabs at 3× — it appears in
 * three of the four, at the same size in each: a **47px** circle, a **2px**
 * `#023d8c` ring, a 13 × 21 glyph, **20px** in from the right edge, and **78px**
 * up from the bottom of the screen. It had been eyeballed on the home at 54px
 * and 18px up, which is a seventh too big and 60px too low; both moved here
 * rather than shipping one mic in two places at two sizes.
 *
 * **78 is not a free number — it is 14px above the floating pill**, which sits
 * `PILL_GAP` 12 up and is `PILL_H` 52 tall. That went unnoticed while the pill
 * had only one resting place, and broke the day the journey moved onto it
 * (2026-08-25): the pill rides *above the basket bar* when the basket has a
 * line, at 76–128, and a mic fixed at 78–125 lands inside it. The overlap is
 * 7px of x over the pill's whole height, and it was latent in A and C too —
 * `CartProvider` is global, so any variant can grow a basket bar.
 *
 * So `bottom` is a prop and `PlpScreen` passes `pillBottom + PILL_H + MIC_GAP`,
 * which is 78 exactly wherever it used to be 78 and moves only when the pill
 * does. The default keeps the home screens, which have no pill, on the measured
 * value with no caller changes.
 *
 * `z-30` keeps it under the sheets (z-40) and the Filters screen (z-50): it is
 * scenery, and scenery does not sit on top of a scrim.
 */
export function MicFab({ bottom = 78 }: { bottom?: number }) {
  return (
    <div
      style={{ bottom }}
      // Transitions with the same beat the pill and the basket bar use, so when
      // the bar slides away all three move as one thing rather than the mic
      // teleporting to a new resting place.
      className="pointer-events-none absolute right-[20px] z-30 flex size-[47px] items-center justify-center rounded-full border-2 border-[#023d8c] bg-white transition-[bottom] duration-200 ease-out motion-reduce:transition-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-[21px] w-[13px]" src="/figma/icons/microphone.png" />
    </div>
  );
}
