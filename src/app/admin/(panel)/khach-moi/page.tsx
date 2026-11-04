import { connection } from "next/server";
import { ActionButton, CopyLink } from "@/components/admin/controls";
import { InviteForm } from "@/components/admin/invite-form";
import { all } from "@/lib/db";
import { siteOrigin } from "@/lib/http";
import { deleteInvite } from "../../actions";

type Row = { id: number; code: string; display_name: string; side: string | null; rsvp: string | null; attending: number | null; party_size: number | null };

export default async function InvitesPage() {
  await connection();
  const origin = await siteOrigin();
  const invites = all<Row>(
    `SELECT i.id, i.code, i.display_name, i.side, r.name AS rsvp, r.attending, r.party_size
     FROM invites i
     LEFT JOIN guests g ON g.id = (SELECT id FROM guests WHERE invite_id = i.id ORDER BY id LIMIT 1)
     LEFT JOIN rsvps r ON r.guest_id = g.id
     ORDER BY i.id DESC`,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Khách mời</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Mỗi khách có một link riêng: thiệp hiện “Thân mời: tên khách” và tự điền sẵn form xác nhận. Link chung không kèm tên:{" "}
          <span className="font-mono">{origin}</span>
        </p>
      </div>
      <InviteForm />
      <div className="overflow-x-auto rounded-2xl bg-cream ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="bg-paper-deep/50 text-left">
            <tr>
              <th className="px-3 py-2">Tên trên thiệp</th>
              <th className="px-3 py-2">Bên</th>
              <th className="px-3 py-2">Phản hồi</th>
              <th className="px-3 py-2">Link mời</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-soft">Chưa có khách mời nào.</td>
              </tr>
            )}
            {invites.map((i) => {
              const url = `${origin}/?k=${i.code}`;
              return (
                <tr key={i.id} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{i.display_name}</td>
                  <td className="px-3 py-2">{i.side === "trai" ? "Nhà trai" : i.side === "gai" ? "Nhà gái" : "–"}</td>
                  <td className="px-3 py-2">
                    {i.attending === null ? <span className="text-ink-soft">Chưa</span> : i.attending ? `✅ ${i.party_size} người` : "❌ Không đến"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[220px] truncate font-mono text-xs text-ink-soft">{url}</span>
                      <CopyLink url={url} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <ActionButton action={deleteInvite.bind(null, i.id)} confirm={`Xoá lời mời "${i.display_name}"?`}>
                      Xoá
                    </ActionButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
