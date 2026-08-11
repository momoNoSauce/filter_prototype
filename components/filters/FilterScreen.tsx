"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { ActionFooter } from "@/components/ui/ActionFooter";
import { FACET_BY_ID, RAIL } from "@/lib/filters/facets";
import {
  countMatching,
  countSelections,
  facetOptionsWithCounts,
  toggleSelection,
  type Selections,
} from "@/lib/filters/engine";
import { SearchField } from "./SearchField";
import { OptionRow, TileGrid } from "./OptionRows";

/**
 * Figma 638:3659 — the full-screen Filters sheet.
 *
 * Edits a draft copy of the selections; "Show N results" commits it, the close
 * button discards it. Every count in here is live: the footer total and each
 * option's own count both recompute on every tick, and options that become
 * impossible drop out of the list.
 */
export function FilterScreen({
  products,
  selections,
  onApply,
  onClose,
}: {
  products: Product[];
  selections: Selections;
  onApply: (next: Selections) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Selections>(selections);
  const [activeRail, setActiveRail] = useState(RAIL[0].id);
  const [query, setQuery] = useState("");

  const rail = RAIL.find((r) => r.id === activeRail) ?? RAIL[0];
  const total = useMemo(() => countMatching(products, draft), [products, draft]);

  const searchable = rail.facetIds.some((id) => FACET_BY_ID.get(id)?.searchable);

  const toggle = (facetId: string, optionId: string) =>
    setDraft((current) => toggleSelection(current, facetId, optionId));

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <div className="flex w-full shrink-0 items-center justify-between border-b border-[#dedede] bg-white px-[14px] py-[12px]">
        <p className="text-[16px] font-medium text-black">Filters</p>
        <button
          aria-label="Close filters"
          onClick={onClose}
          className="block size-[15px] shrink-0 cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-full" src="/figma/icons/close.svg" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Rail */}
        <div className="no-scrollbar w-[120px] shrink-0 overflow-y-auto pb-[16px]">
          {RAIL.map((entry, index) => {
            const active = entry.id === activeRail;
            const applied = entry.facetIds.reduce(
              (sum, id) => sum + (draft[id]?.length ?? 0),
              0,
            );
            return (
              <button
                key={entry.id}
                onClick={() => {
                  setActiveRail(entry.id);
                  setQuery("");
                }}
                className={`flex h-[60px] w-full cursor-pointer items-center gap-[6px] pr-[8px] pl-[14px] text-left ${
                  active
                    ? "bg-white"
                    : "border-r border-[#dedede] bg-[#f4f4f4]"
                } ${index > 0 ? "border-t border-[#dedede]" : ""}`}
              >
                <span
                  className={`min-w-0 flex-1 text-[14px] ${
                    active ? "font-bold text-primary" : "font-medium text-[#323232]"
                  }`}
                >
                  {entry.label}
                </span>
                {applied > 0 && (
                  <span className="size-[6px] shrink-0 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="no-scrollbar flex w-[240px] shrink-0 flex-col overflow-y-auto">
          {searchable && <SearchField value={query} onChange={setQuery} />}
          {!searchable && <div className="h-[10px] shrink-0" />}

          {rail.facetIds.map((facetId) => {
            const facet = FACET_BY_ID.get(facetId)!;
            const options = facetOptionsWithCounts(products, draft, facetId).filter(
              (option) =>
                !query || option.label.toLowerCase().includes(query.toLowerCase()),
            );
            const chosen = draft[facetId] ?? [];

            return (
              <div key={facetId} className="flex w-full flex-col">
                {/* Only "More Filters" stacks several facets, so only it needs
                    headings to tell them apart. */}
                {rail.facetIds.length > 1 && (
                  <p className="px-[14px] pt-[12px] pb-[4px] text-[12px] font-bold text-[#767676]">
                    {facet.label}
                  </p>
                )}

                {options.length === 0 ? (
                  <p className="px-[14px] py-[16px] text-[13px] text-muted">
                    No options match.
                  </p>
                ) : facet.panel === "tile" ? (
                  <TileGrid
                    options={options}
                    selected={chosen}
                    onToggle={(id) => toggle(facetId, id)}
                  />
                ) : (
                  options.map((option) => (
                    <OptionRow
                      key={option.id}
                      option={option}
                      selected={chosen.includes(option.id)}
                      onToggle={() => toggle(facetId, option.id)}
                    />
                  ))
                )}
              </div>
            );
          })}

          <div className="h-[16px] shrink-0" />
        </div>
      </div>

      <ActionFooter
        primaryLabel={`Show ${total.toLocaleString("en-IN")} results`}
        clearDisabled={countSelections(draft) === 0}
        onClear={() => setDraft({})}
        onPrimary={() => {
          onApply(draft);
          onClose();
        }}
      />
    </div>
  );
}
