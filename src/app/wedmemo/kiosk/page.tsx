import type { Metadata } from "next";
import { connection } from "next/server";
import { WeddingProvider } from "@/components/site/wedding-context";
import { WedMemo } from "@/components/video/wedmemo";
import { coupleNames } from "@/content/wedding";
import { getConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return { title: `Lời chúc · ${coupleNames(getConfig())}`, robots: { index: false } };
}

// Máy ở sảnh tiệc: mở bằng Chrome/Edge chế độ kiosk, cho phép camera + micro một lần.
export default async function KioskPage() {
  await connection();
  return (
    <WeddingProvider config={getConfig()}>
      <WedMemo kiosk />
    </WeddingProvider>
  );
}
