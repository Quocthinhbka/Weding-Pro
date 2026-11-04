import { z } from "zod";
import { currentGuest } from "@/lib/guest";
import { jsonError, parseJson, rateLimit, TOO_MANY } from "@/lib/http";
import { addWish, visibleWishes } from "@/lib/queries";

export async function GET() {
  return Response.json({ wishes: visibleWishes() });
}

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên của bạn").max(80, "Tên quá dài"),
  message: z.string().trim().min(2, "Vui lòng nhập lời chúc").max(1000, "Lời chúc tối đa 1000 ký tự"),
  website: z.string().optional(),
});

export async function POST(req: Request) {
  if (!(await rateLimit("wish", 5, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  if (data.website) return Response.json({ ok: true });
  const guest = await currentGuest();
  return Response.json({ wish: addWish(guest?.id ?? null, data.name, data.message) });
}
