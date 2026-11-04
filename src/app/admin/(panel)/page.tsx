import { connection } from "next/server";
import { rsvpGroups } from "@/content/wedding";
import { getConfig } from "@/lib/config";
import { all, get } from "@/lib/db";

type Row = { attending: number; party_size: number; side: string; events: string };

export default async function Dashboard() {
  await connection();
  const rsvps = all<Row>("SELECT attending, party_size, side, events FROM rsvps");
  const yes = rsvps.filter((r) => r.attending);
  const people = (rows: Row[]) => rows.reduce((s, r) => s + r.party_size, 0);
  const count = (sql: string) => get<{ n: number }>(sql)!.n;

  const cards = [
    ["Lời mời đã tạo", count("SELECT COUNT(*) AS n FROM invites")],
    ["Đã phản hồi", rsvps.length],
    ["Sẽ tham dự", `${yes.length} lượt · ${people(yes)} người`],
    ["Không đến được", rsvps.length - yes.length],
    ["Lời chúc", count("SELECT COUNT(*) AS n FROM wishes")],
    ["Lượt quay", count("SELECT COUNT(*) AS n FROM spins")],
    ["Quà chưa trao", count("SELECT COUNT(*) AS n FROM spins WHERE is_win = 1 AND claimed_at IS NULL")],
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold">Tổng quan</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-cream p-4 ring-1 ring-line">
            <p className="text-xs text-ink-soft">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Số người tham dự theo sự kiện</h2>
        <div className="overflow-x-auto rounded-2xl bg-cream ring-1 ring-line">
          <table className="w-full text-sm">
            <thead className="bg-paper-deep/50 text-left">
              <tr>
                <th className="px-4 py-2">Sự kiện</th>
                <th className="px-4 py-2">Khách nhà trai</th>
                <th className="px-4 py-2">Khách nhà gái</th>
                <th className="px-4 py-2">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {rsvpGroups(getConfig()).map((g) => {
                const rows = yes.filter((r) => (JSON.parse(r.events) as string[]).includes(g.key));
                return (
                  <tr key={g.key} className="border-t border-line">
                    <td className="px-4 py-2 font-medium">{g.label}</td>
                    <td className="px-4 py-2">{people(rows.filter((r) => r.side === "trai"))}</td>
                    <td className="px-4 py-2">{people(rows.filter((r) => r.side === "gai"))}</td>
                    <td className="px-4 py-2 font-semibold">{people(rows)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
