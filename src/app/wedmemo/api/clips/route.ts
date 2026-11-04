import { jsonError } from "@/lib/http";
import { keyOk, listClips, saveClip } from "@/lib/wedmemo";

export function GET(req: Request) {
  const k = new URL(req.url).searchParams.get("k");
  return Response.json(listClips(keyOk(k) ? k : null), { headers: { "Cache-Control": "no-cache" } });
}

export async function POST(req: Request) {
  if (!req.body) return jsonError("Thiếu thông tin tải lên.");
  const r = await saveClip(req.body, req.headers);
  return "error" in r ? jsonError(r.error!, r.status) : Response.json({ id: r.id });
}
