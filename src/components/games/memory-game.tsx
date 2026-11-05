"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MEMORY_LEVELS, memoryLevel } from "@/content/games";
import { memoryImages } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { formatDuration } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";
import { Modal } from "@/components/ui/modal";
import { Leaderboard } from "./shared";

type Card = { id: number; image: string; matched: boolean };
type Best = { durationMs: number; moves: number } | null;
type Ending = { kind: "win" | "timeout"; durationMs: number; moves: number; matched: number; pairs: number; best: Best; bonus: boolean };

function shuffledDeck(images: string[]): Card[] {
  const deck = [...images, ...images].map((image, id) => ({ id, image, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Lật hình ghép cặp theo 3 level (6 cặp 4×3 / 45 giây, 8 cặp 4×4 / 60 giây, 10 cặp 4×5 / 75 giây).
 * Đang chơi chỉ hiện đồng hồ đếm ngược và thanh thời gian rút dần; xong hoặc hết giờ mới hiện hộp thoại kết quả + bảng xếp hạng.
 */
export function MemoryGame() {
  const config = useWedding();
  const { refresh } = useGuest();
  const [level, setLevel] = useState<number>(1);
  const spec = memoryLevel(level)!;
  const images = memoryImages(config, level);
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const lock = useRef(false);

  const playing = attemptId !== null && !ending;
  const enough = images.length >= spec.pairs;
  const totalMs = spec.seconds * 1000;
  const left = Math.max(0, totalMs - elapsed);

  // Số lượt và số cặp đã ghép hiện tại, để lúc hết giờ (trong bộ đếm) đọc được giá trị mới nhất.
  const progress = useRef({ moves: 0, matched: 0 });
  useEffect(() => {
    progress.current = { moves, matched: deck.filter((c) => c.matched).length / 2 };
  }, [moves, deck]);

  // Đồng hồ đếm ngược. Hết giờ: dừng ván chơi và hiện kết quả (ván này không được tính vào bảng xếp hạng).
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const e = Date.now() - startedAt;
      if (e < totalMs) return setElapsed(e);
      clearInterval(t);
      lock.current = true;
      setElapsed(totalMs);
      setEnding({ kind: "timeout", durationMs: totalMs, moves: progress.current.moves, matched: progress.current.matched, pairs: spec.pairs, best: null, bonus: false });
    }, 100);
    return () => clearInterval(t);
  }, [playing, startedAt, totalMs, spec.pairs]);

  async function start() {
    setError("");
    try {
      const data = await postJson<{ attemptId: number }>("/api/games/memory/start", { level });
      lock.current = false;
      setDeck(shuffledDeck(images));
      setOpen([]);
      setMoves(0);
      setEnding(null);
      setStartedAt(Date.now());
      setElapsed(0);
      setAttemptId(data.attemptId);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function finish(totalMoves: number, matched: number) {
    lock.current = true;
    try {
      const data = await postJson<{ durationMs: number; moves: number; best: Best; bonus: boolean }>("/api/games/memory/finish", { attemptId, moves: totalMoves });
      setEnding({ kind: "win", durationMs: data.durationMs, moves: data.moves, matched, pairs: spec.pairs, best: data.best, bonus: data.bonus });
      setVersion((v) => v + 1);
      if (data.bonus) refresh(); // có thêm lượt quay
    } catch (err) {
      setError((err as Error).message);
      setAttemptId(null);
      setDeck([]);
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
      if (nextDeck.every((c) => c.matched)) finish(totalMoves, nextDeck.length / 2);
    } else {
      lock.current = true;
      setTimeout(() => {
        setOpen([]);
        lock.current = false;
      }, 750);
    }
  }

  /** "Quay về": đóng kết quả, trở lại màn chọn level. */
  function backToMenu() {
    setEnding(null);
    setAttemptId(null);
    setDeck([]);
  }

  // ---- Đang chơi: chỉ có đồng hồ đếm ngược, thanh thời gian rút dần và bàn chơi
  if (attemptId !== null) {
    const secs = Math.ceil(left / 1000);
    const danger = left <= 10_000;
    return (
      <div className="space-y-4">
        <div>
          <p className={`text-center font-serif text-4xl tabular-nums ${danger ? "text-rose" : "text-olive-deep"}`} aria-live="off">
            ⏱ {secs}<span className="ml-1 text-xl">giây</span>
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={spec.seconds} aria-valuenow={secs}>
            <div className={`h-full rounded-full transition-[width] duration-200 ease-linear ${danger ? "bg-rose" : "bg-olive"}`} style={{ width: `${(left / totalMs) * 100}%` }} />
          </div>
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

        <Modal open={!!ending} onClose={backToMenu} title={ending?.kind === "win" ? `Hoàn thành level ${level}! 🎉` : "Hết giờ rồi! ⏰"}>
          {ending && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-line">
                {ending.kind === "win" ? (
                  <>
                    <p className="text-ink">
                      <b className="text-olive-deep">{ending.moves}</b> lượt lật · <b className="text-olive-deep">{formatDuration(ending.durationMs)}</b>
                    </p>
                    {ending.best && (
                      <p className="mt-1 text-sm text-ink-soft">
                        Kỷ lục level {level} của bạn: {ending.best.moves} lượt · {formatDuration(ending.best.durationMs)}
                      </p>
                    )}
                    {ending.bonus && <p className="mt-2 rounded-xl bg-olive/10 px-3 py-2 text-sm font-medium text-olive-deep">🎡 Bạn được tặng thêm 1 lượt quay! Sang Vòng quay may mắn để quay nhé.</p>}
                  </>
                ) : (
                  <>
                    <p className="text-ink">
                      Bạn ghép được <b className="text-olive-deep">{ending.matched}/{ending.pairs}</b> cặp trong {spec.seconds} giây.
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">Ván hết giờ không được tính vào bảng xếp hạng. Chơi lại nhé!</p>
                  </>
                )}
              </div>
              <Leaderboard game="memory" level={level} version={version} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={backToMenu} className="btn btn-outline">
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

  // ---- Chọn level
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Level">
        {MEMORY_LEVELS.map((l) => (
          <button
            key={l.level}
            type="button"
            role="tab"
            aria-selected={level === l.level}
            onClick={() => setLevel(l.level)}
            className={`rounded-2xl px-2 py-2.5 text-center text-sm ring-1 transition ${level === l.level ? "bg-olive text-white ring-olive-deep" : "bg-white/80 text-ink ring-line"}`}
          >
            <span className="block font-semibold">Level {l.level}</span>
            <span className="block text-[11px] opacity-85">
              {l.pairs} cặp · {l.seconds} giây
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-1.5 rounded-[2rem] bg-paper/70 p-5 text-center text-sm leading-relaxed text-ink-soft ring-1 ring-line">
        <p>
          <b className="text-ink">{spec.pairs} cặp</b> · bàn {spec.cols}×{spec.rows} · <b className="text-ink">{spec.seconds} giây</b>
        </p>
        <p>
          Xếp hạng: ít lượt lật nhất, rồi nhanh nhất.
          <br />
          Lần đầu xong mỗi level: +1 lượt quay 🎡
        </p>
        {!enough && (
          <p className="text-[#8a4a3e]">
            Level này cần {spec.pairs} ảnh, mới có {images.length}.
            <br />
            Quản trị viên cần chọn thêm ảnh.
          </p>
        )}
        {error && <p className="text-[#8a4a3e]">{error}</p>}
        <button type="button" onClick={start} disabled={!enough} className="btn btn-primary mt-3 w-full">
          Bắt đầu level {level}
        </button>
      </div>
      <Leaderboard game="memory" level={level} version={version} />
    </div>
  );
}
