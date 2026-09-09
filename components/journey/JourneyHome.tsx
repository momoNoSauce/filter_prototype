import Link from "next/link";
import { MicFab } from "@/components/ui/MicFab";

/**
 * The journey's home screen, rebuilt from the live app's screengrab.
 *
 * **The whole screen is now built** (2026-08-20). *Order Again* and *Top Brands*
 * spent a day as labelled stubs, on the reasoning that the journey only needs
 * the banner to work; they are now the screengrab's own two rails, because a
 * home screen half-drawn reads as unfinished whatever the label says. They stay
 * **inert** — the products are the live app's and match nothing in this
 * prototype's catalog — so the banner is still the only thing here that goes
 * anywhere.
 *
 * Everything below the blue is measured off the screengrab at 3× and verified by
 * re-measuring our own render the same way: card boxes and the two rails' insets
 * land within a pixel, and the whole stack sits ~4px lower only because the blue
 * block above it is 4px taller than the live app's.
 *
 * The page is **`#f7f7f7`, not white** — the blue recedes into grey, and the
 * cards are the only white below it.
 *
 * All the header glyphs are crops from the screengrab, as are the two section
 * icons, the two *Order Again* photos and the Magic Fit tile. Each is cropped
 * *with* its background rather than keyed out, which also keeps the blue bar's
 * orange accents — the logo's arc and the bell's dot — exactly as drawn. Nothing
 * here is redrawn.
 *
 * **No caller since 2026-09-09**, when `/userjourney` was asked to open on the
 * storefront and became a redirect to it. Kept rather than deleted, the way
 * `TileGrid` is: the banner is the journey's documented first beat and this is
 * the only build of it, so restoring the beat is one `return <JourneyHome />`
 * in `app/userjourney/page.tsx` rather than a re-measure off the screengrab.
 */
export function JourneyHome() {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-[#f7f7f7]">
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

      <div className="flex flex-1 flex-col pt-[40px] pb-[20px]">
        <SectionHeader
          icon="/journey/icons/order-again.png"
          iconClassName="h-[24px] w-[30px]"
          title="Order Again"
        />
        {/* 15px inset, 20px between cards — measured, and the same pitch the
            brand rail runs at even though its cards are wider. */}
        <div className="mt-[15px] flex items-stretch gap-[20px] overflow-x-hidden pl-[15px]">
          {ORDER_AGAIN.map((item) => (
            <OrderAgainCard key={item.image} {...item} />
          ))}
          <PeekCard className="h-[155px] w-[148px] rounded-[6px] bg-white" />
        </div>

        {/* 35px between the sections, measured card bottom to glyph top. */}
        <SectionHeader
          className="mt-[35px]"
          icon="/journey/icons/top-brands.png"
          iconClassName="size-[23px]"
          title="Top Brands"
        />
        <div className="mt-[19px] flex items-stretch gap-[12px] overflow-x-hidden pl-[11px]">
          {TOP_BRANDS.map((brand) => (
            <BrandCard key={brand.name} {...brand} />
          ))}
          <PeekCard className="h-[159px] w-[156px] rounded-[6px] border border-[#dfdfdf] bg-white" />
        </div>
      </div>

      {/* The floating mic. Shared with every listing since 2026-08-20, and
          re-measured in the move — see `MicFab`. */}
      <MicFab />
    </div>
  );
}

/**
 * A section heading — glyph, then the name, both measured off the screengrab.
 *
 * The glyph sits in a fixed 30px slot so both headings set their title at the
 * same 48px, although the two icons are different sizes (30×24 and 23×23). Both
 * are crops of the screengrab on its own `#f7f7f7`, like the header glyphs
 * above: nothing here is redrawn.
 */
