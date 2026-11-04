import path from "node:path";
import { fileResponse } from "@/lib/media";
import { dataDir, FILE_RE, keyOk, loadMeta, TYPES } from "@/lib/wedmemo";

// Clip riêng tư chỉ lấy được kèm khoá ?k=; riêng ảnh mờ (.tiny.jpg) thì ai cũng xem được.
export async function GET(req: Request, ctx: RouteContext<"/wedmemo/data/[name]">) {
  const { name } = await ctx.params;
  const m = FILE_RE.exec(name);
  const meta = m && loadMeta(m[1]);
  if (!m || !meta || !(!meta.private || m[2] === "tiny.jpg" || keyOk(new URL(req.url).searchParams.get("k")))) {
    return new Response("Không tìm thấy", { status: 404 });
  }
  return fileResponse(path.join(/*turbopackIgnore: true*/ dataDir(), name), TYPES[m[2]], req.headers.get("range"), { "Cache-Control": "private, max-age=86400" });
}
