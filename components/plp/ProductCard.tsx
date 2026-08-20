"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { activeVariantIndex } from "@/lib/filters/activeVariant";
import { SetPills } from "./SetPills";
import { BulkOfferTag, GenericOfferTag } from "./Tags";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Figma 638:2768 — the PLP product card. */
export function ProductCard({ product, sizes }: { product: Product; sizes?: string[] }) {
  // Which pack the card opens on: pack #1 normally, and under a size filter
  // the first pack carrying a selected size — the same pack the engine ranked
  // this card by, so the price shown is the price it was sorted on.
  const auto = activeVariantIndex(product, sizes);

  // Picking a pack re-prices the card, per the selectable-variant decision.
  // A manual pick outranks the filter, but only until the filter moves the
  // answer: at that point the card is showing a pack the retailer no longer
  // asked for, and holding on to it would contradict the list it sits in.
  const [override, setOverride] = useState<number | null>(null);
  const [lastAuto, setLastAuto] = useState(auto);
  if (lastAuto !== auto) {
    setLastAuto(auto);
    setOverride(null);
  }

  const variantIndex = override ?? auto;
  const variant = product.variants[variantIndex];

  return (
    <div className="flex w-full shrink-0 flex-col items-start overflow-clip rounded-[12px] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.15)]">
      <div className="relative flex w-full flex-col items-start gap-[16px] bg-white px-[12px] pt-[24px] pb-[8px]">
        {product.bestSeller && (
          <div className="absolute top-0 left-0 flex h-[20px] items-center gap-[6px] rounded-br-[12px] bg-orange-400 px-[8px]">
            <p className="text-[12px] font-bold whitespace-nowrap text-white">Best Seller</p>
          </div>
        )}

        <div className="flex w-full items-center gap-[8px]">
          <div className="flex w-[110px] shrink-0 self-stretch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              width={110}
              height={114}
              className="w-[110px] self-center object-contain"
              src={product.image}
            />
          </div>

          {/* No `gap` on this column: the four rows sit at four different
              distances in the live app, and one uniform gap can only be wrong
              three times. Each row carries its own measured `mt-` instead. */}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* 16px line pitch, measured off consecutive title lines in the
                screengrab (373.3 → 389.3 → 405.3, exactly 16 apart). The
                default 1.5 gave 21px and spread a three-line title over 15
                extra pixels, which is most of why the card read looser than
                the app's. */}
            <p className="line-clamp-2 w-full text-[14px] leading-[16px] font-bold text-black">
              {product.title}
            </p>
            {/* `MRP/PC ₹299  |  SET of: 6` — the live app's own line
                (screengrab, 2026-08-14), replacing `MRP ₹390 Set Size 2pc`.
                Two things it fixes: the old line never said the MRP was per
                piece, though it always was, so it read as the pack price and
                made the margin look wrong; and the pipe separates two figures
                that used to run together as one phrase.

                The mixed case is the live app's, not a slip of ours — it sets
                `MRP/PC` upper and `SET of:` mixed. Reproduced rather than
                tidied, since matching the format is the point; one to raise
                with the designer along with the other card notes. */}
            <p className="mt-[5px] flex w-full items-center gap-[10px] text-[12px] leading-[16px] font-bold text-muted">
              <span>MRP/PC {inr(variant.mrp)}</span>
              <span className="font-normal opacity-60">|</span>
              <span>SET of: {variant.setOf}</span>
            </p>

            {/* The price block, rebuilt on 2026-08-14 from pixel measurements
                of the live app's screengrab rather than from the frame.

                The margin used to sit in its own `flex-1` column, which pushed
                it to the card's right edge — about 40px clear of the price, and
                bottom-aligned to a since-removed shipping line rather than to
                the price.
                Measured, the app sets it **10px** after the price and on the
                **same baseline**: price and margin ink bottoms land within
                0.3px of each other in both sampled cards, and the 10px gap is
                identical in both. So the two now share one `items-baseline`
                row, and the margin reads as a property of the price instead of
                a detached figure across the card.

                `items-baseline` rather than matched paddings: it holds at 26px
                against 14px whatever either becomes. */}
            <div className="mt-[15px] flex w-full flex-col items-start">
              {/* `PRICE/PC`, capitalised to match the live app's screengrab —
                  it was `Price/ pc`, with a stray space after the slash.
                  `leading-none` on both this and the price below: the measured
                  gap between them is 11.7px of clear space, and default leading
                  buries most of that inside the boxes where it can't be set. */}
              <p className="w-full text-[9px] leading-none font-bold text-muted">PRICE/PC</p>

              {/* No shipping-fee line under the price. It read `+₹50 shipping
                  fee`, was carried over from an earlier cut of the card, and
                  isn't a real charge — removed on request, 2026-08-20, which
                  also brings the card back in line with the live app's
                  screengrab, where no such line appears.

                  `variant.shippingFee` still exists and is still drawn. Its
                  `rand()` sits mid-sequence in the seed, so deleting it would
                  re-roll the entire catalog and move every documented count —
                  the same reason `packType` survived losing its filter and the
                  retired GOLD offer is still drawn and thrown away. Nothing
                  reads it now; price and margin never did.

                  The wrapper that held this line went with it, its `gap-[4px]`
                  having existed only to separate the two. The measurements that
                  matter are untouched: 7px from `PRICE/PC` to the price, and
                  the 10px baseline gap from price to margin. */}
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
        </div>

        {product.offers.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-[4px]">
            {product.offers.includes("Bulk Offer") && <BulkOfferTag />}
            {product.offers
              .filter((o) => o !== "Bulk Offer")
              .map((offer) => (
                <GenericOfferTag key={offer} label={offer} />
              ))}
          </div>
        )}

        <SetPills
          variants={product.variants}
          selected={variantIndex}
          onSelect={setOverride}
        />
      </div>

      <div className="flex h-[32px] w-full items-center justify-end gap-[8px] border-t-[0.5px] border-hairline bg-viewdetails px-[12px]">
        <p className="text-[12px] font-medium text-orange-500 underline">VIEW DETAILS</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-[8.446px] w-[5.015px]"
          src="/figma/icons/chevron.svg"
        />
      </div>
    </div>
  );
}
