import { currentGuest } from "@/lib/guest";
import { jsonError, rateLimit, TOO_MANY } from "@/lib/http";
import { spinWheel } from "@/lib/queries";

export async function POST() {
  if (!(await rateLimit("spin", 10, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const guest = await currentGuest();
  if (!guest?.phone) return jsonError("Vui lòng nhập tên và số điện thoại trước khi quay", 401);

  const result = spinWheel(guest.id);
  if ("error" in result) return jsonError(result.error);
  const { spin, credits } = result;
  return Response.json({
    prizeId: spin.prize_id,
    credits,
    spin: { label: spin.prize_label, isWin: spin.is_win === 1, code: spin.claim_code, claimed: !!spin.claimed_at, at: spin.created_at },
  });
}
