"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";
import { QUIZ_BONUS_SCORE } from "@/content/games";
import { Modal } from "@/components/ui/modal";
import { Leaderboard } from "./shared";

type Question = { question: string; options: string[] };
type Start = { questions: Question[]; secondsPerQuestion: number };
type Result = { score: number; total: number; durationMs: number; correct: number[]; bonus: "granted" | "already" | "none" };

export function Quiz({ total, seconds }: { total: number; seconds: number }) {
  const { refresh } = useGuest();
  const [phase, setPhase] = useState<"intro" | "playing" | "submitting" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [perQuestion, setPerQuestion] = useState(seconds);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const answersRef = useRef<(number | null)[]>([]);

  async function start() {
    setError("");
    try {
      const data = await postJson<Start>("/api/games/quiz/start");
      setQuestions(data.questions);
      setPerQuestion(data.secondsPerQuestion);
      nextDeadline(data.secondsPerQuestion);
      answersRef.current = [];
      setAnswers([]);
      setCurrent(0);
      setPhase("playing");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function submit(final: (number | null)[]) {
    setPhase("submitting");
    try {
      const data = await postJson<Result>("/api/games/quiz/submit", { answers: final });
      setResult(data);
      setVersion((v) => v + 1);
      setPhase("result");
      if (data.bonus === "granted") refresh(); // có thêm lượt quay: cập nhật số lượt ở vòng quay
    } catch (err) {
      setError((err as Error).message);
      setPhase("playing");
    }
  }

  function nextDeadline(seconds: number) {
    const t = Date.now();
    setNow(t);
    setDeadline(t + seconds * 1000);
  }

  function choose(option: number | null) {
    const next = [...answersRef.current];
    next[current] = option;
    answersRef.current = next;
    setAnswers(next);
    if (current + 1 >= questions.length) {
      setDeadline(0);
      submit(next);
    } else {
      setCurrent(current + 1);
      nextDeadline(perQuestion);
    }
  }

  // Đồng hồ cho từng câu: hết giờ thì tính là bỏ qua.
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === "playing" && deadline > 0 && now >= deadline) chooseRef.current(null);
  }, [now, deadline, phase]);
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));

  // Màn hướng dẫn kèm bảng xếp hạng. Xong bài thì kết quả + bảng xếp hạng hiện trong hộp thoại phía trên màn này.
  if (phase === "intro" || phase === "result") {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5 rounded-[2rem] bg-paper/70 p-5 text-center text-sm leading-relaxed text-ink-soft ring-1 ring-line">
          <p>
            <b className="text-ink">{total} câu hỏi</b> · mỗi câu {perQuestion} giây
          </p>
          <p>
            Đúng từ <b className="text-ink">{Math.min(QUIZ_BONUS_SCORE, total)}/{total}</b> câu: +1 lượt quay 🎡
            <br />
            <span className="text-xs">(nhận một lần duy nhất)</span>
          </p>
          <p>
            Xếp hạng: nhiều câu đúng nhất,
            <br />
            rồi nhanh nhất. Top 3 nhận quà 🎁
          </p>
          {error && <p className="text-[#8a4a3e]">{error}</p>}
          <button type="button" onClick={start} className="btn btn-primary mt-3 w-full">
            Bắt đầu
          </button>
        </div>
        <Leaderboard game="quiz" version={version} />

        <Modal open={phase === "result" && !!result} onClose={() => setPhase("intro")} title="Kết quả của bạn">
          {result && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-line">
                <p className="font-serif text-6xl text-olive-deep">
                  {result.score}
                  <span className="text-2xl text-ink-soft">/{result.total}</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">Thời gian: {formatDuration(result.durationMs)}</p>
                <p className="mt-2 font-script text-3xl text-olive">
                  {result.score === result.total ? "Bạn hiểu dâu rể nhất rồi!" : result.score >= result.total / 2 ? "Giỏi quá!" : "Cảm ơn bạn đã chơi!"}
                </p>
                {result.bonus === "granted" && <p className="mt-3 rounded-xl bg-olive/10 px-3 py-2 text-sm font-medium text-olive-deep">🎡 Bạn được tặng thêm 1 lượt quay! Sang Vòng quay may mắn để quay nhé.</p>}
                {result.bonus === "already" && <p className="mt-3 text-sm text-ink-soft">Bạn đã nhận lượt quay thưởng từ đố vui rồi (chỉ nhận một lần).</p>}
                {result.bonus === "none" && result.score < Math.min(QUIZ_BONUS_SCORE, result.total) && (
                  <p className="mt-3 text-sm text-ink-soft">Đúng từ {Math.min(QUIZ_BONUS_SCORE, result.total)}/{result.total} câu sẽ được tặng thêm 1 lượt quay – chơi lại để thử nhé!</p>
                )}
              </div>
              <Leaderboard game="quiz" version={version} />
              {result.correct.length > 0 && (
                <details className="rounded-2xl bg-white/80 p-3 text-sm ring-1 ring-line">
                  <summary className="cursor-pointer font-medium text-ink">Xem đáp án</summary>
                  <div className="mt-2 space-y-2">
                    {questions.map((q, i) => {
                      const ok = answers[i] === result.correct[i];
                      return (
                        <div key={i}>
                          <p className="whitespace-pre-line font-medium text-ink">
                            {ok ? "✅" : "❌"} {q.question}
                          </p>
                          <p className="text-ink-soft">Đáp án: <b className="text-olive-deep">{q.options[result.correct[i]]}</b></p>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPhase("intro")} className="btn btn-outline">
                  Quay về
                </button>
                <button type="button" onClick={start} className="btn btn-primary">
                  Chơi lại
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          Câu {current + 1}/{questions.length}
        </span>
        <span className={`tabular-nums ${left <= 5 ? "font-semibold text-rose" : ""}`}>⏱ {left}s</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full bg-olive transition-all duration-1000 ease-linear" style={{ width: `${(left / perQuestion) * 100}%` }} />
      </div>
      <p className="mt-6 whitespace-pre-line font-serif text-xl leading-snug text-ink">{q.question}</p>
      <div className="mt-5 grid gap-2.5">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={phase === "submitting"}
            onClick={() => choose(i)}
            className="rounded-2xl border border-line bg-white px-4 py-3.5 text-left text-[15px] text-ink transition hover:border-olive hover:bg-olive/5 active:scale-[0.99]"
          >
            <span className="mr-2 font-semibold text-olive">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>
      {phase === "submitting" && <p className="mt-4 text-center text-sm text-ink-soft">Đang chấm điểm…</p>}
      {error && <p className="mt-4 text-center text-sm text-[#8a4a3e]">{error}</p>}
    </div>
  );
}