function SectionHeader({
  icon,
  iconClassName,
  title,
  className = "",
}: {
  icon: string;
  iconClassName: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[8px] pl-[10px] ${className}`}>
      <span className="flex h-[24px] w-[30px] shrink-0 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className={iconClassName} src={icon} />
      </span>
      <p className="text-[16px] leading-[20px] font-bold text-black">{title}</p>
    </div>
  );
}

/**
 * The two *Order Again* cards, read straight off the screengrab — same title on
 * both, which is the live app's own data and not a copy-paste here.
 *
 * The photos are crops, and they are **different widths** (77px and 67px): the
 * card fixes the image's height at 89px and lets the width follow the aspect,
 * centred in the white above the title.
 */
const ORDER_AGAIN = [
  {
    image: "/journey/home/order-again-1.png",
    width: 77,
    title: "Magic Fit Men's Polyester Full Sleeves Solid T-Shirt",
    margin: "63.2%",
  },
  {
    image: "/journey/home/order-again-2.png",
    width: 67,
    title: "Magic Fit Men's Polyester Full Sleeves Solid T-Shirt",
    margin: "47.4%",
  },
];

/**
 * *Top Brands*. **Only Magic Fit's tile could be recovered.**
 *
 * The screengrab's second tile is Rangmayee, and the floating mic sits over its
 * right quarter — taking the last letter of the wordmark and the tail of the
 * tagline with it. So it gets the `#d9d9d9` placeholder this repo already uses
 * for brand tiles it has no art for, rather than a crop with a hole in it or a
 * hand-set imitation of somebody's logo. A supplied logo file drops straight in.
 */
const TOP_BRANDS = [
  { name: "Magic Fit", image: "/journey/home/brand-magic-fit.png" },
  { name: "Rangmayee", image: null },
];

/**
 * One *Order Again* card: photo flush to the top edge, two-line title, hairline,
 * then the margin line.
 *
 * Every number is measured off the screengrab at 3× — 148px wide, 6px radius,
 * an 89px image band, a 12px title on a 14px pitch, and `Margin` at 11px beside
 * its 13px value, sharing a baseline. Inert, like `More info ›`: these are the
 * live app's own products and nothing in this prototype's catalog matches them.
 */
function OrderAgainCard({
  image,
  width,
  title,
  margin,
}: {
  image: string;
  width: number;
  title: string;
  margin: string;
}) {
  return (
    <div className="flex w-[148px] shrink-0 flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="mx-auto block h-[89px] shrink-0 object-contain"
        src={image}
        style={{ width }}
      />
      {/* Reserved height on the wrapper, clamp on the inner span — the two on
          one element and the explicit height wins, cropping a third line
          mid-glyph instead of ellipsising it. */}
      <div className="mt-[8px] h-[28px] px-[8px]">
        <p className="line-clamp-2 text-[12px] leading-[14px] text-black">{title}</p>
      </div>
      <div className="mx-[8px] mt-[6px] h-px bg-[#dfdfdf]" />
      {/* Explicit 15px leading, not the default: with two sizes on one baseline
          the line box grows to fit both and the card ran 6px past the measured
          155px. */}
      <div className="mt-[6px] flex items-baseline gap-[4px] px-[8px] pb-[2px]">
        {/* The screengrab measures this grey at #a1a1a1, which is 2.2:1 on
            white. Set in the app's `muted` instead, which is the same slip the
            product card's own greys were corrected for. */}
        <span className="text-[11px] leading-[15px] text-muted">Margin</span>
        <span className="text-[13px] leading-[15px] text-primary">{margin}</span>
      </div>
    </div>
  );
}

/**
 * One *Top Brands* tile: the logo band, then the name centred beneath it.
 *
 * The screengrab cuts the card off at the screen edge — its label is clipped
 * mid-descender — so only the 19px above the name is measured. The gap below it
 * mirrors that rather than being invented, which puts the card at 159px.
 */
function BrandCard({ name, image }: { name: string; image: string | null }) {
  return (
    <div className="flex w-[156px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-[#dfdfdf] bg-white">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="block h-[101px] w-full object-cover" src={image} />
      ) : (
        <div className="h-[101px] w-full bg-[#d9d9d9]" />
      )}
      <p className="py-[19px] text-center text-[15px] leading-[18px] text-black">{name}</p>
    </div>
  );
}

/**
 * The sliver of a further card at the right edge of a rail.
 *
 * Both rails show one in the screengrab, and both are empty here for the reason
 * the banner's second slide is: it is decoration, and inventing a third product
 * or a third brand would be inventing data. The rails are `overflow-x-hidden`
 * for the same reason — a peek you can scroll to and find blank reads as a bug,
 * where one you can't reads as the carousel it is standing in for.
 */
function PeekCard({ className }: { className: string }) {
  return <div className={`shrink-0 ${className}`} aria-hidden />;
}
