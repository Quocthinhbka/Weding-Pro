import { currentGuest } from "@/lib/guest";
import { get, run } from "@/lib/db";
import { jsonError, rateLimit, TOO_MANY } from "@/lib/http";
import { publicVideos } from "@/lib/queries";
import { processVideo, saveUpload } from "@/lib/video";

export async function GET() {
  return Response.json({ videos: publicVideos() });
}

// Video gửi dạng nội dung thô; tên và lời nhắn nằm trên URL để không phải giữ cả video trong bộ nhớ.
export async function POST(req: Request) {
  if (!(await rateLimit("video", 4, 30 * 60_000))) return jsonError(TOO_MANY, 429);
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").trim().slice(0, 80);
  const message = (url.searchParams.get("message") ?? "").trim().slice(0, 300);
  const mime = req.headers.get("content-type") ?? "";
  if (!name) return jsonError("Vui lòng nhập tên của bạn");
  if (!mime.startsWith("video/")) return jsonError("Tệp không phải video");
  if (!req.body) return jsonError("Không nhận được video");

  const saved = await saveUpload(req.body, mime);
  if ("error" in saved) return jsonError(saved.error ?? "Tải video thất bại", 413);

  const guest = await currentGuest();
  const result = run(
    `INSERT INTO videos (guest_id, name, message, original_file, size, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'processing', ?)`,
    guest?.id ?? null,
    name,
    message || null,
    saved.file,
    saved.size,
    Date.now(),
  );
  const id = Number(result.lastInsertRowid);
  processVideo(id);
  return Response.json({ video: get("SELECT id, name, status FROM videos WHERE id = ?", id) });
}
