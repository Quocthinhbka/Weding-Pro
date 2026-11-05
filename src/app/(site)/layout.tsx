import type { Metadata } from "next";
import { connection } from "next/server";
import { GuestProvider } from "@/components/site/guest";
import { MusicProvider } from "@/components/site/music";
import { OrientationGuard } from "@/components/site/orientation-guard";
import { Vinyl } from "@/components/site/vinyl";
import { WeddingProvider } from "@/components/site/wedding-context";
import { DaisySprig } from "@/components/ui/daisy";
import { FallingPetals } from "@/components/ui/falling-petals";
import { coupleNames, dateInfo } from "@/content/wedding";
import { getConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const config = getConfig();
  const names = coupleNames(config);
  const date = dateInfo(config);
  return {
    title: { default: `Thiệp cưới ${names}`, template: `%s · ${names}` },
    description: `Trân trọng kính mời bạn đến chung vui trong ngày cưới của ${names} – ${date.weekday}, ${date.dots}.`,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      title: `Thiệp cưới ${names}`,
      description: `${date.weekday}, ${date.dots} · Trân trọng kính mời!`,
    },
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Cấu hình đọc từ cơ sở dữ liệu mỗi lần tải trang, nên chỉnh trong /admin là thấy ngay.
  await connection();
  const config = getConfig();
  return (
    <WeddingProvider config={config}>
      <MusicProvider>
        <GuestProvider>
          <div className="paper-bg relative min-h-dvh">
            {/* Họa tiết hai bên trên màn hình lớn */}
            <DaisySprig className="pointer-events-none fixed bottom-0 left-[max(0px,calc(50%-560px))] hidden w-60 opacity-60 lg:block" />
            <DaisySprig className="pointer-events-none fixed right-[max(0px,calc(50%-560px))] top-10 hidden w-52 opacity-50 lg:block" flip />
            <main className="card-frame relative mx-auto min-h-dvh max-w-[480px] overflow-x-hidden">{children}</main>
            <FallingPetals />
            <Vinyl />
            <OrientationGuard />
          </div>
        </GuestProvider>
      </MusicProvider>
    </WeddingProvider>
  );
}
