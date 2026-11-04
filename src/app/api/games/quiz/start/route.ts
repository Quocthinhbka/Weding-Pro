import { getConfig, getQuiz } from "@/lib/config";
import { currentGuest } from "@/lib/guest";
import { jsonError } from "@/lib/http";
import { startQuiz } from "@/lib/queries";

export async function POST() {
  const guest = await currentGuest();
  if (!guest?.phone) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const attempt = startQuiz(guest.id);
  if (attempt.finished_at) {
    return Response.json({ finished: true, score: attempt.score, total: attempt.total, durationMs: attempt.duration_ms });
  }
  return Response.json({
    finished: false,
    startedAt: attempt.started_at,
    serverNow: Date.now(),
    secondsPerQuestion: getConfig().games.quizSeconds,
    // Không gửi đáp án xuống trình duyệt.
    questions: getQuiz().map((q) => ({ question: q.question, options: q.options })),
  });
}
