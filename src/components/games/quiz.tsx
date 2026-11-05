"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/wedding-time";
import { postJson } from "@/components/site/guest";
import { Leaderboard } from "./shared";

type Question = { question: string; options: string[] };
type Start =
  | { finished: true; score: number; total: number; durationMs: number }
  | { finished: false; questions: Question[]; secondsPerQuestion: number };
type Result = { score: number; total: number; durationMs: number; correct: number[] };

export function Quiz({ total, seconds }: { total: number; seconds: number }) {
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
      if (data.finished) {
        setResult({ score: data.score, total: data.total, durationMs: data.durationMs, correct: [] });
        setPhase("result");
        return;
      }
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

  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-paper/70 p-6 text-center text-sm leading-relaxed text-ink-soft ring-1 ring-line">
          <p>Gồm <b className="text-ink">{total} câu hỏi</b>, mỗi câu có {perQuestion} giây.</p>
          <p className="mt-1">Chỉ tính <b className="text-ink">lượt chơi đầu tiên</b>. Nhiều điểm hơn và nhanh hơn sẽ xếp hạng cao hơn.</p>
          <p className="mt-1">Top 3 nhận quà tại tiệc cưới 🎁</p>
          {error && <p className="mt-3 text-[#8a4a3e]">{error}</p>}
          <button type="button" onClick={start} className="btn btn-primary mt-5 w-full">
            Bắt đầu
          </button>
        </div>
        <Leaderboard game="quiz" version={version} />
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-cream p-6 text-center shadow-sm ring-1 ring-line">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">Kết quả của bạn</p>
          <p className="mt-2 font-serif text-6xl text-olive-deep">
            {result.score}
            <span className="text-2xl text-ink-soft">/{result.total}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Thời gian: {formatDuration(result.durationMs)}</p>
          <p className="mt-3 font-script text-3xl text-olive">
            {result.score === result.total ? "Bạn hiểu dâu rể nhất rồi!" : result.score >= result.total / 2 ? "Giỏi quá!" : "Cảm ơn bạn đã chơi!"}
          </p>
        </div>
        {result.correct.length > 0 && (
          <div className="space-y-2">
            {questions.map((q, i) => {
              const ok = answers[i] === result.correct[i];
              return (
                <div key={i} className="rounded-2xl bg-white/80 p-4 text-sm ring-1 ring-line">
                  <p className="whitespace-pre-line font-medium text-ink">
                    {ok ? "✅" : "❌"} {q.question}
                  </p>
                  <p className="mt-1 text-ink-soft">Đáp án: <b className="text-olive-deep">{q.options[result.correct[i]]}</b></p>
                </div>
              );
            })}
          </div>
        )}
        <Leaderboard game="quiz" version={version} />
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
