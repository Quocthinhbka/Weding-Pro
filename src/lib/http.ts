import "server-only";
import { headers } from "next/headers";
import type { z } from "zod";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Trang có đang mở qua HTTPS không (Caddy gửi kèm x-forwarded-proto). Cookie chỉ gắn cờ Secure
 * khi đúng là HTTPS, để vẫn đăng nhập được khi chạy thử qua http trong mạng LAN.
 */
export async function isHttpsRequest() {
  return (await headers()).get("x-forwarded-proto")?.split(",")[0].trim() === "https";
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Giới hạn số lần gọi theo IP trong một khoảng thời gian. Trả false nếu vượt quá. */
export async function rateLimit(name: string, max: number, windowMs: number) {
  const key = `${name}:${await clientIp()}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count++;
  return bucket.count <= max;
}

export const TOO_MANY = "Bạn thao tác hơi nhanh, vui lòng thử lại sau ít phút nhé!";

export async function parseJson<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ data: z.infer<S>; error?: never } | { data?: never; error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: jsonError("Dữ liệu gửi lên không hợp lệ") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ") };
  }
  return { data: parsed.data };
}

/** Địa chỉ gốc của trang (dùng để tạo link mời). */
export async function siteOrigin() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}
