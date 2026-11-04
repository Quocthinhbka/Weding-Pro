import type { Metadata } from "next";
import { LuckyWheel } from "@/components/games/lucky-wheel";
import { GameShell, JoinGate } from "@/components/games/shared";

export const metadata: Metadata = { title: "Vòng quay may mắn" };

export default function WheelPage() {
  return (
    <GameShell title="Vòng quay may mắn" subtitle="Mỗi khách đã xác nhận tham dự có 1 lượt quay. Chúc bạn may mắn!">
      <JoinGate>
        <LuckyWheel />
      </JoinGate>
    </GameShell>
  );
}
