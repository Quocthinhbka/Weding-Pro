"use client";

import { useEffect, useState } from "react";
import type { GuestState } from "@/lib/queries";
import { postJson, useGuest } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";

type Prize = { id: number; label: string; color: string };
type SpinResult = NonNullable<GuestState["spin"]>;

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
  const { state, setState, openRsvp } = useGuest();
  const [prizes, setPrizes] = useState<Prize[] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/games/wheel", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: GuestState & { prizes: Prize[] }) => {
        setPrizes(d.prizes);
        if (d.spin) {
          setResult(d.spin);
          const idx = d.prizes.findIndex((p) => p.label === d.spin!.label);
          if (idx >= 0) setRotation(angleFor(idx, d.prizes.length));
        }
      })
      .catch(() => setError("Không tải được vòng quay"));
  }, []);

  async function spin() {
    if (!prizes || spinning) return;
    setError("");
    setSpinning(true);
    try {
      const data = await postJson<{ prizeId: number; spin: SpinResult; already: boolean }>("/api/games/wheel/spin");
      const idx = Math.max(0, prizes.findIndex((p) => p.id === data.prizeId));
      const seg = 360 / prizes.length;
      const jitter = (Math.random() - 0.5) * seg * 0.6;
      const target = angleFor(idx, prizes.length) + jitter;
      setRotation((r) => r + 360 * 6 + ((((target - r) % 360) + 360) % 360));
      setTimeout(() => {
        setSpinning(false);
        setResult(data.spin);
        if (state) setState({ ...state, spin: data.spin });
      }, SPIN_MS);
    } catch (err) {
      setSpinning(false);
      setError((err as Error).message);
    }
  }

  if (!prizes) return <p className="py-10 text-center text-sm text-ink-soft">{error || "Đang tải…"}</p>;

  const seg = 360 / prizes.length;
  const attending = state?.rsvp?.attending;

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
          disabled={spinning || !!result || !attending}
          className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cream text-sm font-bold uppercase tracking-wider text-olive-deep shadow-lg ring-4 ring-white disabled:opacity-100"
        >
          {result ? <Daisy size={44} /> : spinning ? "…" : "Quay"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-[#8a4a3e]">{error}</p>}

      {!attending && !result && (
        <div className="mt-6 rounded-2xl bg-paper p-5 text-sm text-ink-soft">
          Mỗi khách đã xác nhận tham dự có 1 lượt quay.
          <button type="button" onClick={openRsvp} className="btn btn-primary mt-3 w-full">
            Xác nhận tham dự để quay
          </button>
        </div>
      )}

      {result && !spinning && (
        <div className="mt-6 rounded-[2rem] bg-cream p-6 shadow-sm ring-1 ring-line">
          {result.isWin ? (
            <>
              <p className="font-script text-4xl text-olive">Chúc mừng bạn!</p>
              <p className="mt-2 text-ink">
                Bạn đã trúng <b>{result.label}</b>
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-ink-soft">Mã đổi quà</p>
              <p className="font-serif text-4xl tracking-[0.3em] text-olive-deep">{result.code}</p>
              <p className="mt-3 text-sm text-ink-soft">
                {result.claimed ? "Bạn đã nhận quà rồi 🎉" : "Hãy đưa mã này cho cô dâu chú rể tại tiệc để nhận quà nhé!"}
              </p>
            </>
          ) : (
            <>
              <p className="font-script text-4xl text-olive">Chúc bạn may mắn!</p>
              <p className="mt-2 text-sm text-ink-soft">Lần này chưa trúng quà, nhưng vẫn còn bốc số may mắn tại tiệc đó!</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
