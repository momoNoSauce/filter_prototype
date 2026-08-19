import Link from "next/link";
import { getCatalog } from "@/lib/catalog/products";
import { SELLERS } from "@/lib/catalog/seed";

/**
 * Figma 628:1620 — the SOLV home screen. It gives the journey a real starting
 * point: tap "Baheti Garments" to land on the seller PLP.
 *
 * `basePath` keeps the whole journey inside one variant — the seller cards
 * link to /seller/…, /b/seller/…, /c/seller/… or /d/seller/…, so someone handed
 * a variant's link never falls back into another halfway through.
 *
 * The design's third seller card is "Pawan footwear", which has no catalog
 * behind it, so Grasim Fabrics takes that slot and every card here navigates
 * somewhere real.
 */
const FEATURED = [
  { id: "baheti", image: "/figma/home/seller-baheti.png", orders: "9k+", badge: "₹signal" },
  { id: "jalandhar", image: "/figma/home/seller-jalandhar.png", orders: "2k+" },
  { id: "grasim", image: "/figma/home/seller-pawan.png", orders: "12k+" },
];

const CAROUSEL = [1, 2, 3, 4, 5].map((n) => `/figma/home/carousel-${n}.png`);

export function HomeScreen({ basePath = "" }: { basePath?: "" | "/b" | "/c" | "/d" }) {
  const catalog = getCatalog();

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-page">
      {/* Blue header block: nav, search, hero, carousel */}
      <div className="bg-primary">
        <div className="flex h-[48px] items-center gap-[12px] px-[16px]">
          <span className="flex w-[16px] shrink-0 flex-col gap-[3px]">
            <span className="h-[2px] w-full rounded-full bg-white" />
            <span className="h-[2px] w-full rounded-full bg-white" />
            <span className="h-[2px] w-full rounded-full bg-white" />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="SOLV" className="h-[18px]" src="/figma/home/solv-logo.svg" />
          <span className="flex-1" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-[22px]" src="/figma/home/bell.svg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-[23px] w-[24px]" src="/figma/icons/orders.svg" />
        </div>

        <div className="px-[16px] pb-[12px]">
          <div className="flex h-[40px] items-center gap-[10px] rounded-[100px] bg-[#3d78ff] px-[14px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="size-[16px] shrink-0" src="/figma/home/search.svg" />
            <span className="flex-1 text-[14px] text-white/90">
              Search for &lsquo;kurtas&rsquo;
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="size-[16px] shrink-0 object-contain"
              src="/figma/icons/microphone.png"
            />
          </div>
        </div>

        {/* Hero banner */}
        <div className="relative h-[90px] overflow-clip">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="absolute top-[-3px] left-[63px] h-[82px] w-[84px] object-contain"
            src="/figma/home/ganesh.png"
          />
          <p className="absolute top-[9px] left-[170px] text-[19.024px] leading-[19px] font-bold text-[#fff6ab]">
            Extra 5% off on
            <br />
            Ethnic wear
          </p>
          <span className="absolute top-[54px] left-[196px] flex h-[16px] w-[76px] items-center justify-center gap-[2px] rounded-[40px] bg-[linear-gradient(to_bottom,#ef6020,#d62926)] px-[8px] text-[9.71px] font-bold text-[#fdfdff]">
            Order Now <span>▸</span>
          </span>
        </div>

        {/* Promo carousel */}
        <div className="no-scrollbar flex gap-[12px] overflow-x-auto px-[56px]">
          {CAROUSEL.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              alt=""
              className="h-[124px] w-[248px] shrink-0 rounded-[4px] object-cover"
              src={src}
            />
          ))}
        </div>
        <div className="flex justify-center py-[8px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-[9.09px] w-[46.083px]" src="/figma/home/dots.svg" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="block w-full" src="/figma/home/wave-top.svg" />
      </div>

      {/* Activate-account card */}
      <div className="bg-[linear-gradient(to_right,var(--color-primary),var(--color-primary-subtle))] px-[8px] pt-[8px] pb-[16px]">
        <div className="flex h-[50px] w-full items-center gap-[16px] rounded-[8px] bg-white px-[16px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-[24px] shrink-0" src="/figma/home/doc.svg" />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="text-[12.407px] text-black">Activate your account!</p>
            <p className="truncate text-[10.634px] text-[#656565]">
              Complete verification and start ordering from Solv!
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[20px] px-[12px] pt-[16px] pb-[24px]">
        <Section icon="/figma/home/sellers-icon.svg" title="Sellers you bought from">
          {FEATURED.map((featured) => {
            const seller = SELLERS.find((s) => s.id === featured.id)!;
            const count =
              featured.id === "baheti"
                ? catalog.length
                : catalog.filter((p) => p.sellerId === featured.id).length;

            return (
              <Link
                key={featured.id}
                href={`${basePath}/seller/${featured.id}`}
                className="relative flex w-[152px] shrink-0 flex-col drop-shadow-[0px_2px_1.5px_rgba(0,0,0,0.16)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-[101px] w-full rounded-t-[8px] border-[0.2px] border-[#979797] object-cover"
                  src={featured.image}
                />
                <div className="flex h-[47px] w-full flex-col items-center justify-center rounded-b-[8px] border-[0.2px] border-[#979797] bg-white px-[6px] text-center">
                  <p className="w-full truncate text-[15px] leading-[18px] font-medium text-heading">
                    {seller.name}
                  </p>
                  <p className="w-full truncate text-[11px] leading-[18px] text-muted">
                    {count.toLocaleString("en-IN")} products | {featured.orders} orders
                  </p>
                </div>
                {featured.badge && (
                  <span className="absolute top-[6px] left-[6px] rounded-[4px] bg-orange-500 px-[8px] py-[2px] text-[10px] text-white">
                    {featured.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </Section>

        <Section icon="/figma/home/gift-icon.svg" title="Schemes &amp; Contests">
          {[
            { src: "/figma/home/scheme-1.png", label: "Earn More" },
            { src: "/figma/home/scheme-2.png", label: "Win Big" },
          ].map((scheme) => (
            <div
              key={scheme.src}
              className="flex w-[152px] shrink-0 flex-col drop-shadow-[0px_2px_1.5px_rgba(0,0,0,0.16)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="h-[101px] w-full rounded-t-[8px] object-cover"
                src={scheme.src}
              />
              <div className="flex h-[35px] w-full items-center justify-center rounded-b-[8px] bg-white">
                <p className="text-[16px] font-medium text-black">{scheme.label}</p>
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-center gap-[8px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="h-[20px] w-[17.557px]" src={icon} />
        <p className="text-[16px] leading-[1.2] font-semibold tracking-[0.0608px] text-heading">
          {title}
        </p>
      </div>
      <div className="no-scrollbar flex gap-[12px] overflow-x-auto pb-[4px]">{children}</div>
    </div>
  );
}
