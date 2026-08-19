import { HomeScreen } from "@/components/home/HomeScreen";

/**
 * Variant C entry point — the same home screen, with the seller cards leading
 * to /c/seller/[sellerId], so `/c` walks the whole journey in Variant C.
 */
export default function Page() {
  return <HomeScreen basePath="/c" />;
}
