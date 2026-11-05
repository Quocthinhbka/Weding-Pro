import { connection } from "next/server";
import { ActionButton } from "@/components/admin/controls";
import { PrizeEditor } from "@/components/admin/prize-editor";
import { all } from "@/lib/db";
import type { PrizeRow } from "@/lib/game-logic";
import { formatDateTime } from "@/lib/http";
import { leaderboard } from "@/lib/queries";
import { formatDuration } from "@/lib/wedding-time";
import { setSpinClaimed } from "../../actions";

type SpinRow = { id: number; name: string; phone: string | null; prize_label: string; is_win: number; claim_code: string | null; claimed_at: number | null; created_at: number };

export default async function GamesAdminPage() {
  await connection();
  const prizes = all<PrizeRow & { sort: number }>("SELECT * FROM prizes WHERE sort < 999 ORDER BY sort, id");
  const spins = all<SpinRow>(
    `SELECT s.id, g.name, g.phone, s.prize_label, s.is_win, s.claim_code, s.claimed_at, s.created_at
     FROM spins s JOIN guests g ON g.id = s.guest_id ORDER BY s.is_win DESC, s.created_at DESC`,
  );
  const boards = [
    ["Đố vui (top 10)", leaderboard("quiz")],
    ["Lật hình level 1 – 6 cặp (top 10)", leaderboard("memory", 10, 1)],
    ["Lật hình level 2 – 8 cặp (top 10)", leaderboard("memory", 10, 2)],
    ["Lật hình level 3 – 10 cặp (top 10)", leaderboard("memory", 10, 3)],
  ] as const;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-serif text-2xl font-semibold">Vòng quay may mắn</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Trọng số càng lớn càng dễ trúng. Để trống “Số lượng” nghĩa là không giới hạn. Giải hết số lượng sẽ tự động không ra nữa.
        </p>
        <div className="mt-4">
          <PrizeEditor
            initial={prizes.map((p) => ({ id: p.id, label: p.label, color: p.color, weight: p.weight, stock: p.stock, isWin: p.is_win === 1 }))}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Lượt quay ({spins.length})</h2>
        <div className="overflow-x-auto rounded-2xl bg-cream ring-1 ring-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper-deep/50 text-left">
              <tr>
                <th className="px-3 py-2">Khách</th>
                <th className="px-3 py-2">SĐT</th>
                <th className="px-3 py-2">Kết quả</th>
                <th className="px-3 py-2">Mã đổi quà</th>
                <th className="px-3 py-2">Lúc</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {spins.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.phone}</td>
                  <td className="px-3 py-2">{s.is_win ? `🎁 ${s.prize_label}` : <span className="text-ink-soft">{s.prize_label}</span>}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{s.claim_code ?? "–"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{formatDateTime(s.created_at)}</td>
                  <td className="px-3 py-2">
                    {s.is_win ? (
                      <ActionButton action={setSpinClaimed.bind(null, s.id, !s.claimed_at)}>
                        {s.claimed_at ? "✅ Đã trao" : "Đánh dấu đã trao"}
                      </ActionButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {boards.map(([title, rows]) => (
          <div key={title}>
            <h2 className="mb-3 font-semibold">{title}</h2>
            <ol className="divide-y divide-line rounded-2xl bg-cream ring-1 ring-line">
              {rows.length === 0 && <li className="px-4 py-4 text-sm text-ink-soft">Chưa có ai chơi.</li>}
              {rows.map((r, i) => (
                <li key={r.guest_id} className="flex gap-3 px-4 py-2 text-sm">
                  <span className="w-6">{i + 1}.</span>
                  <span className="flex-1 font-medium">{r.name}</span>
                  {r.score !== null && <span>{r.score}/{r.total}</span>}
                  {r.moves !== null && <span>{r.moves} lượt</span>}
                  <span className="text-ink-soft">{formatDuration(r.duration_ms)}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}
