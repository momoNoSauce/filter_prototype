"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RECENT_SEARCHES, suggestionsFor } from "@/lib/catalog/search";

/**
 * The SOLV search screen, from two screengrabs at 1080×2400 — exactly 3× the
 * design, so every number below was measured off the raw pixels.
 *
 * It replaces *Baheti Garments* as the way into the listing for variants A and
 * B (2026-08-25). Tapping a seller card was never how a buyer reaches a mixed
 * catalog; typing `shirt` is. The scope is identical either way — `shirt`
 * matches all 1,070 products, every category being a Shirt or a T-Shirt — so
 * the filter demo behind it is unchanged and every documented count still
 * holds. See `searchProducts`.
 *
 * **Two states, and only the leading glyph and the field's trailing control
 * differ.** Empty: history rows under a `Type to search` placeholder. Typed:
 * the same rows become autocomplete, the history glyph becomes a magnifier, and
 * a ✕ appears in the field. One row component, one flag.
 *
 * Measured, in design px:
 *
 * | | |
 * |---|---|
 * | blue bar | 47 high, `#004FFA` |
 * | back arrow | 15 wide, 14 from the left |
 * | field | 31 high, pill, 221 wide at a 360 frame |
 * | rows | 50 high, 1px `#ebebeb` divider |
 * | leading glyph | 20, at 14 |
 * | label | starts at 54.7 — 21 after the glyph — ink `#333333` |
 * | trailing ↖ | 12, `#b3b3b3`, 14 from the right |
 *
 * **The field flexes rather than sitting at its measured 221.** Below 480px
 * `DeviceFrame` renders edge to edge, so a fixed width would strand 30–70px of
 * blue on a 390 or 430px phone — the same trap the Filters panel fell into on
 * 2026-08-21. The margins are the measured ones, so it is exactly 221 at 360
 * and takes the surplus on anything wider.
 *
 * **One departure: the label is 15px where the screengrab measures 13.** The
 * grab wins on layout, and normally on type too, but the 2026-08-20 pass raised
 * this app's small end deliberately — every control label to 15 — for a
 * kirana buyer reading in poor light, and the vertical chips were raised to 15
 * on exactly that complaint hours ago. Building a new screen at 13 would invite
 * it straight back.
 */
export function SearchScreen({ basePath }: { basePath: "" | "/b" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const typed = query.trim().length > 0;
  const rows = typed
    ? suggestionsFor(query).map((s) => ({ term: s.term, store: s.store }))
    : RECENT_SEARCHES.map((term) => ({ term, store: false }));

  const run = (term: string) =>
    router.push(`${basePath}/results?q=${encodeURIComponent(term)}`);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[47px] shrink-0 items-center bg-primary pr-[11px] pl-[14px]">
        <button
          aria-label="Back"
          onClick={() => router.back()}
          className="flex w-[15px] shrink-0 cursor-pointer items-center"
        >
          <BackArrow />
        </button>

        {/* 29px of the measured gap, then the field takes what is left. */}
        <div className="ml-[29px] flex h-[31px] min-w-0 flex-1 items-center rounded-full bg-white pr-[10px] pl-[16px]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed) run(query.trim());
            }}
            placeholder="Type to search"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-black outline-none placeholder:text-[#9b9b9b]"
          />
          {typed && (
            <button
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="ml-[6px] shrink-0 cursor-pointer text-[#5f6368]"
            >
              <ClearGlyph />
            </button>
          )}
        </div>

        {/* Both inert, like the floating mic: there is no camera search and no
            voice search behind them, and a button that opens nothing is worse
            than one that plainly does nothing. */}
        <span className="ml-[10px] shrink-0" aria-hidden>
          <CameraGlyph />
        </span>
        <span className="ml-[24px] shrink-0" aria-hidden>
          <MicGlyph />
        </span>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {rows.map((row) => (
          <button
            key={row.term}
            onClick={() => run(row.term)}
            className="flex h-[50px] w-full cursor-pointer items-center border-b border-[#ebebeb] px-[14px] text-left"
          >
            <span className="size-[20px] shrink-0" aria-hidden>
              {typed ? <MagnifierGlyph /> : <HistoryGlyph />}
            </span>
            <span className="ml-[21px] flex min-w-0 flex-col">
              <span className="truncate text-[15px] leading-[18px] text-[#333333]">
                {row.term}
              </span>
              {row.store && (
                /* Measured `#6a9b9b`, darkened to clear AA on white — 2.9:1
                   against 4.9:1 — the same call the sheet's ✕ green got, and
                   for the same reason: the reference is a screengrab and the
                   contrast list is already long enough. */
                <span className="text-[12px] leading-[14px] text-[#2f7a78]">
                  Category Store
                </span>
              )}
            </span>
            <span className="flex-1" />
            {/* Fills the field rather than searching, which is what the glyph
                means on Android and the only reason it points back at the
                field instead of forward. */}
            <span
              role="button"
              tabIndex={0}
              aria-label={`Search for ${row.term}`}
              onClick={(e) => {
                e.stopPropagation();
                setQuery(row.term);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuery(row.term);
                }
              }}
              className="ml-[10px] shrink-0 cursor-pointer text-[#b3b3b3]"
            >
              <FillGlyph />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/*
 * Glyphs. `back.svg`, `search.svg` and the mic and camera PNGs all exist in
 * `public/`, but every one of them is the wrong colour, the wrong weight or the
 * wrong shape for this bar — and the two list glyphs, a history dial and a
 * fill-in arrow, have no export at all: they are Android's, not SOLV's, and no
 * Figma frame draws this screen. So they are drawn here, at the measured sizes,
 * rather than an existing asset being stretched into the role. Replace them
 * with exports the moment a frame supplies any.
 */
function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" aria-hidden>
      <path d="M20 12H4M4 12l7-7M4 12l7 7" stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClearGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[24px]" aria-hidden>
      <path
        d="M4 8h3.2l1.4-2h6.8l1.4 2H20a1.6 1.6 0 011.6 1.6v8A1.6 1.6 0 0120 19.2H4a1.6 1.6 0 01-1.6-1.6v-8A1.6 1.6 0 014 8z"
        fill="white"
      />
      <circle cx="12" cy="13.4" r="3.4" fill="var(--color-primary)" />
    </svg>
  );
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[12px]" fill="none" aria-hidden>
      <rect x="8.5" y="2" width="7" height="12" rx="3.5" fill="white" />
      <path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" stroke="white" strokeWidth="2"
        strokeLinecap="round" />
    </svg>
  );
}

function HistoryGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" aria-hidden>
      <path d="M3.1 12a8.9 8.9 0 108.9-8.9A8.9 8.9 0 004.6 6.9" stroke="black"
        strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.4 3.2v4.1h4.1" stroke="black" strokeWidth="1.9"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.9V12l3.4 2" stroke="black" strokeWidth="1.9"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagnifierGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.8" stroke="black" strokeWidth="1.9" />
      <path d="M15.6 15.6L21 21" stroke="black" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function FillGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[12px]" fill="none" aria-hidden>
      {/* Points up-and-left, at the field it fills — not up-and-right, which
          would read as "go there" and is the opposite instruction. */}
      <path d="M19 19L5 5M5 5h9M5 5v9" stroke="currentColor" strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
