"use client";

import Link from "next/link";
import { gamesList } from "@/content/games";
import { formatLucky } from "@/lib/game-logic";
import { useGuest } from "@/components/site/guest";
import { SectionTitle } from "@/components/ui/section-title";

export function GamesTeaser() {
  const { state, openRsvp } = useGuest();
  const lucky = state?.rsvp?.luckyNumber;
  return (
    <div>
      <SectionTitle compact eyebrow="Mini Games" title="Trò chơi có thưởng" subtitle="Vừa chơi vừa chờ ngày vui – quà được trao tận tay tại tiệc cưới!" />

      <div className="mb-4 rounded-[2rem] bg-olive px-6 py-5 text-center text-white shadow-md">
        <p className="text-xs uppercase tracking-[0.3em] text-white/80">Bốc số may mắn tại tiệc</p>
        {lucky ? (
          <>
            <p className="mt-2 font-serif text-5xl tracking-widest">{formatLucky(lucky)}</p>
            <p className="mt-2 text-sm text-white/85">Đây là số may mắn của bạn – nhớ có mặt lúc MC quay số nhé!</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/90">Xác nhận tham dự để nhận một con số may mắn và cơ hội trúng quà tại tiệc.</p>
            <button type="button" onClick={openRsvp} className="btn mt-4 bg-white text-olive-deep">
              Nhận số may mắn
            </button>
          </>
        )}
      </div>

      <div className="grid gap-2.5">
        {gamesList.map((g) => (
          <Link key={g.href} href={g.href} className="flex items-center gap-4 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-3xl">{g.icon}</span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{g.title}</span>
              <span className="hide-short block text-sm text-ink-soft">{g.text}</span>
            </span>
            <span className="ml-auto text-xl text-olive">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
