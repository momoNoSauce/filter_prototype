"use client";

import { useEffect, useRef, useState } from "react";
import type { Variant } from "@/lib/catalog/types";

/**
 * The "SET OF 6 / M/2, L/2, XL/2" pills. Figma 638:2790 — h-40, px-16, py-4,
 * rounded-20; selected is filled primary, the rest are outlined. The wording
 * follows the live app rather than the frame — see the label comments below.
 *
 * The row scrolls horizontally and the dots below track scroll pages, which is
 * what the design's 4-pills-3-dots arrangement implies.
 *
 * It also scrolls itself to the selected pill. Under a size filter the card
 * opens on a pack that may sit past the right edge, and a card that silently
 * prices a pack you cannot see is worse than one that opens on the wrong pack.
 */
export function SetPills({
  variants,
  selected,
  onSelect,
}: {
  variants: Variant[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const measure = () => {
      const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      setPages(total);
      setPage(Math.round(el.scrollLeft / el.clientWidth));
    };

    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [variants.length]);

  // Deliberately not `scrollIntoView`: that walks up and scrolls every
  // ancestor container, so twenty mounting cards would each yank the PLP.
  // Setting `scrollLeft` moves this row and nothing else. Instant, not smooth,
  // for the same reason — twenty simultaneous animations on first paint.
  useEffect(() => {
    const el = scroller.current;
    const pill = el?.children[selected] as HTMLElement | undefined;
    if (!el || !pill) return;

    const left = pill.offsetLeft;
    const right = left + pill.offsetWidth;
    // A pill wider than the row can only show one end of itself. Show the
    // left one: the breakup reads left to right, and its set size is there.
    if (left < el.scrollLeft || pill.offsetWidth > el.clientWidth) el.scrollLeft = left;
    else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth;
  }, [selected]);

  return (
    <div className="flex w-full flex-col gap-[20px]">
      <div
        ref={scroller}
        // `relative` only so the pills' `offsetLeft` is measured against this
        // scroller — see the scroll-into-view effect. It changes no layout.
        className="no-scrollbar relative flex w-full items-center gap-[8px] overflow-x-auto text-center"
      >
        {variants.map((variant, index) => {
          const active = index === selected;
          return (
            <button
              key={`${variant.setOf}-${variant.sizeBreakup}`}
              onClick={() => onSelect(index)}
              aria-pressed={active}
              className={`flex h-[40px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-[20px] px-[16px] py-[4px] ${
                active
                  ? "bg-primary text-white"
                  : "border border-primary bg-white text-primary"
              }`}
            >
              {/* `SET OF 6` over `M/2, L/2, XL/2` — the live app's pill
                  (screengrab, 2026-08-14). Was `Set of 6`; the caps are the
                  app's, and they also hold the small top line apart from the
                  bold breakup under it. */}
              <span className="w-full text-[11px] font-medium whitespace-nowrap">
                SET OF {variant.setOf}
              </span>
              <span className="w-full text-[16px] font-bold whitespace-nowrap">
                {variant.sizeBreakup}
              </span>
            </button>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex w-full items-center justify-center gap-[4px]">
          {Array.from({ length: pages }, (_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              alt=""
              className="size-[8px]"
              src={i === page ? "/figma/icons/dot-active.svg" : "/figma/icons/dot-idle.svg"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
