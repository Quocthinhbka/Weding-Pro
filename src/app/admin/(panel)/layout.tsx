import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { coupleNames } from "@/content/wedding";
import { isAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { Daisy } from "@/components/ui/daisy";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Quản trị thiệp cưới" };

const NAV = [
  ["/admin/cau-hinh", "Cấu hình thiệp"],
  ["/admin", "Tổng quan"],
  ["/admin/khach-moi", "Khách mời"],
  ["/admin/xac-nhan", "Xác nhận"],
  ["/admin/loi-chuc", "Lời chúc"],
  ["/admin/video", "Video"],
  ["/admin/tro-choi", "Trò chơi"],
  ["/admin/quay-so", "Quay số 🎲"],
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Đọc cookie nên mọi trang quản trị luôn hiển thị dữ liệu mới nhất.
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Daisy size={26} /> {coupleNames(getConfig())}
          </Link>
          <Link href="/" className="ml-auto text-sm text-ink-soft hover:text-ink" target="_blank">
            Xem thiệp ↗
          </Link>
          <form action={logout}>
            <button className="text-sm text-ink-soft hover:text-ink">Đăng xuất</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-ink hover:bg-paper-deep">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
