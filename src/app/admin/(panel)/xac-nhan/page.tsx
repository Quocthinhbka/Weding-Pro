import { connection } from "next/server";
import { rsvpGroups } from "@/content/wedding";
import { getConfig } from "@/lib/config";
import { ActionButton } from "@/components/admin/controls";
import { all } from "@/lib/db";
import { formatLucky } from "@/lib/game-logic";
import { formatDateTime } from "@/lib/http";
import type { Rsvp } from "@/lib/queries";
import { deleteRsvp } from "../../actions";

function eventLabels(groups: { key: string; label: string }[], events: string) {
  const keys = JSON.parse(events) as string[];
  return groups.filter((g) => keys.includes(g.key)).map((g) => g.label).join(", ");
}

export default async function RsvpsPage() {
  await connection();
  const rows = all<Rsvp>("SELECT * FROM rsvps ORDER BY updated_at DESC");
  const groups = rsvpGroups(getConfig());
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold">Xác nhận tham dự</h1>
        <a href="/api/admin/rsvps" className="btn btn-outline ml-auto !py-2 !text-xs">
          ⬇ Tải file Excel (CSV)
        </a>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-cream ring-1 ring-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-paper-deep/50 text-left">
            <tr>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Tham dự</th>
              <th className="px-3 py-2">Số người</th>
              <th className="px-3 py-2">Bên</th>
              <th className="px-3 py-2">Sự kiện</th>
              <th className="px-3 py-2">SĐT</th>
              <th className="px-3 py-2">Số may mắn</th>
              <th className="px-3 py-2">Lời nhắn</th>
              <th className="px-3 py-2">Cập nhật</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-ink-soft">Chưa có ai xác nhận.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">{r.attending ? "✅ Có" : "❌ Không"}</td>
                <td className="px-3 py-2">{r.attending ? r.party_size : "–"}</td>
                <td className="px-3 py-2">{r.side === "trai" ? "Nhà trai" : "Nhà gái"}</td>
                <td className="px-3 py-2">{eventLabels(groups, r.events) || "–"}</td>
                <td className="px-3 py-2">{r.phone ?? "–"}</td>
                <td className="px-3 py-2">{r.attending && r.lucky_number ? formatLucky(r.lucky_number) : "–"}</td>
                <td className="max-w-[240px] whitespace-pre-line px-3 py-2 text-ink-soft">{r.note}</td>
                <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{formatDateTime(r.updated_at)}</td>
                <td className="px-3 py-2">
                  <ActionButton action={deleteRsvp.bind(null, r.id)} confirm={`Xoá xác nhận của "${r.name}"?`}>
                    Xoá
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
