import { notFound } from "next/navigation";
import { VerticalPlp } from "@/components/plp/VerticalPlp";
import { DEMO_VERTICAL } from "@/lib/catalog/scope";

/**
 * Variant C — **the demo link**. `/c` lands straight inside a single product
 * vertical, which is the state being shown: no browse path in front of it,
 * because the point is the listing, not how you got there.
 *
 * Any other seller/vertical pair is at /c/seller/[sellerId]/[categoryId].
 */
export default function Page() {
  const screen = VerticalPlp({
    ...DEMO_VERTICAL,
    variant: "bottom-bar",
    productBasePath: "/c",
  });
  if (!screen) notFound();
  return screen;
}
