import { z } from "zod";
import { currentGuest } from "@/lib/guest";
import { jsonError, parseJson } from "@/lib/http";
import { finishMemory, memoryBestOf } from "@/lib/queries";

const schema = z.object({
  attemptId: z.number().int().positive(),
  moves: z.number().int().min(2).max(10_000),
});

export async function POST(req: Request) {
  const guest = await currentGuest();
  if (!guest) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  const result = finishMemory(guest.id, data.attemptId, data.moves);
  if ("error" in result) return jsonError(result.error ?? "Không lưu được kết quả");
  const best = memoryBestOf(guest.id, result.attempt.level);
  return Response.json({
    bonus: result.bonus, // true = vừa được tặng 1 lượt quay vì lần đầu hoàn thành level này
    durationMs: result.attempt.duration_ms,
    moves: result.attempt.moves,
    best: best ? { durationMs: best.duration_ms, moves: best.moves } : null,
  });
}
