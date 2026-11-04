import { z } from "zod";
import { getQuiz } from "@/lib/config";
import { currentGuest } from "@/lib/guest";
import { jsonError, parseJson } from "@/lib/http";
import { submitQuiz } from "@/lib/queries";

const schema = z.object({
  answers: z.array(z.number().int().min(0).max(9).nullable()).max(30),
});

export async function POST(req: Request) {
  const guest = await currentGuest();
  if (!guest) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  const result = submitQuiz(guest.id, data.answers);
  if ("error" in result) return jsonError(result.error ?? "Không gửi được bài");
  const { attempt, already } = result;
  return Response.json({
    already,
    score: attempt.score,
    total: attempt.total,
    durationMs: attempt.duration_ms,
    correct: getQuiz().map((q) => q.answer),
  });
}
