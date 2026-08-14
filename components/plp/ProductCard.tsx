"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { SetPills } from "./SetPills";
import { BulkOfferTag, GenericOfferTag, GoldSchemeTag } from "./Tags";

const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Figma 638:2768 — the PLP product card. */
export function ProductCard({ product }: { product: Product }) {
  // Picking a pack re-prices the card, per the selectable-variant decision.
  const [variantIndex, setVariantIndex] = useState(0);
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
                bottom-aligned to the shipping line rather than to the price.
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

              <div className="mt-[7px] flex w-full flex-col items-start gap-[4px]">
                <div className="flex w-full items-baseline gap-[10px]">
                  <p className="shrink-0 text-[26px] leading-none font-medium whitespace-nowrap text-black">
                    {inr(variant.pricePerPc)}
                  </p>
                  <p className="text-[14px] whitespace-nowrap text-margin">
                    <span className="font-bold">{variant.marginPct}%</span>
                    <span className="font-normal"> margin</span>
                  </p>
                </div>
                {/* Kept, though the screengrab has no such line: it is real
                    per-order cost the seed carries, and dropping information to
                    match a screenshot is the designer's call, not this pass's.
                    It sits under the price, where the old column had it. */}
                <p className="text-[9px] font-normal text-muted">
                  +{inr(variant.shippingFee)} shipping fee
                </p>
              </div>
            </div>
          </div>
        </div>

        {product.offers.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-[4px]">
            {product.offers.includes("GOLD Target Scheme") && <GoldSchemeTag />}
            {product.offers.includes("Bulk Offer") && <BulkOfferTag />}
            {product.offers
              .filter((o) => o !== "GOLD Target Scheme" && o !== "Bulk Offer")
              .map((offer) => (
                <GenericOfferTag key={offer} label={offer} />
              ))}
          </div>
        )}

        <SetPills
          variants={product.variants}
          selected={variantIndex}
          onSelect={setVariantIndex}
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
