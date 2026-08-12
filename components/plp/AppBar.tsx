"use client";

import { useRouter } from "next/navigation";

/**
 * Figma 638:2739 — h-56, bg primary, px-16, gap-12, 20px Roboto Medium title.
 *
 * `homeHref` keeps the home button inside the current variant; hardcoding "/"
 * would silently drop a Variant B session back into Variant A.
 */
export function AppBar({ title, homeHref = "/" }: { title: string; homeHref?: string }) {
  const router = useRouter();

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
        <button
          aria-label="Home"
          onClick={() => router.push(homeHref)}
          className="h-[19.365px] w-[19px] shrink-0 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full" src="/figma/icons/home.svg" />
        </button>
        <p className="truncate text-[20px] font-medium text-white">{title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-[12px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Search" className="size-[22px]" src="/figma/icons/search.svg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Share" className="size-[24px]" src="/figma/icons/share.svg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Orders" className="h-[23px] w-[24px]" src="/figma/icons/orders.svg" />
      </div>
    </div>
  );
}
