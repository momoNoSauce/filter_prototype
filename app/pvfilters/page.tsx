import { KartikStorefront } from "@/components/journey/KartikStorefront";

/**
 * **`/pvfilters`** — a clone of the journey's listing on its own path, added
 * 2026-09-09 on request so the product-vertical filtering can be worked on
 * without touching a route stakeholders have already been handed.
 *
 * Identical to `/userjourney` today: same 540-tee Kartik catalog, same top
 * chips, same `JOURNEY_RAIL_ORDER` rail, same bottom-sheet Filters, same typed
 * ranges. It shares the whole configuration through `KartikStorefront` rather
 * than copying it, so the two cannot drift by accident — **a deliberate
 * divergence goes in a prop there**, named and dated, the way `controls` already
 * carries this listing's departures from A–D.
 *
 * **One route, no redirect**, where `/userjourney` is an entry that redirects to
 * `/userjourney/seller/kartik`. That hop is historical — it is where the
 * journey's home screen used to be — and there is no reason to clone it. This is
 * how `/c` and `/d` land as well: straight on the listing, because the listing
 * is the point.
 *
 * A closed loop like every other variant: `basePath` sends both the home button
 * and the cards' `{base}/product/{id}` back under `/pvfilters`.
 */
export default function Page() {
  return <KartikStorefront basePath="/pvfilters" />;
}
