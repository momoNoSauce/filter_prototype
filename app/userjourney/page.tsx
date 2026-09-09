import { redirect } from "next/navigation";

/**
 * The user journey's entry point — `/userjourney`, which is now the storefront.
 *
 * **The home beat is gone** (2026-09-09, on request): the link lands straight on
 * Kartik Exporters' listing, so the demo opens on the thing the prototype is
 * about — filter and sort — rather than on a screen whose only live element is
 * one banner. The journey is now: land on the listing, filter *Category →
 * Women's T-Shirts*, sort *Newest Products*, cut to S/M/L, tap through to a
 * detail page.
 *
 * A redirect rather than a second copy of the storefront: `PlpScreen` is
 * configured once, at `/userjourney/seller/kartik`, and rendering that config
 * from two routes is exactly the drift this repo keeps one PLP to avoid. The
 * cost is one hop and a URL that changes under the user — accepted, because the
 * URL it changes to is the honest name of what is on screen.
 *
 * It also keeps the loop closed rather than breaking it: the storefront's home
 * button and `ProductDetail`'s both point at `/userjourney`, and both now come
 * back here and bounce to the listing. Nothing needed rewiring, and a session
 * handed this link still cannot leave the journey.
 *
 * `JourneyHome` is still in the tree with no caller, the way `TileGrid` is —
 * see its own comment.
 */
export default function Page() {
  redirect("/userjourney/seller/kartik");
}
