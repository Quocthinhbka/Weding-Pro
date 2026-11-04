import { z } from "zod";
import { bindInvite } from "@/lib/guest";
import { jsonError, parseJson, rateLimit, TOO_MANY } from "@/lib/http";
import { guestState } from "@/lib/queries";

const schema = z.object({ code: z.string().trim().min(1).max(32) });

export async function POST(req: Request) {
  if (!(await rateLimit("invite", 30, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  const guest = await bindInvite(data.code);
  if (!guest) return jsonError("Không tìm thấy lời mời", 404);
  return Response.json(guestState(guest));
}
