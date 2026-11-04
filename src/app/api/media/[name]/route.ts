import path from "node:path";
import { MEDIA_NAME, mediaDir, mediaMime } from "@/lib/media";
import { fileResponse } from "@/lib/video";

// Ảnh / nhạc đã tải lên. Tên tệp là ngẫu nhiên và không bao giờ bị ghi đè nên cho trình duyệt lưu đệm lâu.
export async function GET(req: Request, ctx: RouteContext<"/api/media/[name]">) {
  const { name } = await ctx.params;
  if (!MEDIA_NAME.test(name)) return new Response("Không tìm thấy", { status: 404 });
  return fileResponse(path.join(/*turbopackIgnore: true*/ mediaDir(), name), mediaMime(name), req.headers.get("range"), {
    "Cache-Control": "public, max-age=31536000, immutable",
  });
}
