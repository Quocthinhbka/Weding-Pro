import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Dancing_Script, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Thiệp cưới",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3ebdd",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${dancing.variable} ${beVietnam.variable} antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
