import { jsonError } from "@/lib/http";
import { ID_RE, keyOk, trashClip } from "@/lib/wedmemo";

export async function POST(req: Request, ctx: RouteContext<"/wedmemo/api/clips/[id]/delete">) {
  const { id } = await ctx.params;
  if (!keyOk(new URL(req.url).searchParams.get("k"))) return jsonError("Cần mở khoá trước.", 403);
  if (!ID_RE.test(id)) return jsonError("Không tìm thấy.", 404);
  trashClip(id);
  return Response.json({ ok: true });
}
