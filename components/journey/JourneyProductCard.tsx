"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { activeVariantIndex } from "@/lib/filters/activeVariant";
import { SetPills } from "@/components/plp/SetPills";
import { MaskIcon } from "@/components/ui/MaskIcon";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/**
 * The user journey's product card — rebuilt 1:1 from the storefront screengrabs
 * (2026-08-20), measured off the raw pixels at 1080×2400, which is exactly 3×
 * the 360px design so every device pixel divides cleanly.
 *
 * **Journey route only.** A, B, C and D keep the card they have. The two differ
 * in four ways, all present in the screengrab and none of them in ours:
 *
 * - an orange **cashback ribbon** breaking the top-left corner,
 * - a row of outlined **offer pills** under the price,
 * - `VIEW DETAILS` **blue** on a tinted strip rather than orange, and
 * - no `Best Seller` flag, the ribbon owning that corner instead.
 *
 * Keeping it separate rather than changing the shared card was the call on
 * 2026-08-20: the four variants are signed off and `CLAUDE.md` is explicit that
 * they must not drift in anything but where their controls sit. The cost is two
 * card designs in one prototype, which is the thing to watch.
 *
 * `SetPills` is imported unchanged — the shared pills already match the live app
 * exactly (`SET OF 6` over `M/2, L/2, XL/2`, 40px, filled when selected), that
 * having been measured off an earlier screengrab of the same app.
 */
