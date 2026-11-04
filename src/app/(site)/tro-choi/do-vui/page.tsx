import type { Metadata } from "next";
import { connection } from "next/server";
import { Quiz } from "@/components/games/quiz";
import { GameShell, JoinGate } from "@/components/games/shared";
import { coupleNames } from "@/content/wedding";
import { getConfig, getQuiz } from "@/lib/config";

export const metadata: Metadata = { title: "Đố vui về cô dâu chú rể" };

export default async function QuizPage() {
  await connection();
  const config = getConfig();
  return (
    <GameShell title="Đố vui về dâu rể" subtitle={`Bạn hiểu ${coupleNames(config)} đến đâu?`}>
      <JoinGate>
        <Quiz total={getQuiz().length} seconds={config.games.quizSeconds} />
      </JoinGate>
    </GameShell>
  );
}
