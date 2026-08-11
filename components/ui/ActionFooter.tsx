"use client";

/**
 * The "Clear Filters" + primary action footer, shared by the Gender sheet and
 * the Filters screen. Figma: h-60, border-top #dedede, px-14 py-10; both
 * labels are Inter Medium 14/20.
 */
export function ActionFooter({
  primaryLabel,
  clearLabel = "Clear Filters",
  onPrimary,
  onClear,
  clearDisabled,
}: {
  primaryLabel: string;
  /** Defaults to the design's "Clear Filters"; the Gender sheet says "Clear all". */
  clearLabel?: string;
  onPrimary: () => void;
  onClear: () => void;
  clearDisabled?: boolean;
}) {
  return (
    <div className="flex h-[60px] w-full items-start justify-between border-t border-[#dedede] bg-white px-[14px] py-[10px]">
      <button
        onClick={onClear}
        disabled={clearDisabled}
        className="flex h-[40px] cursor-pointer items-center rounded-[999px] border border-[#dedede] bg-[#f7f7f7] px-[14px] font-ui text-[14px] leading-[20px] font-medium text-[#323232] disabled:opacity-40"
      >
        {clearLabel}
      </button>
      <button
        onClick={onPrimary}
        className="flex h-[40px] cursor-pointer items-center justify-center rounded-[24px] bg-primary px-[24px] font-ui text-[14px] leading-[20px] font-medium text-white"
      >
        {primaryLabel}
      </button>
    </div>
  );
}
