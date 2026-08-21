import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { DeviceFrame } from "@/components/DeviceFrame";
import { CartProvider } from "@/components/cart/CartProvider";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

// The design uses Inter for button labels ("Clear Filters", "Show N results")
// even though everything else is Roboto.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "SOLV — Filter & Sort Prototype",
  description:
    "Working filter and sort prototype for the SOLV B2B commerce app.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#004ffa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${inter.variable}`}
    >
      <body>
        {/* The basket lives above the routes, so it survives every
            client-side move between them — see `CartProvider`. */}
        <CartProvider>
          <DeviceFrame>{children}</DeviceFrame>
        </CartProvider>
      </body>
    </html>
  );
}
