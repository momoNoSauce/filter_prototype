"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { Sheet } from "@/components/ui/Sheet";
import { ActionFooter } from "@/components/ui/ActionFooter";
import { TileGrid } from "@/components/filters/OptionRows";
import {
  countMatching,
  facetOptionsWithCounts,
  toggleSelection,
  type Selections,
} from "@/lib/filters/engine";

/** Order is an artefact of tap sequence, so compare as sets, not as lists. */
const sameOptions = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Variant A's bottom-bar quick action, in the slot Gender used to hold.
 *
 * Unlike the Gender sheet it replaces, this is **multi-select**. "Nobody shops
 * two at a time" was only ever true of gender; a retailer plausibly wants
 * Men's Casual Shirts and Men's Casual T-Shirts in one list. So it keeps a
 * draft and commits on "Show N results", reinstating the Clear/Apply footer
 * the Figma gender frame (644:4470) carried before that frame's footer was
 * dropped for being single-select.
 *
 * The bottom bar owns Category in this variant, which is why Category is
 * absent from A's Filters rail — see `getRail`.
 *
 * The grid is the Filters screen's `TileGrid`, not a restyled copy, so the
 * 56px square and its label box can only be changed in one place. It runs in
 * `fill` layout here: at 360px, left-aligning fixed 68px cells fits four and
 * leaves a whole empty column at the right, so the cells divide the width
 * instead and five go across.
 */
export function CategorySheet({
  products,
  selections,
  onApply,
  onClose,
  onDiscard,
}: {
  products: Product[];
  selections: Selections;
  onApply: (next: Selections) => void;
  onClose: () => void;
  /**
   * Dismissed — scrim, close button or Escape — while holding edits that were
   * never applied. Fires only when something would actually be lost: opening
   * the sheet and closing it untouched discards nothing worth announcing, and
   * neither does ticking a category and unticking it again.
   */
  onDiscard: () => void;
}) {
  const [draft, setDraft] = useState<Selections>(selections);

  /**
   * What the sheet opened with, frozen. Comparing against the live
   * `selections` prop instead would be unreliable: applying updates it, and
   * this component stays mounted through the exit animation, so by the time
   * the sheet finishes closing the two would already agree.
   */
  const opened = useRef(selections.category ?? []);
  const applied = useRef(false);

  // Counted against every other facet's selections but never Category's own,
  // so ticking one category still leaves live counts on the rest.
  const options = useMemo(
    () => facetOptionsWithCounts(products, draft, "category"),
    [products, draft],
  );
  // The total honours whatever else is already applied, so "Show N results"
  // means the list the user will actually land on.
  const total = useMemo(() => countMatching(products, draft), [products, draft]);
  const chosen = draft.category ?? [];

  return (
    <Sheet
      title="Category"
      // Runs once the exit animation has finished, on every dismissal route —
      // scrim, close button and Escape all funnel through it, so none of them
      // can drop a draft silently.
      onClose={() => {
        if (!applied.current && !sameOptions(chosen, opened.current)) onDiscard();
        onClose();
      }}
      footer={(close) => (
        <ActionFooter
          primaryLabel={`Show ${total.toLocaleString("en-IN")} results`}
          // "Clear all" is the sheet's vocabulary; "Clear Filters" belongs to
          // the Filters screen.
          clearLabel="Clear all"
          clearDisabled={chosen.length === 0}
          // Clears only Category — the one facet this control owns. Wiping
          // anything else from a sheet that never displayed it would be the
          // same silent surprise the Filters screen is careful to avoid.
          onClear={() =>
            setDraft((current) => {
              const next = { ...current };
              delete next.category;
              return next;
            })
          }
          onPrimary={() => {
            applied.current = true;
            onApply(draft);
            close();
          }}
        />
      )}
    >
      <div className="no-scrollbar max-h-[320px] overflow-y-auto pb-[8px]">
        <TileGrid
          options={options}
          selected={chosen}
          layout="fill"
          onToggle={(id) =>
            setDraft((current) => toggleSelection(current, "category", id))
          }
        />
      </div>
    </Sheet>
  );
}
