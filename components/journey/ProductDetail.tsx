"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { AppBar } from "@/components/plp/AppBar";
import { SetPills } from "@/components/plp/SetPills";
import { CartBar } from "./StorefrontChrome";
import { FreeDeliveryDialog } from "./FreeDeliveryDialog";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * The order value that earns free delivery. A demo constant, not a catalog
 * field: no screengrab states the number and no product carries it, so it lives
 * in one place with its own name rather than as a bare `1000` in a condition.
 *
 * It is what makes this screen demonstrable: one set of the journey's tee is
 * 4 pieces at ₹360, so **the very first `+` clears it** — ₹1,440 — and the offer
 * fires without anyone having to hunt for the threshold.
 */
const FREE_DELIVERY_MIN = 1000;

/** Recovered, not measured — see `SubtotalBand`. */
const SUBTOTAL_GREEN = "#7fb681";

/**
 * The product detail screen, built 1:1 from the storefront screengrab
 * (2026-08-20) — the one the card's `VIEW DETAILS` opens.
 *
 * Three things about it are worth knowing before changing anything, all taken
 * from the screengrab rather than inferred:
 *
 * - **The app bar is titled by the brand**, `Zenifit`, not by the product. The
 *   product name is the first thing in the body instead.
 * - **Share is back.** The storefront bar carries no Share icon; this one does.
 *   The live app is inconsistent between two adjacent screens and both are
 *   reproduced as drawn.
 * - **`MRP/PC` is primary blue here** and grey on the listing card. Same figure,
 *   same app, two colours — again reproduced rather than harmonised.
 *
 * The set pills are the shared `SetPills`, so picking a pack re-prices this
 * screen exactly as it re-prices a card, and `SET CONTAINS` follows the pack.
 */
export function ProductDetail({
  product,
  homeHref = "/userjourney",
  cartBadge,
}: {
  product: Product;
  /**
   * Home, so the screen stays inside the variant that opened it — the same rule
   * `PlpScreen` and `HomeScreen` follow. It defaults to the journey because that
   * is the route this screen was built from; B and D pass their own.
   */
  homeHref?: string;
  /**
   * Basket count on the orders glyph. **No default**: the journey's 3 is its
   * screengrab's, so the journey route passes it, and B and D — which have no
   * basket — pass nothing and get no badge. A default of 3 here would be handed
   * straight back by `cartBadge={undefined}`, which is how the badge first
   * turned up on B.
   */
  cartBadge?: number;
}) {
  const [selected, setSelected] = useState(0);
  const variant = product.variants[selected];

  /**
   * The basket, such as it is: how many **sets** of the pack above are in it.
   * Lifted out of `Stepper` on 2026-08-21 — the cart bar, the subtotal band and
   * the offer dialog all read it, and a count private to the stepper could only
   * ever move its own number.
   */
  const [qty, setQty] = useState(0);
  const pieces = qty * variant.setOf;
  const lineTotal = pieces * variant.pricePerPc;

  const [offerOpen, setOfferOpen] = useState(false);
  /**
   * The previous line total, to spot the crossing rather than the state. The
   * dialog fires on **every upward crossing** (decided 2026-08-21), so stepping
   * back under the threshold and over it again congratulates you again — the
   * demoable reading of the two.
   */
  const lastTotal = useRef(0);

  const changeQty = (next: number) => {
    const clamped = Math.max(0, next);
    const total = clamped * variant.setOf * variant.pricePerPc;
    if (lastTotal.current < FREE_DELIVERY_MIN && total >= FREE_DELIVERY_MIN) {
      setOfferOpen(true);
    }
    lastTotal.current = total;
    setQty(clamped);
  };
  const cashback = product.cashback;
  const freeDelivery = product.offers.includes("Free Delivery");

  return (
    <div className="relative flex h-full flex-col bg-[#f7f7f7]">
      <div className="shrink-0">
        {/* Titled by the brand, per the screengrab. Home returns to the journey
            home so the route stays a closed loop, as A and B are. */}
        {/* The badge counts what this prototype's basket holds — nothing, then
            the one line you added. The route's `cartBadge` is the resting
            value; a basket of 3 that the bar's total doesn't include would make
            the two disagree the moment you add anything. */}
        <AppBar
          title={product.brand}
          homeHref={homeHref}
          cartBadge={qty > 0 ? 1 : cartBadge}
        />
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-[12px]">
        <p className="px-[14px] pt-[14px] text-[19px] leading-[24px] font-bold text-black">
          {product.title}
        </p>

        {/* Pills sit on the grey, above the gallery card — the reverse of the
            listing card, where they sit inside it under the price. */}
        <div className="px-[14px] pt-[12px]">
          <SetPills
            variants={product.variants}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="mt-[12px] bg-white pb-[12px]">
          <div className="relative">
            {cashback !== undefined && (
              <div className="absolute top-0 left-0 z-10 flex h-[22px] items-center gap-[5px] rounded-br-[8px] bg-[#fb9805] pr-[10px] pl-[8px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="h-[12px] w-[15px] object-contain" src="/offers/cashback.png" />
                <span className="text-[13px] font-bold whitespace-nowrap text-white">
                  {inr(cashback)} Cashback
                </span>
              </div>
            )}

            {/*
              The gallery. The screengrab shows a front and a back shot side by
              side, scrolling horizontally.

              **Only front renders exist.** The four tee images are crops out of
              the listing screengrabs, which show one view each, so the gallery
              carries a single image rather than repeating the front twice and
              labelling it a back view. Back renders would need exporting — the
              same ask already open for men's tees.

              `justify-center` for that reason: one portrait crop left-aligned in
              a 360px row read as a layout that had lost its second image, where
              centred reads as one image on purpose. It still scrolls, so a
              second render dropped in needs no change here.
            */}
            <div className="no-scrollbar flex justify-center gap-[8px] overflow-x-auto px-[14px] pt-[30px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.title}
                className="h-[240px] w-[186px] shrink-0 object-contain"
                src={product.image}
              />
            </div>
          </div>

          {(freeDelivery || cashback !== undefined) && (
            <div className="mt-[12px] flex flex-wrap items-center gap-[8px] px-[14px]">
              {freeDelivery && (
                <DetailPill icon="/offers/free-delivery.png" label="FREE DELIVERY" />
              )}
              {cashback !== undefined && (
                <DetailPill icon="/offers/cashback.png" label={`${inr(cashback)} Cashback`} />
              )}
            </div>
          )}
        </div>

        {/* The running total, once there is one. */}
        {qty > 0 && <SubtotalBand total={lineTotal} />}

        {/* The pricing card. */}
        <div className="mt-[12px] bg-white px-[14px] py-[14px]">
          <div className="flex items-baseline justify-between gap-[10px]">
            {/* Blue here, grey on the listing card — the app's own difference. */}
            <p className="text-[19px] font-bold text-primary">MRP/PC {inr(variant.mrp)}</p>
            <p className="text-[13px] font-medium text-muted">Set of:&nbsp; {variant.setOf}</p>
          </div>

          <div className="mt-[12px] h-px w-full bg-[#ebebeb]" />

          <div className="mt-[12px] flex items-start justify-between gap-[12px]">
            <div className="flex min-w-0 flex-col items-start">
              <p className="text-[11px] leading-none font-medium text-muted">PRICE/PC</p>
              <div className="mt-[7px] flex items-baseline gap-[8px]">
                <p className="text-[26px] leading-none font-medium whitespace-nowrap text-black">
                  {inr(variant.pricePerPc)}
                </p>
                <p className="text-[15px] whitespace-nowrap text-margin">
                  <span className="font-bold">{variant.marginPct}%</span>
                  <span className="font-normal"> margin</span>
                </p>
              </div>
            </div>

            {/*
              The quantity stepper. Orange circles either side of a boxed count,
              starting at 0 — the screengrab's own state.

              It is **live but local**: tapping it moves the number and nothing
              else. There is no basket in this prototype, so the cart bar's total
              stays the screengrab's fixed ₹717 rather than pretending to add up.
              A stepper that visibly did nothing would read as broken; one that
              changed a total we can't compute would be a lie.
            */}
            <Stepper qty={qty} onChange={changeQty} />
          </div>

          <p className="mt-[16px] text-[13px] text-muted">
            MIN ORDER:
            <span className="font-medium text-black">
              {" "}
              1 Set ( {variant.setOf} PC )
            </span>
          </p>
          <p className="mt-[8px] text-[13px] text-muted">
            SET CONTAINS:
            <span className="font-medium text-black"> {variant.sizeBreakup}</span>
          </p>
        </div>
      </div>

      {/*
        The basket bar, and the reason `SHOW_CART_BAR` doesn't gate it here: that
        constant hides a bar that could only print the screengrab's fixed ₹717,
        and this one prints a total it computed. It appears with the first set
        added and carries the line — one item, `price/pc × set size × qty`.

        The delivery line stays **`+ ₹0 DELIVERY CHARGES`** at every total, as
        both screengrabs have it (decided 2026-08-21). Crossing the threshold is
        announced by the dialog, not by a charge disappearing.
      */}
      {qty > 0 && <CartBar total={lineTotal} count={1} />}

      {offerOpen && <FreeDeliveryDialog onClose={() => setOfferOpen(false)} />}
    </div>
  );
}

