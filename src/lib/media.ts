import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { nanoid } from "nanoid";
import { uploadDir } from "./db";

// Ảnh / nhạc tải lên từ trang quản trị, lưu trong thư mục dữ liệu (volume /data trên VPS).

export const MEDIA_NAME = /^[A-Za-z0-9_-]+\.(webp|png|mp3|m4a)$/;
export type MediaKind = "photo" | "qr" | "audio";

const LIMITS: Record<MediaKind, number> = { photo: 30 * 1024 * 1024, qr: 10 * 1024 * 1024, audio: 25 * 1024 * 1024 };

// Thư mục chỉ biết lúc chạy – báo Turbopack không lần theo để khỏi đóng gói cả dự án.
export const mediaDir = () => path.join(/*turbopackIgnore: true*/ uploadDir(), "media");

export const mediaMime = (name: string) =>
  ({ webp: "image/webp", png: "image/png", mp3: "audio/mpeg", m4a: "audio/mp4" })[name.split(".").pop() ?? ""] ?? "application/octet-stream";

async function readLimited(body: ReadableStream<Uint8Array>, max: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of Readable.fromWeb(body as never)) {
    size += (chunk as Buffer).length;
    if (size > max) throw new Error(`Tệp quá lớn (tối đa ${Math.round(max / 1024 / 1024)}MB)`);
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function isAudio(buf: Buffer) {
  const id3 = buf.toString("latin1", 0, 3) === "ID3";
  const mpegFrame = buf.length > 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  const mp4 = buf.toString("latin1", 4, 8) === "ftyp";
  return id3 || mpegFrame || mp4;
}

/**
 * Lưu tệp tải lên. Ảnh được xoay đúng chiều, thu nhỏ, bỏ thông tin EXIF (kể cả vị trí GPS)
 * và đổi sang WebP; mã QR giữ PNG không nén mất dữ liệu để quét chính xác.
 */
export async function saveMedia(body: ReadableStream<Uint8Array>, kind: MediaKind, mime: string) {
  const buf = await readLimited(body, LIMITS[kind]);
  if (buf.length === 0) throw new Error("Không nhận được tệp");
  let name: string;
  let out: Buffer;
  if (kind === "audio") {
    if (!isAudio(buf)) throw new Error("Tệp nhạc chưa đúng định dạng (dùng MP3 hoặc M4A)");
    name = `${nanoid(16)}.${buf.toString("latin1", 4, 8) === "ftyp" || mime.includes("mp4") ? "m4a" : "mp3"}`;
    out = buf;
  } else {
    // Chỉ nạp sharp khi xử lý ảnh, để việc phục vụ tệp không phụ thuộc vào thư viện gốc.
    const { default: sharp } = await import("sharp");
    try {
      const image = sharp(buf, { failOn: "none" }).rotate();
      out =
        kind === "qr"
          ? await image.resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).png().toBuffer()
          : await image.resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch {
      throw new Error("Không đọc được ảnh. Hãy dùng ảnh JPG, PNG hoặc WebP.");
    }
    name = `${nanoid(16)}.${kind === "qr" ? "png" : "webp"}`;
  }
  fs.mkdirSync(mediaDir(), { recursive: true });
  fs.writeFileSync(path.join(mediaDir(), name), out);
  return { url: `/api/media/${name}`, size: out.length };
}

/** Trả file kèm hỗ trợ HTTP Range để trình phát video tua được. */
export function fileResponse(file: string, mime: string, rangeHeader: string | null, extra: Record<string, string> = {}) {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(file);
  } catch {
    return new Response("Không tìm thấy", { status: 404 });
  }
  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    ...extra,
  };
  const match = rangeHeader?.match(/bytes=(\d*)-(\d*)/);
  if (match && (match[1] || match[2])) {
    let start = match[1] ? Number(match[1]) : stat.size - Number(match[2]);
    let end = match[1] && match[2] ? Number(match[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(stat.size) } });
}
