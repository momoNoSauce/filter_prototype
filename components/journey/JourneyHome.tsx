import Link from "next/link";
import { MaskIcon } from "@/components/ui/MaskIcon";

/**
 * The journey's home screen, rebuilt from the live app's screengrab.
 *
 * **Built only as far as the journey needs it** (decision, 2026-08-20): the blue
 * header, the search field, the Kartik banner and the curved edge below it are
 * 1:1; *Order Again* and *Top Brands* are stubs below the fold. The journey's
 * first beat is "customer comes to the app, sees Kartik exporters, taps it", so
 * the banner is the only thing here that has to work — building two more
 * carousels nobody taps would be scenery.
 *
 * All five header glyphs are crops from the screengrab. Each sits on the blue,
 * so they are cropped *with* their background rather than keyed out, which also
 * keeps their orange accents — the logo's arc and the bell's dot — exactly as
 * drawn. Nothing here is redrawn.
 */
export function JourneyHome() {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-white">
      {/*
        The blue field. The screengrab curves its bottom edge into the white
        below — a shallow wave rising to the right. An inline SVG rather than a
        cropped image, because it has to span whatever width the frame is and a
        bitmap would either stretch or band.
      */}
      <div className="relative shrink-0 bg-primary pb-[22px]">
        <div className="flex h-[56px] w-full items-center gap-[12px] px-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Menu" className="size-[22px] shrink-0" src="/journey/icons/menu.png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-[24px] w-[21px] shrink-0" src="/journey/icons/solv.png" />
          <p className="min-w-0 flex-1 truncate text-[19px] font-bold text-white">
            Apparels &amp; Fashion
          </p>
          <span className="shrink-0 text-[14px] leading-none text-white">▾</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Alerts" className="h-[24px] w-[22px] shrink-0" src="/journey/icons/bell.png" />
          <span className="relative block size-[26px] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Orders" className="size-full" src="/figma/icons/orders.svg" />
            <span className="absolute -top-[5px] -right-[4px] flex size-[16px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              3
            </span>
          </span>
        </div>

        {/* The search field. The placeholder is the app's own — including
            `"Vanadana Sarees"`, which reads as a typo for Vandana and is set
            verbatim rather than corrected. */}
        <div className="mx-[10px] flex h-[44px] items-center gap-[8px] rounded-[22px] bg-white px-[12px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-[18px] shrink-0" src="/figma/icons/search-sm.svg" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-[#5a5a5a]">
            search for <span className="font-medium text-black">&ldquo;Vanadana Sarees&rdquo;</span>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-[18px] shrink-0" src="/journey/icons/camera.png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-[18px] w-[12px] shrink-0" src="/journey/icons/mic.png" />
        </div>

        {/*
          The banner carousel. One live banner and a sliver of the next, which is
          what the screengrab shows — the second is decoration, so it is an empty
          white card rather than invented artwork.

          **This is the journey's entry point**: the whole banner is the tap
          target, not just `Shop Now`, because the screengrab gives no separate
          hit area and a buyer aiming at the picture should still arrive.
        */}
        <div className="mt-[16px] flex items-stretch gap-[10px] overflow-x-hidden pl-[10px]">
          <Link
            href="/userjourney/seller/kartik"
            aria-label="Kartik exporters — up to 80% margin on T-shirts"
            className="block shrink-0 overflow-hidden rounded-[8px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              width={310}
              height={119}
              className="block h-[119px] w-[310px] object-cover"
              src="/journey/kartik-banner.png"
            />
          </Link>
          <div className="h-[119px] w-[40px] shrink-0 rounded-[8px] bg-white/95" />
        </div>

        <div className="mt-[12px] flex items-center justify-center gap-[6px]">
          <span className="size-[7px] rounded-full bg-white/45" />
          <span className="size-[7px] rounded-full bg-white" />
        </div>
      </div>

      {/* The wave. Sits directly under the blue block and is the same white as
          the page, so it reads as the blue receding rather than as a shape. */}
      <svg
        aria-hidden
        viewBox="0 0 360 16"
        preserveAspectRatio="none"
        className="-mt-[1px] block h-[16px] w-full shrink-0 text-primary"
      >
        {/* Measured off the screengrab: the boundary is nearly flat, dipping a
            few pixels left of centre and rising slightly to the right. An
            earlier, deeper curve read as a decorative shape rather than as the
            blue simply receding. */}
        <path d="M0 0h360v4c-60 9-140 12-230 7C80 8 40 9 0 11V0z" fill="currentColor" />
      </svg>

      <div className="flex flex-1 flex-col gap-[22px] px-[14px] pt-[18px] pb-[28px]">
        <StubSection
          icon="/figma/icons/orders.svg"
          title="Order Again"
          note="Reorder rail — out of scope for this prototype"
        />
        <StubSection
          icon="/figma/icons/tag.svg"
          title="Top Brands"
          note="Brand rail — out of scope for this prototype"
        />
      </div>

      {/* The floating mic, bottom right in both screengrabs. Inert. */}
      <div className="pointer-events-none absolute right-[16px] bottom-[18px] flex size-[54px] items-center justify-center rounded-full border-[3px] border-[#0b2f8a] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="h-[26px] w-[18px]" src="/figma/icons/microphone.png" />
      </div>
    </div>
  );
}

/**
 * A named placeholder for a home rail the journey doesn't use.
 *
 * It says what it is rather than faking two cards: a stub that looks like
 * content invites someone to tap it and read the silence as a bug, where a
 * labelled gap reads as a decision. Same reasoning as the `VIEW DETAILS` tap
 * being inert until there is a screengrab to build from.
 */
function StubSection({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <div className="flex items-center gap-[10px]">
        {/* Tinted, not <img>: `orders.svg` is white for the blue app bar and
            disappeared entirely on this white section. `MaskIcon` reads only the
            alpha channel, so both stub glyphs render dark from their untouched
            exports. */}
        <MaskIcon src={icon} className="size-[24px] shrink-0" color="#1a1c1f" />
        <p className="text-[19px] font-bold text-black">{title}</p>
      </div>
      <div className="flex h-[92px] w-full items-center justify-center rounded-[10px] border border-dashed border-[#d9d9d9] bg-[#fafafa] px-[12px]">
        <p className="text-center text-[12px] text-muted">{note}</p>
      </div>
    </div>
  );
}
