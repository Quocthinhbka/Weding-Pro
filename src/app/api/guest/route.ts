import { z } from "zod";
import { normalizePhone } from "@/lib/game-logic";
import { currentGuest, identifyGuest } from "@/lib/guest";
import { jsonError, parseJson, rateLimit, TOO_MANY } from "@/lib/http";
import { guestState } from "@/lib/queries";

export async function GET() {
  return Response.json(guestState(await currentGuest()));
}

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(80, "Tên quá dài"),
  phone: z.string().trim().max(20),
});

// Tham gia trò chơi: cần tên và số điện thoại để trao giải.
export async function POST(req: Request) {
  if (!(await rateLimit("guest", 20, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  const phone = normalizePhone(data.phone);
  if (!phone) return jsonError("Số điện thoại chưa đúng (ví dụ 0912345678)");
  const guest = await identifyGuest({ name: data.name, phone });
  return Response.json(guestState(guest));
}
