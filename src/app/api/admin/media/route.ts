import { isAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { saveMedia, type MediaKind } from "@/lib/media";

// Tải ảnh / nhạc lên từ trang cấu hình. Nội dung gửi dạng thô, loại tệp nằm trên URL (?kind=photo|qr|audio).
export async function POST(req: Request) {
  if (!(await isAdmin())) return jsonError("Chưa đăng nhập quản trị", 401);
  const kind = new URL(req.url).searchParams.get("kind") as MediaKind;
  if (!["photo", "qr", "audio"].includes(kind)) return jsonError("Loại tệp không hợp lệ");
  const mime = req.headers.get("content-type") ?? "";
  if (kind === "audio" ? !mime.startsWith("audio/") : !mime.startsWith("image/")) {
    return jsonError(kind === "audio" ? "Vui lòng chọn tệp nhạc (MP3)" : "Vui lòng chọn tệp ảnh");
  }
  if (!req.body) return jsonError("Không nhận được tệp");
  try {
    return Response.json(await saveMedia(req.body, kind, mime));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Tải lên thất bại", 400);
  }
}
