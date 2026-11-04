import { connection } from "next/server";
import { ActionButton } from "@/components/admin/controls";
import { all } from "@/lib/db";
import { formatDateTime } from "@/lib/http";
import type { Video } from "@/lib/queries";
import { deleteVideo, setVideoApproved } from "../../actions";

const STATUS = { processing: "⏳ Đang xử lý", ready: "Sẵn sàng", failed: "⚠️ Lỗi xử lý" } as const;

export default async function VideosPage() {
  await connection();
  const videos = all<Video>("SELECT * FROM videos ORDER BY created_at DESC");
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-semibold">Video lời chúc ({videos.length})</h1>
      <p className="text-sm text-ink-soft">Video chỉ hiện trên thiệp sau khi bấm “Duyệt”. Video lỗi xử lý vẫn tải về được.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <article key={v.id} className="overflow-hidden rounded-2xl bg-cream ring-1 ring-line">
            <video src={`/api/videos/${v.id}/file`} controls preload="metadata" playsInline className="aspect-[3/4] w-full bg-ink object-contain" />
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{v.name}</p>
                <span className="ml-auto text-xs text-ink-soft">{formatDateTime(v.created_at)}</span>
              </div>
              {v.message && <p className="text-sm italic text-ink-soft">“{v.message}”</p>}
              <p className="text-xs text-ink-soft">
                {STATUS[v.status]} · {(v.size / 1024 / 1024).toFixed(1)} MB · {v.approved ? "✅ Đã duyệt" : "Chưa duyệt"}
              </p>
              <div className="flex flex-wrap gap-2">
                <ActionButton action={setVideoApproved.bind(null, v.id, !v.approved)}>{v.approved ? "Bỏ duyệt" : "Duyệt"}</ActionButton>
                <a href={`/api/videos/${v.id}/file?download=1`} className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs hover:bg-paper">
                  Tải về
                </a>
                <ActionButton action={deleteVideo.bind(null, v.id)} confirm={`Xoá vĩnh viễn video của "${v.name}"?`}>
                  Xoá
                </ActionButton>
              </div>
            </div>
          </article>
        ))}
      </div>
      {videos.length === 0 && <p className="py-10 text-center text-ink-soft">Chưa có video nào.</p>}
    </div>
  );
}
