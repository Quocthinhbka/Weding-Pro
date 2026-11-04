import { jsonError, rateLimit } from "@/lib/http";
import { codeOk, newKey } from "@/lib/wedmemo";

export async function POST(req: Request) {
  // 10 lần / 5 phút mỗi IP → dò hết 10.000 mã 4 số mất ~80 giờ với một IP.
  if (!(await rateLimit("wedmemo-unlock", 10, 5 * 60_000))) return jsonError("Nhập sai nhiều lần, thử lại sau ít phút.", 429);
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  if (!codeOk(String(body?.code ?? ""))) return jsonError("Sai mã.", 403);
  return Response.json({ k: newKey(), hours: 3 });
}
