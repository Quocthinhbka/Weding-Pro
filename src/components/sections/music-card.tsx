"use client";

import { useWedding } from "@/components/site/wedding-context";
import { Daisy } from "@/components/ui/daisy";
import { useMusic } from "@/components/site/music";

export function MusicCard() {
  const { playing, available, toggle } = useMusic();
  const { music } = useWedding();
  return (
    <div className="flex items-center gap-5 rounded-[2rem] bg-paper px-5 py-5 ring-1 ring-line">
      <div className={`relative grid h-24 w-24 shrink-0 place-items-center rounded-full bg-ink shadow-xl ${playing ? "animate-spin-slow" : ""}`}>
        {[2, 4, 6, 8].map((i) => (
          <span key={i} className="absolute rounded-full border border-white/10" style={{ inset: `${i * 2.5}px` }} />
        ))}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cream">
          <Daisy size={30} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-olive">Giai điệu hạnh phúc</p>
        <p className="mt-1 truncate font-serif text-lg text-ink">{music.title}</p>
        <p className="truncate text-sm text-ink-soft">{music.artist}</p>
        {available ? (
          <button type="button" onClick={toggle} className="mt-3 text-sm font-medium text-olive-deep underline-offset-4 hover:underline">
            {playing ? "❚❚ Tạm dừng" : "▶ Phát nhạc"}
          </button>
        ) : (
          <p className="mt-3 text-xs text-ink-soft">Nhạc nền sẽ sớm được cập nhật ♪</p>
        )}
      </div>
    </div>
  );
}
