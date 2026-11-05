"use client";

import { useEffect, useState } from "react";
import { GuestProvider } from "@/components/site/guest";
import { MusicProvider } from "@/components/site/music";
import { SiteSections } from "@/components/site/sections";
import { WeddingProvider } from "@/components/site/wedding-context";
import type { Side, WeddingConfig } from "@/content/wedding";

export type PreviewMessage = { type: "config"; config: WeddingConfig } | { type: "scroll"; sec: string };

/**
 * Bên trong iframe: dựng thiệp thật bằng chính các component của trang chủ, nhưng với cấu hình nháp
 * do trang Cấu hình gửi sang (postMessage). Không có phong bì, hoa rơi và nút nhạc để xem được ngay.
 */
export function PreviewFrame({ initial, side, quizTotal, albumRatios }: { initial: WeddingConfig; side: Side; quizTotal: number; albumRatios: Record<string, number> }) {
  const [config, setConfig] = useState(initial);

  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin !== window.location.origin) return;
      if (e.data.type === "config") setConfig(e.data.config);
      if (e.data.type === "scroll") {
        document.querySelector(`[data-sec="${CSS.escape(e.data.sec)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <WeddingProvider config={config}>
      <MusicProvider>
        <GuestProvider>
          <div className="paper-bg min-h-dvh">
            <main className="relative mx-auto min-h-dvh max-w-[480px] overflow-x-hidden bg-cream">
              <SiteSections config={config} wishes={[]} side={side} quizTotal={quizTotal} albumRatios={albumRatios} />
            </main>
          </div>
        </GuestProvider>
      </MusicProvider>
    </WeddingProvider>
  );
}
