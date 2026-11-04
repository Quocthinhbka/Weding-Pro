import { connection } from "next/server";
import { PreviewFrame } from "@/components/admin/config/preview-frame";
import { getConfig } from "@/lib/config";

// Khung xem trước nằm trong iframe của trang Cấu hình thiệp. Cần đăng nhập admin (proxy.ts chặn /admin/*).
export default async function PreviewPage() {
  await connection();
  return <PreviewFrame initial={getConfig()} />;
}
