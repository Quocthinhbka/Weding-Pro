import { currentGuest } from "@/lib/guest";
import { jsonError, rateLimit, TOO_MANY } from "@/lib/http";
import { memoryBestOf, startMemory } from "@/lib/queries";

export async function POST() {
  if (!(await rateLimit("memory", 40, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const guest = await currentGuest();
  if (!guest?.phone) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const best = memoryBestOf(guest.id);
  return Response.json({
    attemptId: startMemory(guest.id),
    best: best ? { durationMs: best.duration_ms, moves: best.moves } : null,
  });
}
