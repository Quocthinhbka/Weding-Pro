"use client";

import { useState } from "react";
import { gamesList, type GameId } from "@/content/games";
import { coupleNames } from "@/content/wedding";
import { formatLucky } from "@/lib/game-logic";
import { JoinGate } from "@/components/games/shared";
import { LuckyWheel } from "@/components/games/lucky-wheel";
import { MemoryGame } from "@/components/games/memory-game";
import { Quiz } from "@/components/games/quiz";
import { useGuest } from "@/components/site/guest";
import { useWedding } from "@/components/site/wedding-context";
import { Daisy } from "@/components/ui/daisy";
import { SectionTitle } from "@/components/ui/section-title";

/** Trò chơi có thưởng: danh sách trò chơi, bấm vào thì chơi ngay trong sector này; nút "Trò chơi" để quay lại danh sách. */
export function GamesSector({ quizTotal }: { quizTotal: number }) {
  const { state, openRsvp } = useGuest();
  const config = useWedding();
  const [active, setActive] = useState<GameId | null>(null);
  const lucky = state?.rsvp?.luckyNumber;
  const game = gamesList.find((g) => g.id === active);

  if (game) {
    const subtitle = game.id === "quiz" ? `Bạn hiểu ${coupleNames(config)} đến đâu?` : game.subtitle;
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="mb-3 inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-ink shadow-sm ring-1 ring-line active:scale-95"
        >
          ‹ Trò chơi
        </button>
        <div className="shrink-0 text-center">
          <Daisy size={28} className="mx-auto" />
          <h3 className="mt-1 font-serif text-xl font-semibold uppercase tracking-[0.1em] text-ink">{game.title}</h3>
          {subtitle && <p className="hide-short mx-auto mt-1.5 max-w-xs text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <div className="mt-5 pb-3">
          <JoinGate>
            {game.id === "wheel" && <LuckyWheel />}
            {game.id === "quiz" && <Quiz total={quizTotal} seconds={config.games.quizSeconds} />}
            {game.id === "memory" && <MemoryGame />}
          </JoinGate>
        </div>
      </div>
    );
  }

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
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className="flex items-center gap-4 rounded-2xl bg-white/80 p-3 text-left shadow-sm ring-1 ring-line transition active:scale-[0.99]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-3xl">{g.icon}</span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{g.title}</span>
              <span className="hide-short block text-sm text-ink-soft">{g.text}</span>
            </span>
            <span className="ml-auto text-xl text-olive">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
