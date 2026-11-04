import { currentGuest } from "@/lib/guest";
import { leaderboard } from "@/lib/queries";

export async function GET(req: Request) {
  const game = new URL(req.url).searchParams.get("game") === "memory" ? "memory" : "quiz";
  const me = await currentGuest();
  const rows = leaderboard(game).map((r) => ({
    name: r.name,
    score: r.score,
    total: r.total,
    moves: r.moves,
    durationMs: r.duration_ms,
    me: r.guest_id === me?.id,
  }));
  return Response.json({ game, rows });
}
