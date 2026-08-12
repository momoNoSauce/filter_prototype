import { HomeScreen } from "@/components/home/HomeScreen";

/**
 * Variant B entry point — identical home screen, but the seller cards lead to
 * /b/seller/[sellerId], so `/b` walks the whole journey in Variant B.
 */
export default function Page() {
  return <HomeScreen basePath="/b" />;
}