/**
 * The green band above the pricing card — `SUBTOTAL` and the line's total.
 *
 * 8px in from both edges and 22px tall, measured off the screengrab. **The green
 * is recovered arithmetic, not a measurement**: the band only appears in a shot
 * where the offer dialog is up, so the scrim is over it. Solving the scrim from
 * the app bar, whose colour we know exactly (`#004FFA` reading back as
 * `rgb(7,49,140)`, so ~44% black), and inverting the band's `rgb(71,102,72)`
 * gives `#7fb681`. Worth replacing with a straight measurement off an undimmed
 * screengrab if one turns up.
 */
function SubtotalBand({ total }: { total: number }) {
  return (
    <div
      className="mt-[12px] mr-[8px] ml-[8px] flex h-[22px] items-center justify-between px-[10px]"
      style={{ backgroundColor: SUBTOTAL_GREEN }}
    >
      <span className="text-[13px] font-bold text-white">SUBTOTAL</span>
      <span className="text-[13px] font-bold text-white">{inr(total)}</span>
    </div>
  );
}

function DetailPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex h-[24px] shrink-0 items-center gap-[6px] rounded-[6px] border border-primary bg-white pr-[10px] pl-[7px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-[13px] w-[16px] object-contain" src={icon} />
      <span className="text-[12px] font-medium whitespace-nowrap text-primary">{label}</span>
    </span>
  );
}

function Stepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-[10px]">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        className="flex size-[32px] cursor-pointer items-center justify-center rounded-full border border-orange-500 text-[20px] leading-none text-orange-500"
      >
        −
      </button>
      <span className="flex h-[38px] w-[42px] items-center justify-center border border-[#dedede] text-[17px] text-black">
        {qty}
      </span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className="flex size-[32px] cursor-pointer items-center justify-center rounded-full border border-orange-500 text-[20px] leading-none text-orange-500"
      >
        +
      </button>
    </div>
  );
}
