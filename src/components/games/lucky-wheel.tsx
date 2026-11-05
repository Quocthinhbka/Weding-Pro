"use client";

import { useEffect, useState } from "react";
import { MAX_SPIN_CREDITS, QUIZ_BONUS_SCORE } from "@/content/games";
import type { GuestState } from "@/lib/queries";
import { formatVnTime } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";

type Prize = { id: number; label: string; color: string };
type SpinResult = NonNullable<GuestState["spin"]>;
type Winner = { name: string; label: string; at: number };

const R = 150;
const SPIN_MS = 5200;

function point(angleDeg: number, r = R) {
  const a = (angleDeg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
}

function wrap(label: string, max = 10) {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + word).length <= max) lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
  }
  return lines;
}

/** Góc quay để ô thứ index nằm dưới kim (kim ở đỉnh). */
function angleFor(index: number, count: number) {
  return 360 - (index + 0.5) * (360 / count);
}

export function LuckyWheel() {
  const { state, setState } = useGuest();
  const [prizes, setPrizes] = useState<Prize[] | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [tab, setTab] = useState<"winners" | "history">("winners");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/games/wheel", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { prizes: Prize[]; winners: Winner[] }) => {
        setPrizes(d.prizes);
        setWinners(d.winners);
      })
      .catch(() => setError("Không tải được vòng quay"));
  }, []);

  const credits = state?.credits ?? 0;
  const history = state?.spins ?? [];

  async function spin() {
    if (!prizes || spinning || !state) return;
    setError("");
    setResult(null);
    setSpinning(true);
    try {
      const data = await postJson<{ prizeId: number; credits: number; spin: SpinResult }>("/api/games/wheel/spin");
      const idx = Math.max(0, prizes.findIndex((p) => p.id === data.prizeId));
      const seg = 360 / prizes.length;
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      const target = angleFor(idx, prizes.length) + jitter;
      setRotation((r) => r + 360 * 6 + ((((target - r) % 360) + 360) % 360));
      setTimeout(() => {
        setSpinning(false);
        setResult(data.spin);
        // Cập nhật lượt còn lại và lịch sử sau khi vòng quay dừng (không lộ kết quả sớm).
        setState({ ...state, credits: data.credits, spin: data.spin, spins: [data.spin, ...state.spins] });
        if (data.spin.isWin) setWinners((w) => [{ name: state.guest?.name ?? "Bạn", label: data.spin.label, at: data.spin.at }, ...w]);
      }, SPIN_MS);
    } catch (err) {
      setSpinning(false);
      setError((err as Error).message);
    }
  }

  if (!prizes) return <p className="py-10 text-center text-sm text-ink-soft">{error || "Đang tải…"}</p>;

  const seg = 360 / prizes.length;
  // Lượt đang quay đã bị trừ ở máy chủ nhưng chưa hiện ra: hiển thị cộng thêm 1 cho đến khi vòng quay dừng.
  const shownCredits = credits;

  return (
    <div className="text-center">
      <div className="relative mx-auto aspect-square w-full max-w-[340px]">
        {/* Kim chỉ */}
        <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
          <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden>
            <path d="M17 44 L3 12 A15 15 0 1 1 31 12 Z" fill="var(--rose)" stroke="#fff" strokeWidth="3" />
            <circle cx="17" cy="15" r="5" fill="#fff" />
          </svg>
        </div>
        <svg
          viewBox="-160 -160 320 320"
          className="h-full w-full drop-shadow-xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.6, 0.1, 1)` : "none",
          }}
        >
          <circle r="158" fill="var(--olive)" />
          {prizes.map((p, i) => {
            const a0 = i * seg;
            const a1 = (i + 1) * seg;
            const mid = a0 + seg / 2;
            return (
              <g key={p.id}>
                <path d={`M0 0 L${point(a0)} A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${point(a1)} Z`} fill={p.color} stroke="#fff" strokeWidth="2" />
                <g transform={`rotate(${mid}) translate(0 -${R * 0.62})`}>
                  <text textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-be)">
                    {wrap(p.label).map((line, j, arr) => (
                      <tspan key={j} x="0" dy={j === 0 ? `${-(arr.length - 1) * 0.55}em` : "1.1em"}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}
          {Array.from({ length: 24 }, (_, i) => (
            <circle key={i} cx={0} cy={-154} r="2.6" fill="#fff" opacity="0.85" transform={`rotate(${i * 15})`} />
          ))}
        </svg>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || shownCredits <= 0}
          className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream text-sm font-semibold uppercase tracking-wider text-olive-deep shadow-lg ring-4 ring-white disabled:opacity-100"
        >
          {spinning ? "…" : shownCredits <= 0 ? <Daisy size={44} /> : "Quay"}
        </button>
      </div>

      {/* Số lượt quay */}
      <div className="mx-auto mt-4 max-w-[340px] rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-line">
        <p className="text-ink">
          Lượt quay còn lại: <b className="text-lg text-olive-deep">{shownCredits}</b>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          Mỗi ngày +1 lượt, dồn tối đa {MAX_SPIN_CREDITS}.
          <br />
          Thưởng thêm: đố vui đúng {QUIZ_BONUS_SCORE}/10 câu,
          <br />
          xong mỗi level lật hình.
        </p>
        {shownCredits <= 0 && !spinning && <p className="mt-1 text-xs font-medium text-[#8a4a3e]">Hết lượt rồi, mai quay tiếp nhé!</p>}
      </div>

      {error && <p className="mt-4 text-sm text-[#8a4a3e]">{error}</p>}

      {result && !spinning && (
        <div className="mt-4 rounded-[2rem] bg-cream p-6 shadow-sm ring-1 ring-line">
          {result.isWin ? (
            <>
              <p className="font-script text-4xl text-olive">Chúc mừng bạn!</p>
              <p className="mt-2 text-ink">
                Bạn đã trúng <b>{result.label}</b>
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-soft">Mã đổi quà</p>
              <p className="font-serif text-4xl tracking-[0.3em] text-olive-deep">{result.code}</p>
              <p className="mt-3 text-sm text-ink-soft">Hãy đưa mã này cho cô dâu chú rể tại tiệc để nhận quà nhé!</p>
            </>
          ) : (
            <>
              <p className="font-script text-4xl text-olive">Chúc bạn may mắn!</p>
              <p className="mt-2 text-sm text-ink-soft">Lần này chưa trúng quà, nhưng vẫn còn bốc số may mắn tại tiệc đó!</p>
            </>
          )}
        </div>
      )}

      {/* Hai tab: người trúng quà (mặc định) và lịch sử quay của bạn */}
      <div className="mt-5 rounded-[1.75rem] bg-white/80 p-3 text-left ring-1 ring-line">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1 text-xs font-medium" role="tablist" aria-label="Danh sách">
          {([["winners", `🏆 Người may mắn (${winners.length})`], ["history", `🕘 Lịch sử quay (${history.length})`]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-2 py-2 transition ${tab === k ? "bg-olive text-white shadow" : "text-ink-soft"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "winners" ? (
          winners.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-soft">
              Chưa ai trúng quà.
              <br />
              Bạn có thể là người đầu tiên!
            </p>
          ) : (
            <ol className="mt-2 max-h-56 divide-y divide-line/70 overflow-y-auto text-sm">
              {winners.map((w, i) => (
                <li key={`${w.at}-${i}`} className="flex items-start gap-3 px-1 py-2">
                  <span className="w-24 shrink-0 text-xs tabular-nums text-ink-soft">{formatVnTime(w.at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{w.name}</span>
                    <span className="block text-xs text-olive-deep">🎁 {w.label}</span>
                  </span>
                </li>
              ))}
            </ol>
          )
        ) : history.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">Bạn chưa quay lần nào.</p>
        ) : (
          <ol className="mt-2 max-h-56 divide-y divide-line/70 overflow-y-auto text-sm">
            {history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex items-start gap-3 px-1 py-2">
                <span className="w-24 shrink-0 text-xs tabular-nums text-ink-soft">{formatVnTime(h.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className={h.isWin ? "font-semibold text-olive-deep" : "text-ink-soft"}>{h.isWin ? `🎁 ${h.label}` : h.label}</span>
                  {h.isWin && h.code && (
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      Mã <b className="font-mono tracking-widest text-ink">{h.code}</b> · {h.claimed ? "đã nhận quà" : "chưa nhận quà"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
