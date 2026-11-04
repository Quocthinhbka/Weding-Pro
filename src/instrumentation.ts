// Chạy một lần khi máy chủ khởi động: tiếp tục xử lý những video đang dở do máy chủ khởi động lại.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { resumePendingVideos } = await import("./lib/video");
  resumePendingVideos();
}
