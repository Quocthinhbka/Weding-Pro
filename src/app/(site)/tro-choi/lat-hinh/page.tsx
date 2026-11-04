import type { Metadata } from "next";
import { MemoryGame } from "@/components/games/memory-game";
import { GameShell, JoinGate } from "@/components/games/shared";

export const metadata: Metadata = { title: "Lật hình ghép cặp" };

export default function MemoryPage() {
  return (
    <GameShell title="Lật hình ghép cặp" subtitle="Tìm các cặp ảnh giống nhau nhanh nhất có thể!">
      <JoinGate>
        <MemoryGame />
      </JoinGate>
    </GameShell>
  );
}
