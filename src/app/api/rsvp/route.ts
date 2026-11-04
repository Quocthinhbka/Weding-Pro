import { z } from "zod";
import { getConfig } from "@/lib/config";
import { normalizePhone } from "@/lib/game-logic";
import { identifyGuest } from "@/lib/guest";
import { jsonError, parseJson, rateLimit, TOO_MANY } from "@/lib/http";
import { guestState, saveRsvp } from "@/lib/queries";

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên của bạn").max(80, "Tên quá dài"),
  attending: z.boolean(),
  partySize: z.number().int().min(1).max(10),
  side: z.enum(["trai", "gai"], { message: "Vui lòng chọn bạn là khách nhà trai hay nhà gái" }),
  events: z.array(z.string().max(40)).max(10),
  phone: z.string().trim().max(20).optional().default(""),
  note: z.string().trim().max(500, "Lời nhắn tối đa 500 ký tự").optional().default(""),
  inviteCode: z.string().trim().max(32).optional().nullable(),
  website: z.string().optional(), // bẫy bot: người thật không thấy ô này
});

export async function POST(req: Request) {
  if (!(await rateLimit("rsvp", 10, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  if (data.website) return Response.json({ ok: true });
  // Chỉ giữ các địa điểm đang có trong cấu hình.
  const venueIds = new Set(getConfig().venues.map((v) => v.id));
  const events = data.events.filter((e) => venueIds.has(e));
  if (data.attending && events.length === 0) return jsonError("Vui lòng chọn sự kiện bạn sẽ tham dự");

  let phone: string | null = null;
  if (data.phone) {
    phone = normalizePhone(data.phone);
    if (!phone) return jsonError("Số điện thoại chưa đúng (ví dụ 0912345678)");
  }

  const guest = await identifyGuest({ name: data.name, phone, inviteCode: data.inviteCode, side: data.side });
  saveRsvp(guest, {
    name: data.name,
    attending: data.attending,
    partySize: data.attending ? data.partySize : 0,
    side: data.side,
    events: data.attending ? events : [],
    phone,
    note: data.note || null,
  });
  return Response.json(guestState(guest));
}
