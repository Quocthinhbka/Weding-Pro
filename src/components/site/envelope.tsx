"use client";

import { useEffect, useState } from "react";
import { dateInfo } from "@/content/wedding";
import { useWedding } from "./wedding-context";
import { Daisy, DaisyDivider, DaisySprig, Heart } from "@/components/ui/daisy";
import { useMusic } from "./music";

const OPENED_KEY = "thiep-da-mo";

/** Màn hình phong bì "Mở thiệp". Bấm mở thì phát nhạc (trình duyệt chỉ cho phép sau thao tác của khách). */
export function Envelope({ guestName }: { guestName: string | null }) {
  const { play } = useMusic();
  const config = useWedding();
  const date = dateInfo(config);
  const [phase, setPhase] = useState<"closed" | "opening" | "gone">("closed");

  useEffect(() => {
    let opened = false;
    try {
      opened = sessionStorage.getItem(OPENED_KEY) === "1";
    } catch {}
    if (opened) {
      const t = setTimeout(() => setPhase("gone"), 0);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "gone" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  function open() {
    play();
    setPhase("opening");
    try {
      sessionStorage.setItem(OPENED_KEY, "1");
    } catch {}
    setTimeout(() => setPhase("gone"), 1900);
  }

  if (phase === "gone") return null;
  const opening = phase === "opening";

  return (
    <div
      className={`paper-bg fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-4 transition-[opacity,transform] duration-700 ${opening ? "pointer-events-none" : ""}`}
      style={opening ? { opacity: 0, transform: "scale(1.04)", transitionDelay: "1.15s" } : undefined}
    >
      <DaisySprig className="absolute -left-6 bottom-0 w-36 opacity-70 sm:w-48" />
      <DaisySprig className="absolute -right-6 top-0 w-32 rotate-180 opacity-60 sm:w-44" />

      <div className="relative flex w-full max-w-[400px] flex-col items-center text-center">
        <div className="flex gap-1.5 text-rose/70">
          {Array.from({ length: 7 }, (_, i) => (
            <Heart key={i} className="h-3 w-3" />
          ))}
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.45em] text-ink-soft">Save the date</p>
        <h1 className="mt-3 font-script text-5xl leading-tight text-ink">
          {config.groom.name}
          <span className="block text-3xl leading-none text-olive">&</span>
          {config.bride.name}
        </h1>
        <DaisyDivider className="mt-3" />
        <p className="mt-3 font-serif text-lg tracking-wide text-ink">
          {date.day} tháng {date.month}, {date.year}
        </p>

        {/* Phong bì */}
        <div className="relative mt-8 aspect-[4/3] w-full max-w-[340px]" style={{ perspective: "1200px" }}>
          <div className="absolute inset-0 rounded-md bg-[#e6d6b8] shadow-[0_25px_50px_-25px_rgba(63,51,38,0.55)]" />
          {/* Lá thư bên trong */}
          <div
            className="absolute inset-x-[7%] top-[8%] bottom-[6%] rounded-sm bg-cream p-4 shadow-md transition-transform duration-1000 ease-out"
            style={{ transform: opening ? "translateY(-62%)" : "translateY(0)", transitionDelay: opening ? "0.35s" : "0s" }}
          >
            <Daisy size={30} className="mx-auto" />
            <p className="mt-1 font-script text-2xl text-olive">Thiệp mời cưới</p>
          </div>
          {/* Mặt trước túi phong bì */}
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <path d="M0 0 L200 165 L0 300 Z" fill="#efe2c8" />
            <path d="M400 0 L200 165 L400 300 Z" fill="#ecdec2" />
            <path d="M0 300 L200 150 L400 300 Z" fill="#f4e9d3" />
            <path d="M0 300 L200 150 L400 300" fill="none" stroke="#d9c6a2" strokeWidth="1.5" />
          </svg>
          {/* Nắp phong bì */}
          <div
            className="absolute inset-x-0 top-0 h-[58%] origin-top transition-transform duration-700 ease-in-out"
            style={{
              transform: opening ? "rotateX(180deg)" : "rotateX(0deg)",
              zIndex: opening ? 0 : 3,
              transitionProperty: "transform, z-index",
              transitionDelay: opening ? "0s, 0.35s" : "0s",
            }}
          >
            <svg viewBox="0 0 400 174" className="h-full w-full drop-shadow-[0_6px_6px_rgba(63,51,38,0.15)]" preserveAspectRatio="none" aria-hidden>
              <path d="M0 0 L400 0 L200 174 Z" fill="#e9d8b8" stroke="#d9c6a2" strokeWidth="1.5" />
            </svg>
          </div>
          {/* Con dấu sáp */}
          <div
            className="absolute left-1/2 top-[50%] z-[4] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-olive shadow-lg ring-4 ring-olive/30 transition-opacity duration-300"
            style={{ opacity: opening ? 0 : 1 }}
          >
            <Daisy size={40} />
          </div>
          {/* Tên khách mời viết trên phong bì */}
          <div className="absolute inset-x-0 bottom-[7%] z-[2] px-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-soft">Thân mời</p>
            <p className="mt-1 truncate font-script text-2xl text-ink">{guestName || config.texts.guestFallback}</p>
          </div>
        </div>

        <button type="button" onClick={open} className="btn btn-primary animate-float mt-9 px-10" disabled={opening}>
          Mở thiệp
        </button>
      </div>
    </div>
  );
}
