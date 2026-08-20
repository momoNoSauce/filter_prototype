"use client";

/**
 * Figma 638:2836 — the bottom bar.
 * White, a -4px 4px 10% shadow, each item flex-1 with pt-4 pb-8.
 *
 * **Sort and Filters only** since 2026-08-19. The frame's first slot was
 * Gender and then briefly Category; Category now lives in the Filters rail
 * like every other facet, because a facet behind both a bar slot and a chip
 * kept raising questions this bar was the wrong place to answer — whether to
 * hide the slot once a vertical was picked, which control owned the count,
 * and what Clear Filters was allowed to touch. One control, one owner.
 *
 * It also leaves the two variants differing by nothing but where these two
 * controls sit, which is the only thing the A/B was meant to compare.
 *
 * The count badge is an addition — the frames give no way to tell a filtered
 * list from an unfiltered one, and a demo needs that legible. Sort holds at
 * most one value, so it gets a dot; Filters holds many, so it gets a count,
 * and that count now includes category.
 */
export function BottomActionBar({
  sortActive,
  filterCount,
  onSort,
  onFilters,
}: {
  sortActive: boolean;
  filterCount: number;
  onSort: () => void;
  onFilters: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-center gap-[18px] bg-white drop-shadow-[0px_-4px_4px_rgba(0,0,0,0.1)]">
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
          <span className="absolute -top-[4px] -right-[8px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-[4px] text-[11px] font-bold text-white">
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
