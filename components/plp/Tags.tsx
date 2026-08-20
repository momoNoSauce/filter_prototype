
/**
 * Figma 638:2788 — the BULK Offer pill. The icon is a crop out of a larger
 * sprite, so the original crop geometry is preserved rather than re-exported.
 *
 * **The label is 12px, not the frame's 10, and the pill 18px rather than 16**
 * (2026-08-20). These name the offer a retailer is being asked to act on, so
 * they are read rather than glanced at, and 10px is under any floor a guideline
 * defends. The pill grew by the 2px the type did — its `px-[4px]` inset and the
 * 11px sprite are untouched, so the shape is the frame's at a legible size.
 */
export function BulkOfferTag() {
  return (
    <span className="flex h-[18px] shrink-0 items-center gap-[4px] rounded-[4px] border-[0.5px] border-primary bg-white px-[4px]">
      <span className="relative size-[11px] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="absolute left-[-182.76%] top-[-3414.29%] h-[5085.71%] w-[2265.52%] max-w-none"
          src="/figma/icons/bulk-sprite.png"
        />
      </span>
      <span className="text-[12px] font-medium whitespace-nowrap text-primary">
        BULK Offer
      </span>
    </span>
  );
}

/** Anything beyond the two designed pills reuses the BULK Offer treatment. */
export function GenericOfferTag({ label }: { label: string }) {
  return (
    <span className="flex h-[18px] shrink-0 items-center rounded-[4px] border-[0.5px] border-[#58a159] bg-white px-[4px]">
      <span className="text-[12px] font-medium whitespace-nowrap text-[#58a159]">
        {label}
      </span>
    </span>
  );
}
