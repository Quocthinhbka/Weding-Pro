import { getConfig, getQuiz } from "@/lib/config";
import { currentGuest } from "@/lib/guest";
import { jsonError, rateLimit, TOO_MANY } from "@/lib/http";
import { startQuiz } from "@/lib/queries";

// Mỗi lần bấm "Bắt đầu" là một lượt chơi mới (chơi lại được nhiều lần); bảng xếp hạng lấy lượt tốt nhất.
export async function POST() {
  if (!(await rateLimit("quiz-start", 30, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const guest = await currentGuest();
  if (!guest?.phone) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const attempt = startQuiz(guest.id);
  return Response.json({
    startedAt: attempt.started_at,
    serverNow: Date.now(),
    secondsPerQuestion: getConfig().games.quizSeconds,
    // Không gửi đáp án xuống trình duyệt.
    questions: getQuiz().map((q) => ({ question: q.question, options: q.options })),
  });
}
