const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/*
 * `SellerHeader` was here — the storefront tile, `Kartik Exporters` and an inert
 * `More info ›`, bleeding past the list's inset so its white band reached both
 * frame edges. **Removed on 2026-09-08 on request**: the app bar already names
 * the seller, in caps, on a route that is one seller's storefront and reached
 * through his own banner, so the block restated it and cost ~66px of the fold
 * before the first card. `/journey/storefront.png` is left in place, being a
 * screengrab crop rather than something regenerable, and is now drawn by
 * nothing. It also carried the note that the live app writes the name three
 * ways across two screens — `Kartik exporters` on the banner, `KARTIK
 * EXPORTERS` in the bar, `Kartik Exporters` here — which is now two ways, both
 * still reproduced rather than harmonised.
 */

/**
 * The bar's height, and **the one place it is declared**: the slots that hide it
 * animate to and from this number, and a height transition needs a figure at
 * both ends. Keep it in step with the markup below.
 */
export const CART_BAR_H = 64;

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
 * **The defaults are the screengrab's numbers**, for the storefront, which has
 * no basket to read. The detail screen passes its own: `price/pc × set size ×
 * qty`, and `count={1}` — one line, which is all this prototype's basket can
 * hold.
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
        <span className="absolute -top-[3px] left-0 flex size-[17px] items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
          {count}
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="text-[20px] leading-[24px] font-bold text-primary">{inr(total)}</p>
        {/*
          `whitespace-nowrap`, and the button below gave up 6px of padding to
          pay for it (2026-08-21). The bar was built against a screengrab whose
          total was ₹717; the first four-digit total wrapped this line in two,
          because our 13px is a deliberate raise over the app's measured ~10px
          — see *Type scale* — and 13px needs 150 of the 165px the row has once
          the button is at the width the screengrab draws it.
        */}
        <p className="text-[13px] leading-[16px] font-medium whitespace-nowrap text-muted">
          + ₹0 DELIVERY CHARGES
        </p>
      </div>
      <div className="flex h-[46px] shrink-0 items-center gap-[6px] rounded-[4px] bg-primary px-[14px]">
        <span className="text-[15px] font-bold whitespace-nowrap text-white">
          GO TO CART
        </span>
        <span className="text-[16px] leading-none text-white">›</span>
      </div>
    </div>
  );
}
