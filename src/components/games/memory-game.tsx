"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEMORY_LEVELS, memoryLevel } from "@/content/games";
import { memoryImages } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { formatDuration } from "@/lib/wedding-time";
import { postJson } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";
import { Leaderboard } from "./shared";

type Card = { id: number; image: string; matched: boolean };
type Best = { durationMs: number; moves: number } | null;

function shuffledDeck(images: string[]): Card[] {
  const deck = [...images, ...images].map((image, id) => ({ id, image, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Lật hình ghép cặp theo 3 level: 6 cặp (4×3), 8 cặp (4×4), 10 cặp (4×5). */
export function MemoryGame() {
  const config = useWedding();
  const [level, setLevel] = useState<number>(1);
  const spec = memoryLevel(level)!;
  const images = memoryImages(config, spec.pairs);
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ durationMs: number; moves: number; best: Best } | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const lock = useRef(false);

  const playing = attemptId !== null && !result;
  const enough = images.length >= spec.pairs;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(t);
  }, [playing, startedAt]);

  function pickLevel(n: number) {
    if (playing) return; // đang chơi thì không đổi level
    setLevel(n);
    setDeck([]);
    setResult(null);
    setAttemptId(null);
    setError("");
  }

  async function start() {
    setError("");
    try {
      const data = await postJson<{ attemptId: number }>("/api/games/memory/start", { level });
      setDeck(shuffledDeck(images));
      setOpen([]);
      setMoves(0);
      setResult(null);
      setStartedAt(Date.now());
      setElapsed(0);
      setAttemptId(data.attemptId);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function finish(totalMoves: number) {
    try {
      const data = await postJson<{ durationMs: number; moves: number; best: Best }>("/api/games/memory/finish", { attemptId, moves: totalMoves });
      setResult(data);
      setVersion((v) => v + 1);
    } catch (err) {
      setError((err as Error).message);
      setAttemptId(null);
    }
  }

  function flip(index: number) {
    if (!playing || lock.current) return;
    const card = deck[index];
    if (card.matched || open.includes(index)) return;
    const nextOpen = [...open, index];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const totalMoves = moves + 1;
    setMoves(totalMoves);
    const [a, b] = nextOpen;
    if (deck[a].image === deck[b].image) {
      const nextDeck = deck.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
      setDeck(nextDeck);
      setOpen([]);
      if (nextDeck.every((c) => c.matched)) finish(totalMoves);
    } else {
      lock.current = true;
      setTimeout(() => {
        setOpen([]);
        lock.current = false;
      }, 750);
    }
  }

  return (
    <div className="space-y-5">
      {/* Chọn level */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Level">
        {MEMORY_LEVELS.map((l) => (
          <button
            key={l.level}
            type="button"
            role="tab"
            aria-selected={level === l.level}
            disabled={playing && level !== l.level}
            onClick={() => pickLevel(l.level)}
            className={`rounded-2xl px-2 py-2.5 text-center text-sm ring-1 transition disabled:opacity-40 ${level === l.level ? "bg-olive text-white ring-olive-deep" : "bg-white/80 text-ink ring-line"}`}
          >
            <span className="block font-semibold">Level {l.level}</span>
            <span className="block text-[11px] opacity-85">
              {l.pairs} cặp · {l.cols}×{l.rows}
            </span>
          </button>
        ))}
      </div>

      {attemptId === null && !result && (
        <div className="rounded-[2rem] bg-paper/70 p-6 text-center text-sm leading-relaxed text-ink-soft ring-1 ring-line">
          <p>Lật 2 thẻ mỗi lượt để tìm {spec.pairs} cặp ảnh giống nhau (bàn chơi {spec.cols} cột × {spec.rows} hàng).</p>
          <p className="mt-1">Hoàn thành nhanh nhất để lên bảng xếp hạng của level – chơi lại bao nhiêu lần cũng được!</p>
          {!enough && <p className="mt-3 text-[#8a4a3e]">Level này cần ít nhất {spec.pairs} ảnh trong album (hiện có {config.album.length}).</p>}
          {error && <p className="mt-3 text-[#8a4a3e]">{error}</p>}
          <button type="button" onClick={start} disabled={!enough} className="btn btn-primary mt-5 w-full">
            Bắt đầu level {level}
          </button>
        </div>
      )}

      {deck.length > 0 && (
        <>
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Lượt: {moves}</span>
            <span className="tabular-nums">⏱ {formatDuration(result?.durationMs ?? elapsed)}</span>
          </div>
          <div className="mx-auto grid gap-2" style={{ perspective: "800px", gridTemplateColumns: `repeat(${spec.cols}, minmax(0, 1fr))`, maxWidth: spec.rows >= 5 ? "17.5rem" : spec.rows === 4 ? "20rem" : "100%" }}>
            {deck.map((card, i) => {
              const faceUp = card.matched || open.includes(i);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => flip(i)}
                  aria-label={faceUp ? "Thẻ đã lật" : "Lật thẻ"}
                  className="relative aspect-[3/4] transition-transform duration-500 [transform-style:preserve-3d]"
                  style={{ transform: faceUp ? "rotateY(180deg)" : "none" }}
                >
                  <span className="absolute inset-0 grid place-items-center rounded-xl bg-olive shadow ring-1 ring-olive-deep [backface-visibility:hidden]">
                    <Daisy size={32} />
                  </span>
                  <span className={`absolute inset-0 overflow-hidden rounded-xl bg-white ring-2 [backface-visibility:hidden] [transform:rotateY(180deg)] ${card.matched ? "ring-daisy" : "ring-white"}`}>
                    <Image src={card.image} alt="" fill sizes="110px" className="object-cover" />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {result && (
        <div className="rounded-[2rem] bg-cream p-6 text-center shadow-sm ring-1 ring-line">
          <p className="font-script text-4xl text-olive">Hoàn thành level {level}!</p>
          <p className="mt-2 text-ink">
            {formatDuration(result.durationMs)} · {result.moves} lượt
          </p>
          {result.best && (
            <p className="mt-1 text-sm text-ink-soft">
              Kỷ lục level {level} của bạn: {formatDuration(result.best.durationMs)} · {result.best.moves} lượt
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={start} className="btn btn-primary">
              Chơi lại level {level}
            </button>
            {level < MEMORY_LEVELS.length && (
              <button type="button" onClick={() => pickLevel(level + 1)} className="btn btn-outline">
                Level {level + 1} ›
              </button>
            )}
          </div>
        </div>
      )}

      {error && attemptId !== null && <p className="text-center text-sm text-[#8a4a3e]">{error}</p>}
      <Leaderboard game="memory" level={level} version={version} />
    </div>
  );
}
