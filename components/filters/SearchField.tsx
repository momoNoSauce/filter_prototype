"use client";

/** Figma 644:3742 — sticky search field above a facet's options. */
export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex w-full items-center bg-white px-[16px] pt-[10px] pb-[14px]">
      <div className="flex h-[31.903px] min-w-0 flex-1 items-center gap-[8px] overflow-clip rounded-[25.7px] bg-white/80 px-[12px] py-[8px] shadow-[0px_0px_2px_2px_rgba(0,0,0,0.07)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-[10.633px] w-[10.635px] shrink-0"
          src="/figma/icons/search-sm.svg"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-[14px] font-normal text-black outline-none placeholder:text-black"
        />
      </div>
    </div>
  );
}
