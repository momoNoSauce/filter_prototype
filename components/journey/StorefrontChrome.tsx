const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * Whether the basket bar is shown. **Off since 2026-08-20, on request.**
 *
 * `CartBar` below is kept whole rather than deleted: the journey has no basket
 * to fill, so the bar could only ever print the screengrab's fixed ₹717, and a
 * total that never moves invites the question of why. Flipping this to `true`
 * brings it back on both the storefront and the detail screen at once — which is
 * why it is one exported constant and not a prop threaded through two callers.
 */
export const SHOW_CART_BAR = false;

/**
 * The seller block under the app bar — storefront tile, name, `More info ›`.
 *
 * Note the name appears in **three casings across two screens** of the live app:
 * `Kartik exporters` on the home banner, `KARTIK EXPORTERS` in the app bar, and
 * `Kartik Exporters` here. Reproduced rather than harmonised, per the
 * instruction to follow the quirks; worth raising with the designer.
 *
 * The tile is a crop from the screengrab, not a redraw — a lavender square with
 * a purple warehouse glyph, which no icon in `public/figma/` supplies.
 */
export function SellerHeader({ name }: { name: string }) {
  return (
    // Bleeds past the list's 9px inset so its white band reaches both frame
    // edges, as the screengrab has it. It lives *inside* the scroller — see
    // `PlpScreen` — so it needs the negative margin the cards don't.
    <div className="-mx-[9px] mb-[2px] flex w-[calc(100%+18px)] shrink-0 items-center gap-[16px] bg-white px-[9px] py-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="size-[46px] shrink-0 rounded-[4px]"
        src="/journey/storefront.png"
      />
      <div className="flex min-w-0 flex-col items-start gap-[2px]">
        <p className="truncate text-[18px] leading-[22px] font-bold text-black">{name}</p>
        {/* Inert: there is no "More info" screengrab, so it renders and doesn't
            navigate rather than inventing a sheet the real app may not have. */}
        <p className="text-[14px] leading-[18px] font-medium text-primary">More info ›</p>
      </div>
    </div>
  );
}

/**
 * The basket bar the storefront carries at the foot of the screen: running
 * total, delivery line, and the call to action.
 *
 * **It is present in one screengrab and absent in the other**, the second being
 * scrolled further down the same listing. That reads as hide-on-scroll, but two
 * stills can't prove it, so it is pinned here instead — a bar that vanishes
 * would be a behaviour invented from a single missing frame. Flagged as an open
 * question.
 *
 * The figures are fixed, not derived: nothing in this prototype adds to a
 * basket, so a live total would always read ₹0 and the bar would look broken.
 * They are the screengrab's own numbers.
 */
export function CartBar({
  total = 717,
  count = 3,
}: {
  total?: number;
  count?: number;
}) {
  return (
    <div className="flex h-[64px] w-full shrink-0 items-center gap-[12px] border-t border-primary bg-white pr-[10px] pl-[14px]">
      <span className="relative block size-[34px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="size-full" src="/figma/icons/orders.svg" />
        {/* Sat at `-left-[6px]` and clipped against the 360px frame edge, the
            bar starting at 14px. Kept inside the glyph instead. */}
        <span className="absolute -top-[3px] left-0 flex size-[18px] items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
          {count}
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="text-[20px] leading-[24px] font-bold text-primary">{inr(total)}</p>
        <p className="text-[11px] leading-[14px] font-medium text-muted">
          + ₹0 DELIVERY CHARGES
        </p>
      </div>
      <div className="flex h-[46px] shrink-0 items-center gap-[6px] rounded-[4px] bg-primary px-[20px]">
        <span className="text-[15px] font-bold whitespace-nowrap text-white">
          GO TO CART
        </span>
        <span className="text-[16px] leading-none text-white">›</span>
      </div>
    </div>
  );
}
