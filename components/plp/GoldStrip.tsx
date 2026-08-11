/**
 * Figma 638:2719 — the GOLD membership strip.
 * h-50, purple gradient (#6909b8 → #9e1ea7 99.99% → #a922a3, bottom to top),
 * a 4px 2px 25% shadow, px-8.
 */
export function GoldStrip() {
  return (
    <div className="flex h-[50px] w-full items-center justify-between bg-[linear-gradient(to_top,#6909b8_0%,#9e1ea7_99.99%,#a922a3_100%)] px-[8px] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[4px] whitespace-nowrap">
        <div className="flex h-[18px] items-center gap-[4px] leading-[16.178px]">
          <p className="text-[16px] font-medium tracking-[0.048px] text-[#d4d4d4] line-through">
            ₹299
          </p>
          <p className="text-[24px] font-bold tracking-[0.072px] text-[#ffdb99]">₹99</p>
        </div>
        <p className="text-[10px] leading-[13px] font-medium text-white">Try for 1 month</p>
      </div>

      <button className="flex h-[33px] shrink-0 cursor-pointer items-center justify-center gap-[4px] rounded-[100px] border-2 border-[#6909b8] bg-white px-[16px] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.15)]">
        <span className="gold-text text-[14px] leading-[1.2] font-bold tracking-[0.0532px]">
          Join
        </span>
        <GoldGlyph className="size-[18px]" />
        <span className="text-[14px] leading-[1.2] tracking-[0.0532px] whitespace-nowrap">
          <span className="gold-text font-display">GOLD </span>
          <span className="gold-text font-bold">Membership</span>
        </span>
      </button>
    </div>
  );
}

/** The three-part GOLD mark, exported from Figma as separate vectors. */
export function GoldGlyph({ className }: { className?: string }) {
  return (
    <span className={`relative shrink-0 overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable @next/next/no-img-element */}
      <img
        alt=""
        className="absolute inset-[34.52%_6.32%_0.01%_50.13%] size-auto"
        src="/figma/icons/gold-a.svg"
      />
      <img
        alt=""
        className="absolute inset-[0_-0.02%_25.68%_19.93%]"
        src="/figma/icons/gold-b.svg"
      />
      <img
        alt=""
        className="absolute inset-[10%_18.7%_0_0]"
        src="/figma/icons/gold-c.svg"
      />
      {/* eslint-enable @next/next/no-img-element */}
    </span>
  );
}
