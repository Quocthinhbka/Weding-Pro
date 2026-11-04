import { isAdmin } from "@/lib/auth";
import { get } from "@/lib/db";
import type { Video } from "@/lib/queries";
import { fileResponse, posterPath } from "@/lib/video";

export async function GET(req: Request, ctx: RouteContext<"/api/videos/[id]/poster">) {
  const { id } = await ctx.params;
  const video = get<Video>("SELECT * FROM videos WHERE id = ?", Number(id));
  const poster = video && posterPath(video);
  if (!video || !poster || (!video.approved && !(await isAdmin()))) {
    return new Response("Không tìm thấy", { status: 404 });
  }
  return fileResponse(poster, "image/jpeg", null);
}
