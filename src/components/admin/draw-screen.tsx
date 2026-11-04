"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { drawLucky, undoDraw } from "@/app/admin/actions";
import { formatLucky } from "@/lib/game-logic";
import { Daisy, DaisySprig } from "@/components/ui/daisy";

type Draw = { id: number; lucky_number: number; name: string; drawn_at: number };

/** Màn hình bốc số tại tiệc – chiếu lên máy chiếu / TV. */
export function DrawScreen({ draws, maxNumber, groups, title }: { draws: Draw[]; maxNumber: number; groups: { key: string; label: string }[]; title: string }) {
  const router = useRouter();
  const [group, setGroup] = useState("all");
  const [display, setDisplay] = useState<string>("???");
  const [winner, setWinner] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);

  async function roll() {
    setError("");
    setWinner(null);
    setRolling(true);
    const ticker = setInterval(() => setDisplay(formatLucky(1 + Math.floor(Math.random() * Math.max(maxNumber, 99)))), 70);
    const [res] = await Promise.all([drawLucky(group), new Promise((r) => setTimeout(r, 3200))]);
    clearInterval(ticker);
    setRolling(false);
    if ("error" in res) {
      setDisplay("???");
      setError(res.error ?? "Không bốc được số");
      return;
    }
    setDisplay(formatLucky(res.luckyNumber));
    setWinner(res.name);
    router.refresh();
  }

  return (
    <div ref={root} className="paper-bg relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-6 text-center">
      <DaisySprig className="absolute -left-6 bottom-0 w-48 opacity-60" />
      <DaisySprig className="absolute -right-6 top-0 w-44 rotate-180 opacity-50" />
      <div className="flex w-full max-w-5xl items-center gap-3 text-sm">
        <Link href="/admin" className="text-ink-soft hover:text-ink">‹ Quản trị</Link>
        <select className="field ml-auto !w-auto !py-1.5 text-sm" value={group} onChange={(e) => setGroup(e.target.value)} disabled={rolling}>
          <option value="all">Tất cả khách tham dự</option>
          {groups.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
        <button type="button" className="btn btn-outline !py-1.5 !text-xs" onClick={() => root.current?.requestFullscreen?.()}>
          Toàn màn hình
        </button>
      </div>

      <p className="mt-10 text-sm uppercase tracking-[0.5em] text-ink-soft">Bốc số may mắn</p>
      <h1 className="mt-2 font-script text-5xl text-olive md:text-7xl">
        {title}
      </h1>

      <div className={`mt-10 rounded-[3rem] bg-cream px-14 py-8 shadow-2xl ring-1 ring-line ${rolling ? "" : "animate-float"}`}>
        <p className="font-serif text-[9rem] leading-none tracking-[0.1em] text-olive-deep tabular-nums md:text-[12rem]">{display}</p>
      </div>
      <p className="mt-6 h-12 font-script text-4xl text-ink md:text-5xl">{winner && `🎉 ${winner}`}</p>
      {error && <p className="text-lg text-[#8a4a3e]">{error}</p>}

      <button type="button" onClick={roll} disabled={rolling} className="btn btn-primary mt-6 !px-12 !py-4 !text-lg">
        <Daisy size={26} /> {rolling ? "Đang quay…" : "Quay số"}
      </button>

      {draws.length > 0 && (
        <div className="mt-10 w-full max-w-2xl rounded-3xl bg-cream/90 p-5 ring-1 ring-line">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">Đã trúng</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {draws.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-left">
                <span className="font-serif text-2xl text-olive-deep">{formatLucky(d.lucky_number)}</span>
                <span className="flex-1 truncate">{d.name}</span>
                <button
                  type="button"
                  className="text-xs text-ink-soft hover:text-ink"
                  onClick={async () => {
                    if (window.confirm(`Huỷ kết quả số ${formatLucky(d.lucky_number)}? Số này sẽ được bốc lại.`)) {
                      await undoDraw(d.id);
                      router.refresh();
                    }
                  }}
                >
                  Huỷ
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
