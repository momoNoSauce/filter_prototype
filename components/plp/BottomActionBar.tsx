"use client";

/**
 * Figma 638:2836 — the Gender / Sort / Filters bar.
 * White, a -4px 4px 10% shadow, each item flex-1 with pt-4 pb-8.
 *
 * The count badge is an addition: the frames give no way to tell a filtered
 * list from an unfiltered one, and a demo needs that legible.
 */
/**
 * Each control reports its own state, and only its own:
 * Gender and Sort hold at most one value each, so they get a dot; Filters can
 * hold many, so it gets a count. Gender is excluded from that count — it is
 * set from here, never from the Filters screen.
 */
export function BottomActionBar({
  genderActive,
  sortActive,
  filterCount,
  onGender,
  onSort,
  onFilters,
}: {
  genderActive: boolean;
  sortActive: boolean;
  filterCount: number;
  onGender: () => void;
  onSort: () => void;
  onFilters: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-center gap-[18px] bg-white drop-shadow-[0px_-4px_4px_rgba(0,0,0,0.1)]">
      <BarItem label="Gender" icon="/figma/icons/wc.svg" dot={genderActive} onClick={onGender} />
      <BarItem label="Sort" icon="/figma/icons/sort.svg" dot={sortActive} onClick={onSort} />
      <BarItem
        label="Filters"
        icon="/figma/icons/filter_alt.svg"
        badge={filterCount}
        onClick={onFilters}
      />
    </div>
  );
}

function BarItem({
  label,
  icon,
  badge,
  dot,
  onClick,
}: {
  label: string;
  icon: string;
  badge?: number;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-[4px] pt-[4px] pb-[8px]"
    >
      <span className="relative size-[24px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="size-full" src={icon} />
        {!!badge && (
          <span className="absolute -top-[4px] -right-[8px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-[4px] text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
        {dot && (
          <span className="absolute -top-[1px] -right-[3px] size-[8px] rounded-full bg-primary ring-2 ring-white" />
        )}
      </span>
      <span className="text-[16px] font-medium text-bar-label">{label}</span>
    </button>
  );
}
