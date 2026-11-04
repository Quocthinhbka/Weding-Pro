"use client";

import { useWedding } from "@/components/site/wedding-context";
import { Daisy } from "@/components/ui/daisy";
import { useMusic } from "@/components/site/music";

// Vị trí ngang (%), độ trễ (s), thời gian bay (s), cỡ (px), độ lắc (px) của từng nốt nhạc.
const NOTES = [
  { left: 10, delay: 0, dur: 4.6, size: 20, sway: 14, double: false },
  { left: 28, delay: 1.3, dur: 5.2, size: 26, sway: -18, double: true },
  { left: 46, delay: 2.4, dur: 4.4, size: 18, sway: 12, double: false },
  { left: 62, delay: 0.7, dur: 5.6, size: 28, sway: -14, double: true },
  { left: 78, delay: 3.1, dur: 4.8, size: 22, sway: 18, double: false },
  { left: 90, delay: 1.9, dur: 5.0, size: 18, sway: -12, double: true },
];

function Note({ size, double }: { size: number; double: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      {double ? (
        <path d="M9 3v11.3A3.5 3.5 0 1 0 11 17.5V8.2l8-1.8v6.9a3.5 3.5 0 1 0 2 3.2V3z" />
      ) : (
        <path d="M12 3v10.3A3.5 3.5 0 1 0 14 16.5V6.6c2 .9 4 2.5 4 5.4h2c0-4.3-3.1-6.7-8-9z" />
      )}
    </svg>
  );
}

/** Thẻ nhạc nền kèm những nốt nhạc nhảy múa bay từ thẻ lên trên rồi tan dần. */
export function MusicCard() {
  const { playing, available, toggle } = useMusic();
  const { music } = useWedding();
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 h-0" aria-hidden>
        {NOTES.map((n, i) => (
          <span
            key={i}
            className={`music-note absolute bottom-0 ${i % 2 ? "text-rose" : "text-olive"} ${playing ? "is-playing" : ""}`}
            style={{ left: `${n.left}%`, animationDelay: `${n.delay}s`, animationDuration: `${n.dur}s`, ["--sway" as string]: `${n.sway}px` }}
          >
            <Note size={n.size} double={n.double} />
          </span>
        ))}
      </div>
      <div className="relative flex items-center gap-4 rounded-[1.75rem] bg-paper px-4 py-3 ring-1 ring-line">
        <div className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink shadow-xl ${playing ? "animate-spin-slow" : ""}`}>
          {[2, 4, 6].map((i) => (
            <span key={i} className="absolute rounded-full border border-white/10" style={{ inset: `${i * 2.5}px` }} />
          ))}
          <span className="grid h-7 w-7 place-items-center rounded-full bg-cream">
            <Daisy size={20} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-olive">Giai điệu hạnh phúc</p>
          <p className="truncate font-serif text-base text-ink">{music.title}</p>
          <p className="truncate text-xs text-ink-soft">{available ? music.artist : "Nhạc nền sẽ sớm được cập nhật ♪"}</p>
        </div>
        {available && (
          <button type="button" onClick={toggle} className="shrink-0 rounded-full bg-olive px-3.5 py-2 text-xs font-medium text-white">
            {playing ? "❚❚ Dừng" : "▶ Phát"}
          </button>
        )}
      </div>
    </div>
  );
}
