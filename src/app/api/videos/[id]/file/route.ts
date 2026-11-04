import { isAdmin } from "@/lib/auth";
import { get } from "@/lib/db";
import type { Video } from "@/lib/queries";
import { fileResponse, videoFilePath, videoMime } from "@/lib/video";

export async function GET(req: Request, ctx: RouteContext<"/api/videos/[id]/file">) {
  const { id } = await ctx.params;
  const video = get<Video>("SELECT * FROM videos WHERE id = ?", Number(id));
  const admin = await isAdmin();
  if (!video || (!admin && !(video.approved && video.status === "ready"))) {
    return new Response("Không tìm thấy", { status: 404 });
  }
  const download = admin && new URL(req.url).searchParams.has("download");
  const ext = videoFilePath(video).split(".").pop();
  return fileResponse(
    videoFilePath(video),
    videoMime(video),
    req.headers.get("range"),
    download ? { "Content-Disposition": `attachment; filename="loi-chuc-${video.id}.${ext}"` } : {},
  );
}
