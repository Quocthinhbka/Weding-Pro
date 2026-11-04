"use client";

import { useEffect, useState } from "react";
import { useMusic } from "./music";

/**
 * Đĩa than ở góc dưới bên trái, luôn hiện: bấm để bật / tắt nhạc nền.
 * Đang phát: đĩa quay, cần đọc đặt lên đĩa, có nốt nhạc bay. Đang tắt: đĩa đứng yên, mờ đi, cần nhấc lên.
 */
export function Vinyl() {
  const { playing, available, opened, toggle } = useMusic();
  const [hint, setHint] = useState(false);
  const [guide, setGuide] = useState<"idle" | "showing" | "done">("idle");

  // Nhạc tự phát khi mở phong bì: nhắc khách bấm đĩa than để dừng, trong 5 giây đầu rồi tự tắt.
  useEffect(() => {
    if (guide === "idle" && opened && playing) {
      const t = setTimeout(() => setGuide("showing"), 0);
      return () => clearTimeout(t);
    }
    if (guide === "showing") {
      const t = setTimeout(() => setGuide("done"), 5_000);
      return () => clearTimeout(t);
    }
  }, [guide, opened, playing]);

  function press() {
    setGuide("done");
    if (available) return toggle();
    setHint(true);
    setTimeout(() => setHint(false), 2200);
  }

  return (
    <div className="fixed bottom-3 left-[max(0.75rem,calc(50%-240px+0.75rem))] z-40">
      {hint && <p className="absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-white shadow-lg">Nhạc nền sẽ sớm được cập nhật ♪</p>}
      {guide === "showing" && playing && (
        <p role="status" className="vinyl-guide absolute bottom-full left-1 mb-2 w-max max-w-[calc(100vw-1.5rem)] rounded-2xl bg-ink px-3.5 py-2 text-xs leading-snug text-white shadow-lg">
          Nhấn vào đĩa than để dừng phát nhạc ♪
          <span className="absolute -bottom-1 left-5 h-2.5 w-2.5 rotate-45 bg-ink" aria-hidden />
        </p>
      )}
      <button type="button" onClick={press} aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"} aria-pressed={playing} className="group relative block h-[3.9rem] w-[4.1rem] active:scale-95">
        {/* nốt nhạc bay lên khi đang phát */}
        {playing && (
          <>
            <span className="music-note is-playing absolute bottom-10 left-3 text-olive" style={{ ["--sway" as string]: "8px", animationDelay: "0s" }} aria-hidden>
              ♪
            </span>
            <span className="music-note is-playing absolute bottom-10 left-9 text-rose" style={{ ["--sway" as string]: "-9px", animationDelay: "1.1s" }} aria-hidden>
              ♫
            </span>
          </>
        )}
        {/* đĩa */}
        <span
          className={`absolute bottom-0 left-0 grid h-14 w-14 place-items-center rounded-full bg-ink shadow-xl ring-2 ring-cream transition-[filter,opacity] duration-500 ${playing ? "animate-spin-slow" : "opacity-80 saturate-50"}`}
          style={{ backgroundImage: "repeating-radial-gradient(circle at center, transparent 0 3px, rgb(255 255 255 / 0.07) 3px 4px)" }}
        >
          <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,transparent_0_20%,rgb(255_255_255/0.18)_25%,transparent_30%_70%,rgb(255_255_255/0.14)_75%,transparent_80%)]" />
          <span className={`grid h-6 w-6 place-items-center rounded-full ring-2 ring-ink/40 ${playing ? "bg-daisy" : "bg-paper-deep"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          </span>
        </span>
        {/* cần đọc: đặt lên đĩa khi phát, nhấc lên khi tắt */}
        <span
          className="absolute right-0 top-0 h-12 w-1.5 origin-top rounded-full bg-gradient-to-b from-paper-deep to-ink-soft shadow transition-transform duration-700 ease-out"
          style={{ transform: `rotate(${playing ? 28 : -14}deg)` }}
          aria-hidden
        >
          <span className="absolute -bottom-1 -left-1 h-3 w-3.5 rounded-sm bg-daisy ring-1 ring-ink/30" />
        </span>
        <span className="absolute right-[-0.15rem] top-[-0.25rem] h-3.5 w-3.5 rounded-full bg-paper-deep shadow ring-1 ring-ink/30" aria-hidden />
        {/* dấu tắt khi không phát */}
        {!playing && <span className="absolute bottom-[1.3rem] left-[1.3rem] text-sm leading-none text-cream/90 drop-shadow" aria-hidden>▶</span>}
      </button>
    </div>
  );
}
