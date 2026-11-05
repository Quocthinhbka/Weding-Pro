import { connection } from "next/server";
import { PreviewFrame } from "@/components/admin/config/preview-frame";
import { sideFromParam } from "@/content/wedding";
import { getConfig, getQuiz } from "@/lib/config";
import { albumRatios } from "@/lib/media";

// Khung xem trước nằm trong iframe của trang Cấu hình thiệp. Cần đăng nhập admin (proxy.ts chặn /admin/*).
// ?f=bride xem thiệp nhà gái (Lễ Vu Quy).
export default async function PreviewPage(props: PageProps<"/admin/preview">) {
  await connection();
  const { f } = await props.searchParams;
  const config = getConfig();
  return <PreviewFrame initial={config} side={sideFromParam(f)} quizTotal={getQuiz().length} albumRatios={await albumRatios(config.album)} />;
}
