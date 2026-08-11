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

          <div className="flex min-w-0 flex-1 flex-col items-start gap-[8px]">
            <p className="line-clamp-2 w-full text-[14px] font-bold text-black">
              {product.title}
            </p>
            <p className="w-full text-[12px] font-bold text-muted">
              MRP {inr(variant.mrp)} Set Size {variant.setOf}pc
            </p>

            <div className="flex w-full flex-col items-start gap-[8px]">
              <p className="w-full text-[9px] font-bold text-muted">Price/ pc</p>
              <div className="flex w-full items-end gap-[8px]">
                <div className="flex shrink-0 flex-col items-start gap-[4px]">
                  <p className="text-[26px] font-medium whitespace-nowrap text-black">
                    {inr(variant.pricePerPc)}
                  </p>
                  <p className="w-[88px] text-[9px] font-normal text-muted">
                    +{inr(variant.shippingFee)} shipping fee
                  </p>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start justify-end gap-[8px]">
                  <p className="text-[14px] whitespace-nowrap text-margin">
                    <span className="font-bold">{variant.marginPct}%</span>
                    <span className="font-normal"> margin</span>
                  </p>
                  {/* Present but invisible in the design — it reserves the
                      baseline so cards with and without a struck-through
                      margin line up. */}
                  <p className="w-full text-[9px] font-normal text-muted line-through opacity-0">
                    10.4% margin
                  </p>
                </div>
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
