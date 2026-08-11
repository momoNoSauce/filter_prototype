"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

/**
 * The bottom-sheet shell shared by Sort and Gender.
 * Figma: scrim rgba(0,0,0,0.4), sheet rounded-t-8 with a -4px 8px 25% shadow,
 * header p-14 with a 22px Roboto Medium title and a 15px close glyph.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="animate-sheet-in relative w-full rounded-t-[8px] bg-white drop-shadow-[0px_-4px_8px_rgba(0,0,0,0.25)]">
        <div className="flex w-full items-center justify-between p-[14px]">
          <p className="text-[22px] font-medium text-black">{title}</p>
          <button
            aria-label="Close"
            className="block size-[15px] shrink-0 cursor-pointer"
            onClick={onClose}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="size-full" src="/figma/icons/close.svg" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}

/**
 * A 48px sheet row: 24px icon, 16px label, optional trailing check.
 *
 * Selection changes three things together — the label goes Roboto Bold, the
 * label goes primary, and the icon tints to primary. Figma bakes the last one
 * into the assets: the active Sort row's TrendUp exports as fill #014FFA while
 * every other icon exports black.
 *
 * `renderIcon` receives the colour the icon should paint at.
 */
export function SheetRow({
  renderIcon,
  label,
  selected,
  onClick,
  last,
}: {
  renderIcon: (color: string) => ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  last?: boolean;
}) {
  const iconColor = selected ? "var(--color-primary)" : "#000000";

  return (
    <>
      <button
        className="flex h-[48px] w-full cursor-pointer items-center justify-between px-[16px]"
        onClick={onClick}
        aria-pressed={selected}
      >
        <span className="flex items-center gap-[8px]">
          <span className="relative size-[24px] shrink-0">{renderIcon(iconColor)}</span>
          <span
            className={`text-left text-[16px] ${
              selected ? "font-bold text-primary" : "font-normal text-[#323232]"
            }`}
          >
            {label}
          </span>
        </span>
        {selected && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="size-[24px]" src="/figma/icons/check.svg" />
        )}
      </button>
      {!last && <Divider />}
    </>
  );
}

/**
 * Figma: a 1px #D9D9D9 rule inset 16px on both sides.
 * `self-stretch` is load-bearing — the sheet lists use `items-start`, which
 * would otherwise collapse an empty div to zero width and hide the rule.
 */
export function Divider() {
  return <div className="mx-[16px] h-px self-stretch bg-[#d9d9d9]" />;
}
