import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { uploadDir } from "./db";
import { secret } from "./session";

// Video lời chúc (chuyển từ dự án WedMemo). Mỗi clip trong thư mục wedmemo/: <id>.mp4|webm (video),
// <id>.jpg (ảnh nhỏ), <id>.tiny.jpg (ảnh mờ cho clip riêng tư), <id>.json (thông tin, ghi cuối cùng
// nên clip chỉ hiện khi đã lưu đủ). Xoá = chuyển sang wedmemo/trash/.

const MAX_UPLOAD = 100 * 1024 * 1024; // = client_max_body_size trong nginx
const MAX_THUMB = 1024 * 1024;
const KEY_HOURS = 3;

export const ID_RE = /^[0-9a-f]{32}$/;
export const FILE_RE = /^([0-9a-f]{32})\.(tiny\.jpg|jpg|mp4|webm)$/;
export const TYPES: Record<string, string> = { jpg: "image/jpeg", "tiny.jpg": "image/jpeg", mp4: "video/mp4", webm: "video/webm" };

// Thư mục chỉ biết lúc chạy – báo Turbopack không lần theo để khỏi đóng gói cả dự án.
const join = (...parts: string[]) => path.join(/*turbopackIgnore: true*/ ...parts);
export const dataDir = () => join(uploadDir(), "wedmemo");
const trashDir = () => join(dataDir(), "trash");

export type ClipMeta = { id: string; name: string; private: boolean; secs: number; ts: number; ext: "mp4" | "webm"; kiosk: boolean };

/* ---------- Khoá tạm để xem clip riêng tư ---------- */

// Ký bằng SESSION_SECRET cộng tiền tố riêng, để khoá này không bao giờ dùng được làm phiên admin.
const sign = (exp: string | number) => crypto.createHmac("sha256", secret()).update(`wedmemo:${exp}`).digest("hex").slice(0, 32);

export function newKey(now = Date.now()) {
  const exp = Math.floor(now / 1000) + KEY_HOURS * 3600;
  return `${exp}.${sign(exp)}`;
}

export function keyOk(k: string | null | undefined, now = Date.now()) {
  const [exp, sig = ""] = (k ?? "").split(".");
  if (!/^\d+$/.test(exp) || Number(exp) * 1000 <= now) return false;
  const want = Buffer.from(sign(exp));
  const got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

export function codeOk(code: string) {
  const want = process.env.WEDMEMO_CODE;
  if (!want) return false; // chưa đặt mã thì không ai mở khoá được
  const a = crypto.createHash("sha256").update(code).digest();
  const b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------- Clip ---------- */

export function loadMeta(id: string): ClipMeta | null {
  try {
    return JSON.parse(fs.readFileSync(join(dataDir(), `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export function listClips(key: string | null) {
  const out = [];
  let names: string[] = [];
  try {
    names = fs.readdirSync(dataDir());
  } catch {}
  for (const f of names.filter((n) => n.endsWith(".json"))) {
    const m = loadMeta(f.slice(0, -5));
    if (!m) continue;
    const show = key || !m.private;
    const k = key && m.private ? `?k=${key}` : "";
    out.push({
      id: m.id, name: m.name, private: m.private, secs: m.secs, ts: m.ts,
      thumb: show ? `data/${m.id}.jpg${k}` : `data/${m.id}.tiny.jpg`,
      video: show ? `data/${m.id}.${m.ext}${k}` : null,
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

export function trashClip(id: string) {
  fs.mkdirSync(trashDir(), { recursive: true });
  for (const f of fs.existsSync(dataDir()) ? fs.readdirSync(dataDir()) : []) if (f.startsWith(`${id}.`)) fs.renameSync(join(dataDir(), f), join(trashDir(), f));
}

/**
 * Thân request = ảnh nhỏ + ảnh mờ + video; độ dài hai ảnh nằm trong X-Parts.
 * Ghi video thẳng ra đĩa theo luồng, không giữ cả clip trong bộ nhớ.
 */
export async function saveClip(body: ReadableStream<Uint8Array>, h: Headers) {
  const n = Number(h.get("content-length"));
  const [thumbN, tinyN] = (h.get("x-parts") ?? "").split(",").map(Number);
  const id = h.get("x-clip") ?? "";
  const vtype = h.get("x-video-type") ?? "";
  const ext = vtype.startsWith("video/mp4") ? "mp4" : vtype.startsWith("video/webm") ? "webm" : null;
  if (!Number.isInteger(n) || !Number.isInteger(thumbN) || !Number.isInteger(tinyN)) return { status: 400, error: "Thiếu thông tin tải lên." };
  if (!ID_RE.test(id) || !ext) return { status: 400, error: "Định dạng video không hỗ trợ." };
  if (n > MAX_UPLOAD) return { status: 413, error: "Clip quá lớn." };
  if (!(thumbN >= 0 && thumbN <= MAX_THUMB && tinyN >= 0 && tinyN <= MAX_THUMB) || n <= thumbN + tinyN) return { status: 400, error: "Dữ liệu tải lên không hợp lệ." };
  fs.mkdirSync(dataDir(), { recursive: true });
  // Gửi lại sau khi mất phản hồi lần trước → đã có, bỏ qua (không đọc thân request).
  if (fs.existsSync(join(dataDir(), `${id}.json`))) return { id };

  const headLen = thumbN + tinyN;
  const head: Buffer[] = [];
  let got = 0;
  let size = 0;
  const part = join(dataDir(), `${id}.${crypto.randomBytes(4).toString("hex")}.part`);
  const out = fs.createWriteStream(part);
  try {
    for await (const raw of Readable.fromWeb(body as never)) {
      let chunk = raw as Buffer;
      if (got < headLen) {
        const take = Math.min(headLen - got, chunk.length);
        head.push(chunk.subarray(0, take));
        got += take;
        chunk = chunk.subarray(take);
      }
      if (!chunk.length) continue;
      size += chunk.length;
      if (got + size > MAX_UPLOAD) throw new Error("Clip quá lớn.");
      if (!out.write(chunk)) await new Promise<void>((r) => out.once("drain", () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    if (got + size !== n || size === 0) throw new Error("Không nhận đủ dữ liệu.");
  } catch (err) {
    out.destroy();
    fs.rmSync(part, { force: true });
    return { status: 400, error: err instanceof Error ? err.message : "Tải lên thất bại." };
  }
  fs.renameSync(part, join(dataDir(), `${id}.${ext}`));
  const imgs = Buffer.concat(head);
  for (const [data, suffix] of [[imgs.subarray(0, thumbN), "jpg"], [imgs.subarray(thumbN), "tiny.jpg"]] as const) {
    if (data[0] === 0xff && data[1] === 0xd8) fs.writeFileSync(join(dataDir(), `${id}.${suffix}`), data);
  }
  const name = decodeURIComponentSafe(h.get("x-name") ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 60);
  const secs = Math.round(Number(h.get("x-secs")) * 10) / 10 || 0;
  const meta: ClipMeta = { id, name, private: h.get("x-private") === "1", secs, ts: Math.floor(Date.now() / 1000), ext, kiosk: h.get("x-kiosk") === "1" };
  const tmp = join(dataDir(), `${id}.json.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(meta));
  fs.renameSync(tmp, join(dataDir(), `${id}.json`));
  return { id };
}

function decodeURIComponentSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