export function JourneyProductCard({
  product,
  sizes,
}: {
  product: Product;
  sizes?: string[];
}) {
  // Same rule as the shared card: pack #1, or under a size filter the first
  // pack carrying a selected size — the pack the engine ranked this card by.
  const auto = activeVariantIndex(product, sizes);
  const [override, setOverride] = useState<number | null>(null);
  const [lastAuto, setLastAuto] = useState(auto);
  if (lastAuto !== auto) {
    setLastAuto(auto);
    setOverride(null);
  }

  const variantIndex = override ?? auto;
  const variant = product.variants[variantIndex];

  const cashback = product.cashback;
  const freeDelivery = product.offers.includes("Free Delivery");

  return (
    <div className="w-full shrink-0 overflow-hidden rounded-[12px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.10)]">
      <div className="relative flex w-full flex-col items-start px-[12px] pt-[12px] pb-[10px]">
        {/*
          The cashback ribbon. Measured 20px tall in `#fb9805`, sitting flush
          into the card's top-left corner with an 8px radius on its inner
          corner only — `overflow-hidden` on the card squares off the two outer
          edges against the card's own 12px radius, which is what the screengrab
          shows. It replaces the shared card's `Best Seller` flag, that corner
          having one occupant.
        */}
        {cashback !== undefined && (
          <div className="absolute top-0 left-0 flex h-[20px] items-center gap-[5px] rounded-br-[8px] bg-[#fb9805] pr-[10px] pl-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="h-[11px] w-[14px] object-contain" src="/offers/cashback.png" />
            <span className="text-[12px] font-bold whitespace-nowrap text-white">
              {inr(cashback)} Cashback
            </span>
          </div>
        )}

        <div className="mt-[14px] flex w-full items-start gap-[10px]">
          {/* The tee renders are 276×360 crops out of the screengrabs, so they
              carry the app's own white surround; `object-contain` keeps that
              rather than cropping into the garment. */}
          <div className="flex w-[92px] shrink-0 self-stretch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              width={92}
              height={120}
              className="w-[92px] self-start object-contain"
              src={product.image}
            />
          </div>

          {/* No uniform `gap`: as on the shared card, the rows sit at different
              measured distances and one gap can only be right once. */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Three lines here, not two — the screengrab's titles all run to
                three and the fourth-line clamp is what the app shows. */}
            <p className="line-clamp-3 w-full text-[14px] leading-[17px] font-bold text-black">
              {product.title}
            </p>
            <p className="mt-[6px] flex w-full items-center gap-[10px] text-[12px] leading-[16px] font-medium text-muted">
              <span>MRP/PC {inr(variant.mrp)}</span>
              <span className="font-normal opacity-60">|</span>
              {/* `Set of:` title case with the double space after the colon —
                  both the live app's, reproduced rather than tidied. Note the
                  shared card sets `SET of:` from an older screengrab of the same
                  screen, so the app is inconsistent with itself here. */}
              <span>Set of:&nbsp; {variant.setOf}</span>
            </p>

            <p className="mt-[14px] w-full text-[10px] leading-none font-medium text-muted">
              PRICE/PC
            </p>
            <div className="mt-[7px] flex w-full items-baseline gap-[10px]">
              <p className="shrink-0 text-[26px] leading-none font-medium whitespace-nowrap text-black">
                {inr(variant.pricePerPc)}
              </p>
              <p className="text-[14px] whitespace-nowrap text-margin">
                <span className="font-bold">{variant.marginPct}%</span>
                <span className="font-normal"> margin</span>
              </p>
            </div>
          </div>
        </div>

        {/*
          The offer pills. Measured 20px tall with a 1px `#0066ff` border — the
          same off-brand blue the margin figure uses, and the same slip class as
          `#014ffa`; the `primary` token is used instead, indistinguishable at
          this size and on-brand. Insets are 12px from the card edge, matching
          the card's own padding.
        */}
        {(freeDelivery || cashback !== undefined) && (
          <div className="mt-[12px] flex w-full flex-wrap items-center gap-[8px]">
            {freeDelivery && (
              <OfferPill icon="/offers/free-delivery.png" label="FREE DELIVERY" />
            )}
            {cashback !== undefined && (
              <OfferPill icon="/offers/cashback.png" label={`${inr(cashback)} Cashback`} />
            )}
          </div>
        )}

        <div className="mt-[12px] w-full">
          <SetPills
            variants={product.variants}
            selected={variantIndex}
            onSelect={setOverride}
          />
        </div>
      </div>

      {/*
        `VIEW DETAILS` is **blue** here, on a `#f5f8ff` strip 35px tall above a
        1px `#ebebeb` rule — all three measured. The shared card renders it
        orange `#FF7711`, which has been the worst contrast on that card at
        2.53:1; the live app's blue clears AA, so building this route 1:1 closes
        that failure here. It stays open on A–D, which still use the orange.

        It navigates as of 2026-08-20, the product-detail screengrab having
        arrived. **The whole strip is the target**, not the words alone: the
        screengrab gives no narrower hit area, and 12px of label sits under the
        touch floor by itself.
      */}
      <Link
        href={`/userjourney/product/${product.id}`}
        className="flex h-[35px] w-full items-center justify-end gap-[8px] border-t border-[#ebebeb] bg-[#f5f8ff] px-[12px]"
      >
        <p className="text-[12px] font-medium text-primary underline">VIEW DETAILS</p>
        {/* The exported chevron is orange, for the shared card's orange label.
            `MaskIcon` reads only the alpha channel, so the same untouched asset
            tints to primary here — the same route the Sort sheet's glyphs take.
            A CSS `filter` was tried first and came out teal, which is precisely
            why `MaskIcon` exists rather than a hue rotation. */}
        <MaskIcon
          src="/figma/icons/chevron.svg"
          className="h-[10px] w-[6px] shrink-0"
          color="var(--color-primary)"
        />
      </Link>
    </div>
  );
}

/** One outlined offer pill — 20px, 1px primary border, icon then label. */
function OfferPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex h-[20px] shrink-0 items-center gap-[5px] rounded-[6px] border border-primary bg-white pr-[8px] pl-[6px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-[11px] w-[14px] object-contain" src={icon} />
      <span className="text-[11px] font-medium whitespace-nowrap text-primary">
        {label}
      </span>
    </span>
  );
}
