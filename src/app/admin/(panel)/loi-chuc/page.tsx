import { connection } from "next/server";
import { ActionButton } from "@/components/admin/controls";
import { all } from "@/lib/db";
import { formatDateTime } from "@/lib/http";
import type { Wish } from "@/lib/queries";
import { deleteWish, setWishHidden } from "../../actions";

export default async function WishesPage() {
  await connection();
  const wishes = all<Wish>("SELECT * FROM wishes ORDER BY created_at DESC");
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Lời chúc ({wishes.length})</h1>
      <p className="text-sm text-ink-soft">Lời chúc công khai hiện ngay trên thiệp. Lời chúc 🔒 riêng tư vẫn hiện trên thiệp nhưng bị làm mờ, chỉ bạn đọc được ở đây. Bấm “Ẩn” nếu không muốn hiện lên thiệp.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {wishes.map((w) => (
          <article key={w.id} className={`rounded-2xl p-4 ring-1 ring-line ${w.hidden ? "bg-paper-deep/40 opacity-70" : "bg-cream"}`}>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{w.name}</p>
              {w.private ? <span className="rounded-full bg-rose/20 px-2 text-xs">🔒 Riêng tư</span> : null}
              {w.hidden ? <span className="rounded-full bg-ink/10 px-2 text-xs">Đang ẩn</span> : null}
              <p className="ml-auto text-xs text-ink-soft">{formatDateTime(w.created_at)}</p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{w.message}</p>
            <div className="mt-3 flex gap-2">
              <ActionButton action={setWishHidden.bind(null, w.id, !w.hidden)}>{w.hidden ? "Hiện lại" : "Ẩn"}</ActionButton>
              <ActionButton action={deleteWish.bind(null, w.id)} confirm="Xoá vĩnh viễn lời chúc này?">
                Xoá
              </ActionButton>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
