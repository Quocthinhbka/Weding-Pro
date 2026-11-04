import { connection } from "next/server";
import { PreviewFrame } from "@/components/admin/config/preview-frame";
import { sideFromParam } from "@/content/wedding";
import { getConfig } from "@/lib/config";

// Khung xem trước nằm trong iframe của trang Cấu hình thiệp. Cần đăng nhập admin (proxy.ts chặn /admin/*).
// ?f=bride xem thiệp nhà gái (Lễ Vu Quy).
export default async function PreviewPage(props: PageProps<"/admin/preview">) {
  await connection();
  const { f } = await props.searchParams;
  return <PreviewFrame initial={getConfig()} side={sideFromParam(f)} />;
}
