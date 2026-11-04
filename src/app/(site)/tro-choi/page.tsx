import type { Metadata } from "next";
import Link from "next/link";
import { gamesList } from "@/content/games";
import { GameShell } from "@/components/games/shared";

export const metadata: Metadata = { title: "Trò chơi có thưởng" };

export default function GamesPage() {
  return (
    <GameShell title="Trò chơi có thưởng" subtitle="Quà được trao tận tay tại tiệc cưới – chơi ngay nào!">
      <div className="grid gap-3">
        {gamesList.map((g) => (
          <Link key={g.href} href={g.href} className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-3xl">{g.icon}</span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{g.title}</span>
              <span className="block text-sm text-ink-soft">{g.text}</span>
            </span>
            <span className="ml-auto text-xl text-olive">›</span>
          </Link>
        ))}
      </div>
      <Link href="/" className="btn btn-outline mt-8 w-full">
        Về thiệp cưới
      </Link>
    </GameShell>
  );
}
