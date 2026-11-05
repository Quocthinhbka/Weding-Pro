import { z } from "zod";
import { MEMORY_LEVELS, memoryLevel } from "@/content/games";
import { memoryImages } from "@/content/wedding";
import { getConfig } from "@/lib/config";
import { currentGuest } from "@/lib/guest";
import { jsonError, parseJson, rateLimit, TOO_MANY } from "@/lib/http";
import { memoryBestOf, startMemory } from "@/lib/queries";

const schema = z.object({ level: z.number().int().min(1).max(MEMORY_LEVELS.length) });

export async function POST(req: Request) {
  if (!(await rateLimit("memory", 40, 10 * 60_000))) return jsonError(TOO_MANY, 429);
  const guest = await currentGuest();
  if (!guest?.phone) return jsonError("Vui lòng nhập tên và số điện thoại trước khi chơi", 401);
  const { data, error } = await parseJson(req, schema);
  if (error) return error;
  const level = memoryLevel(data.level)!;
  if (memoryImages(getConfig(), level.level).length < level.pairs) return jsonError(`Level ${level.level} cần ${level.pairs} ảnh (chọn ảnh cho level trong trang cấu hình hoặc thêm ảnh vào album)`);
  const best = memoryBestOf(guest.id, level.level);
  return Response.json({
    attemptId: startMemory(guest.id, level.level),
    best: best ? { durationMs: best.duration_ms, moves: best.moves } : null,
  });
}
