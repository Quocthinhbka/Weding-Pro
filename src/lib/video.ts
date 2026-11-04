import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { nanoid } from "nanoid";
import { all, get, run, uploadDir } from "./db";
import type { Video } from "./queries";

export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

// Thư mục dữ liệu chỉ biết lúc chạy – báo Turbopack không lần theo để khỏi đóng gói cả dự án.
const join = (...parts: string[]) => path.join(/*turbopackIgnore: true*/ ...parts);

const dirs = {
  originals: () => join(uploadDir(), "originals"),
  videos: () => join(uploadDir(), "videos"),
  posters: () => join(uploadDir(), "posters"),
};

function looksLikeVideo(head: Buffer) {
  const isWebm = head.length >= 4 && head.readUInt32BE(0) === 0x1a45dfa3;
  const isMp4 = head.length >= 8 && head.toString("latin1", 4, 8) === "ftyp";
  return isWebm || isMp4;
}

/** Ghi luồng video lên đĩa. Trả tên file, hoặc lỗi nếu quá lớn / không phải video. */
export async function saveUpload(body: ReadableStream<Uint8Array>, mime: string) {
  fs.mkdirSync(dirs.originals(), { recursive: true });
  const ext = mime.includes("webm") ? "webm" : mime.includes("quicktime") ? "mov" : "mp4";
  const name = `${nanoid(16)}.${ext}`;
  const full = join(dirs.originals(), name);
  const out = fs.createWriteStream(full);
  let size = 0;
  let checked = false;
  try {
    for await (const chunk of Readable.fromWeb(body as never)) {
      const buf = chunk as Buffer;
      if (!checked) {
        if (!looksLikeVideo(buf)) throw new Error("Tệp không phải video");
        checked = true;
      }
      size += buf.length;
      if (size > MAX_VIDEO_BYTES) throw new Error("Video quá dài, vui lòng quay ngắn hơn (tối đa 80MB)");
      if (!out.write(buf)) await new Promise<void>((r) => out.once("drain", () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    if (size === 0) throw new Error("Không nhận được video");
    return { file: name, size };
  } catch (err) {
    out.destroy();
    fs.rmSync(full, { force: true });
    return { error: err instanceof Error ? err.message : "Tải video thất bại" };
  }
}

function ffmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(/*turbopackIgnore: true*/ process.env.FFMPEG_PATH || "ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr || `ffmpeg exit ${code}`))));
  });
}

let queue: Promise<void> = Promise.resolve();

/** Chuyển video sang MP4 H.264 (tối đa 1280px) + tạo ảnh bìa. Chạy lần lượt từng video. */
export function processVideo(id: number) {
  queue = queue.then(() => transcode(id)).catch((err) => console.error("[video]", id, err));
}

export function resumePendingVideos() {
  for (const { id } of all<{ id: number }>("SELECT id FROM videos WHERE status = 'processing' ORDER BY id")) processVideo(id);
}

async function transcode(id: number) {
  const video = get<Video>("SELECT * FROM videos WHERE id = ?", id);
  if (!video) return;
  const input = join(dirs.originals(), video.original_file);
  fs.mkdirSync(dirs.videos(), { recursive: true });
  fs.mkdirSync(dirs.posters(), { recursive: true });
  const outName = `${id}-${nanoid(8)}.mp4`;
  const posterName = `${id}-${nanoid(8)}.jpg`;
  try {
    await ffmpeg([
      "-i", input,
      "-vf", "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
      join(dirs.videos(), outName),
    ]);
    await ffmpeg(["-ss", "0.5", "-i", join(dirs.videos(), outName), "-frames:v", "1", "-vf", "scale=480:-2", join(dirs.posters(), posterName)])
      .catch(() => ffmpeg(["-i", join(dirs.videos(), outName), "-frames:v", "1", "-vf", "scale=480:-2", join(dirs.posters(), posterName)]));
    run("UPDATE videos SET file = ?, mime = 'video/mp4', poster = ?, status = 'ready' WHERE id = ?", outName, posterName, id);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      // Máy không có ffmpeg (thường là khi chạy thử trên máy cá nhân): dùng luôn file gốc.
      run("UPDATE videos SET file = NULL, status = 'ready' WHERE id = ?", id);
      return;
    }
    console.error("[video] transcode failed", id, err);
    run("UPDATE videos SET status = 'failed' WHERE id = ?", id);
  }
}

export function videoFilePath(video: Video) {
  return video.file ? join(dirs.videos(), video.file) : join(dirs.originals(), video.original_file);
}

export function videoMime(video: Video) {
  if (video.file) return "video/mp4";
  return video.original_file.endsWith(".webm") ? "video/webm" : video.original_file.endsWith(".mov") ? "video/quicktime" : "video/mp4";
}

export function posterPath(video: Video) {
  return video.poster ? join(dirs.posters(), video.poster) : null;
}

export function deleteVideoFiles(video: Video) {
  for (const p of [join(dirs.originals(), video.original_file), video.file && join(dirs.videos(), video.file), posterPath(video)]) {
    if (p) fs.rmSync(p, { force: true });
  }
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
