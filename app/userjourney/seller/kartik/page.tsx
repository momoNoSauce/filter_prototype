import { KartikStorefront } from "@/components/journey/KartikStorefront";

/**
 * The user journey's listing — where `/userjourney` redirects to.
 *
 * The configuration moved to `KartikStorefront` on 2026-09-09, when `/pvfilters`
 * was cloned off this route: two pages spelling out the same twelve decisions is
 * the drift one `PlpScreen` exists to prevent. Everything that was written here
 * is written there, unchanged.
 */
export default function Page() {
  return <KartikStorefront basePath="/userjourney" />;
}
