import { JourneyHome } from "@/components/journey/JourneyHome";

/**
 * The user journey's entry point — `/userjourney`.
 *
 * The journey is: land here, see the Kartik exporters banner, tap it, then
 * filter *Gender → Women*, sort *Recently Added*, and cut to S/M/L. This screen
 * exists for the first beat of that, so only the banner is live.
 *
 * A closed loop like A and B: the storefront's home button comes back here
 * rather than to `/`, so a session handed this link stays in the journey.
 */
export default function Page() {
  return <JourneyHome />;
}
