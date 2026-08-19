import { HomeScreen } from "@/components/home/HomeScreen";

/**
 * Variant D entry point — the same home screen, with the seller cards leading
 * to /d/seller/[sellerId], so `/d` walks the whole journey in Variant D.
 */
export default function Page() {
  return <HomeScreen basePath="/d" />;
}
