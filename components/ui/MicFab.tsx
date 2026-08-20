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
 * 78px also clears every bar this app puts at the foot of a listing — A and C's
 * 72px Sort · Filters bar and the journey's basket bar — which is why the PLP
 * can anchor it to the frame and not to whatever is below the list.
 *
 * `z-30` keeps it under the sheets (z-40) and the Filters screen (z-50): it is
 * scenery, and scenery does not sit on top of a scrim.
 */
export function MicFab() {
  return (
    <div className="pointer-events-none absolute right-[20px] bottom-[78px] z-30 flex size-[47px] items-center justify-center rounded-full border-2 border-[#023d8c] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-[21px] w-[13px]" src="/figma/icons/microphone.png" />
    </div>
  );
}
