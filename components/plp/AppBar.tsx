"use client";

import { useRouter } from "next/navigation";

/**
 * Figma 638:2739 — h-56, bg primary, px-16, gap-12, 20px Roboto Medium title.
 *
 * `homeHref` keeps the home button inside the current variant; hardcoding "/"
 * would silently drop a Variant B session back into Variant A.
 *
 * **`homeHref: null` drops the button**, for the vertical-scoped variants C
 * and D. They have no home of their own, so every candidate href leads out of
 * the variant — which is the leak the prop exists to prevent, not a use of it.
 * Back is the way out there, deliberately.
 *
 * That also buys the title 36px, which it needs: the frame's 20px was sized
 * for a seller name, and these pages are titled by category. *Men's Casual
 * T-Shirts* measures 191px against the 157px the full bar leaves. Dropping the
 * home button and stepping to 18px puts it at 172px in 193px — the two
 * changes travel together because one alone doesn't fit.
 */
export function AppBar({
  title,
  homeHref = "/",
  showShare = true,
  cartBadge,
}: {
  title: string;
  homeHref?: string | null;
  /**
   * The user journey's storefront bar has no Share icon — the screengrab of the
   * live app doesn't carry one there. Dropping it also gives the title back
   * 36px, which `KARTIK EXPORTERS` needs: at 20px it truncated to
   * `KARTIK EXPOR…` with Share in place.
   */
  showShare?: boolean;
  /** Basket count on the orders glyph, as the live app shows it. */
  cartBadge?: number;
}) {
  const router = useRouter();
  const compact = homeHref === null;

  return (
    <div className="flex h-[56px] w-full items-center gap-[12px] bg-primary px-[16px]">
      <div className="flex min-w-0 flex-1 items-center gap-[12px]">
        <button
          aria-label="Back"
          onClick={() => router.back()}
          className="h-[21.354px] w-[22.48px] shrink-0 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full" src="/figma/icons/back.svg" />
        </button>
        {!compact && (
          <button
            aria-label="Home"
            onClick={() => router.push(homeHref)}
            className="h-[19.365px] w-[19px] shrink-0 cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="size-full" src="/figma/icons/home.svg" />
          </button>
        )}
        <p
          className={`truncate font-medium text-white ${
            compact ? "text-[18px]" : "text-[20px]"
          }`}
        >
          {title}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-[12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Search" className="size-[22px]" src="/figma/icons/search.svg" />
        {showShare && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Share" className="size-[24px]" src="/figma/icons/share.svg" />
        )}
        <span className="relative block h-[23px] w-[24px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Orders" className="size-full" src="/figma/icons/orders.svg" />
          {cartBadge !== undefined && (
            <span className="absolute -top-[6px] -right-[6px] flex size-[16px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {cartBadge}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
