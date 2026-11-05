import "server-only";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { get, run } from "./db";
import { isHttpsRequest } from "./http";
import { vnDay } from "./wedding-time";

const GUEST_COOKIE = "guest_token";

export type Guest = {
  id: number;
  token: string;
  name: string;
  phone: string | null;
  invite_id: number | null;
  side: string | null;
  spin_credits: number;
  credit_day: string | null;
  quiz_bonus: number;
  memory_bonus: number;
};

export type Invite = { id: number; code: string; display_name: string; side: string | null };

export function findInvite(code: string | null | undefined) {
  if (!code) return undefined;
  return get<Invite>("SELECT id, code, display_name, side FROM invites WHERE code = ?", code);
}

export async function currentGuest() {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return undefined;
  return get<Guest>("SELECT * FROM guests WHERE token = ?", token);
}

async function rememberGuest(guest: Guest) {
  const secure = await isHttpsRequest();
  (await cookies()).set(GUEST_COOKIE, guest.token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return guest;
}

function guestById(id: number | bigint) {
  return get<Guest>("SELECT * FROM guests WHERE id = ?", Number(id))!;
}

function createGuest(name: string, phone: string | null, inviteId: number | null, side: string | null) {
  const result = run(
    "INSERT INTO guests (token, name, phone, invite_id, side, created_at, spin_credits, credit_day) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
    nanoid(32),
    name,
    phone,
    inviteId,
    side,
    Date.now(),
    vnDay(Date.now()),
  );
  return guestById(result.lastInsertRowid);
}

/** Mở link mời riêng: gắn khách hiện tại (hoặc tạo mới) với lời mời đó. */
export async function bindInvite(code: string) {
  const invite = findInvite(code);
  if (!invite) return undefined;
  const current = await currentGuest();
  if (current) {
    if (!current.invite_id) {
      run("UPDATE guests SET invite_id = ?, side = COALESCE(side, ?) WHERE id = ?", invite.id, invite.side, current.id);
    }
    return guestById(current.id);
  }
  const existing = get<Guest>("SELECT * FROM guests WHERE invite_id = ? ORDER BY id LIMIT 1", invite.id);
  return rememberGuest(existing ?? createGuest(invite.display_name, null, invite.id, invite.side));
}

/**
 * Xác định khách khi gửi RSVP hoặc tham gia trò chơi.
 * Số điện thoại trùng với khách cũ nghĩa là cùng một người trên thiết bị khác.
 */
export async function identifyGuest(input: {
  name: string;
  phone?: string | null;
  inviteCode?: string | null;
  side?: string | null;
}) {
  const phone = input.phone || null;
  const side = input.side || null;
  const current = await currentGuest();
  const invite = findInvite(input.inviteCode);
  const byPhone = phone ? get<Guest>("SELECT * FROM guests WHERE phone = ?", phone) : undefined;
  const byInvite =
    !current && invite ? get<Guest>("SELECT * FROM guests WHERE invite_id = ? ORDER BY id LIMIT 1", invite.id) : undefined;

  const target = byPhone ?? current ?? byInvite;
  if (!target) return rememberGuest(createGuest(input.name, phone, invite?.id ?? null, side));

  run(
    `UPDATE guests SET name = ?, phone = COALESCE(?, phone), invite_id = COALESCE(invite_id, ?), side = COALESCE(?, side)
     WHERE id = ?`,
    input.name,
    phone,
    invite?.id ?? null,
    side,
    target.id,
  );
  return rememberGuest(guestById(target.id));
}
