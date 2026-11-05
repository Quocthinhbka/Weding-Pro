import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { coupleNames } from "@/content/wedding";
import { getConfig } from "@/lib/config";

// Khi khách "Thêm vào màn hình chính", thiệp mở toàn màn hình và khoá hướng dọc.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();
  const names = coupleNames(getConfig());
  return {
    name: `Thiệp cưới ${names}`,
    short_name: "Thiệp cưới",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6ee",
    theme_color: "#f3ebdd",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
