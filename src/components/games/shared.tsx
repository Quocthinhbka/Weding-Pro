"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { GuestState } from "@/lib/queries";
import { formatDuration } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";

/** Yêu cầu khách nhập tên + số điện thoại trước khi chơi (để trao quà đúng người). */
export function JoinGate({ children }: { children: ReactNode }) {
  const { state, setState } = useGuest();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!state) return <p className="py-10 text-center text-sm text-ink-soft">Đang tải…</p>;
  if (state.guest?.phone) return <>{children}</>;

  const displayName = name ?? state.rsvp?.name ?? state.guest?.name ?? "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setState(await postJson<GuestState>("/api/guest", { name: displayName, phone }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-[2rem] bg-paper/70 p-6 ring-1 ring-line">
      <p className="text-center text-sm text-ink-soft">Cho chúng mình biết bạn là ai để trao quà đúng người nhé!</p>
      <input className="field" placeholder="Tên của bạn *" value={displayName} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      <input className="field" placeholder="Số điện thoại *" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
      {error && <p className="text-sm text-[#8a4a3e]">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Đang lưu…" : "Vào chơi"}
      </button>
    </form>
  );
}

type Row = { name: string; score: number | null; total: number | null; moves: number | null; durationMs: number; me: boolean };

export function Leaderboard({ game, version = 0 }: { game: "quiz" | "memory"; version?: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/games/leaderboard?game=${game}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setRows(d.rows))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [game, version]);

  return (
    <div className="rounded-[2rem] bg-white/80 p-5 ring-1 ring-line">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-olive">Bảng xếp hạng</p>
      {!rows ? (
        <p className="py-4 text-center text-sm text-ink-soft">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-soft">Chưa có ai chơi – bạn sẽ là người đầu tiên!</p>
      ) : (
        <ol className="mt-3 divide-y divide-line/70">
          {rows.map((r, i) => (
            <li key={i} className={`flex items-center gap-3 py-2.5 text-sm ${r.me ? "font-semibold text-olive-deep" : "text-ink"}`}>
              <span className="w-6 text-center">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{r.name}{r.me && " (bạn)"}</span>
              {game === "quiz" && <span>{r.score}/{r.total}</span>}
              {game === "memory" && <span className="text-ink-soft">{r.moves} lượt</span>}
              <span className="w-20 text-right tabular-nums text-ink-soft">{formatDuration(r.durationMs)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
