"use client";

import { useEffect, useRef, useState } from "react";
import type { WeddingConfig } from "@/content/wedding";
import type { PreviewMessage } from "./preview-frame";

/**
 * Khung điện thoại hiển thị thiệp thật (/admin/preview trong iframe). Mỗi lần cấu hình nháp đổi,
 * bản mới được gửi sang iframe bằng postMessage nên thiệp đổi theo ngay, chưa cần bấm Lưu.
 */
export function ConfigPreview({ config, section, onClose }: { config: WeddingConfig; section: { sec: string; n: number } | null; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [side, setSide] = useState<"groom" | "bride">("groom");
  const ready = useRef(false);
  const latest = useRef(config);

  const post = (m: PreviewMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin);

  useEffect(() => {
    latest.current = config;
    if (!ready.current) return;
    const t = setTimeout(() => post({ type: "config", config }), 120); // gộp các lần gõ liên tiếp
    return () => clearTimeout(t);
  }, [config]);

  useEffect(() => {
    if (section && ready.current) post({ type: "scroll", sec: section.sec });
  }, [section]);

  useEffect(() => {
    // Iframe tải xong thì báo "ready"; lúc đó mới gửi cấu hình nháp hiện tại.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow || e.data?.type !== "ready") return;
      ready.current = true;
      post({ type: "config", config: latest.current });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
        <span className="font-semibold uppercase tracking-widest">Xem trước</span>
        <button type="button" onClick={onClose} className="rounded-full bg-white px-3 py-1 ring-1 ring-line lg:hidden">
          Đóng ✕
        </button>
        <div className="flex gap-1" role="group" aria-label="Xem thiệp của bên nào">
          {([["groom", "Nhà trai"], ["bride", "Nhà gái"]] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === side) return;
                ready.current = false; // iframe tải lại, chờ nó báo "ready" rồi gửi lại bản nháp
                setSide(k);
              }}
              className={`rounded-full px-3 py-1 ring-1 ring-line ${side === k ? "bg-olive text-white" : "bg-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[2.2rem] border-[10px] border-ink bg-cream shadow-xl">
        <iframe key={side} ref={frame} src={`/admin/preview?f=${side}`} title="Xem trước thiệp" className="h-full w-full bg-cream" />
      </div>
    </div>
  );
}
