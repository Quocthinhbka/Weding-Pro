import crypto from "node:crypto";

// Ký và kiểm tra phiên đăng nhập admin. Không dùng next/headers để proxy.ts dùng chung được.

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 14;

export function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Thiếu SESSION_SECRET (tối thiểu 16 ký tự) trong file .env");
  }
  return "dev-only-secret-change-me";
}

function hmac(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function signSession(now = Date.now()) {
  const exp = String(now + ADMIN_MAX_AGE * 1000);
  return `${exp}.${hmac(exp)}`;
}

export function verifySession(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < now) return false;
  return safeEqual(sig, hmac(exp));
}

/** Mã đăng nhập trang quản trị lấy từ biến môi trường ADMIN_PASSWORD (file .env), không ghi trong code. */
export function adminPasswordConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(input.trim(), expected);
}
