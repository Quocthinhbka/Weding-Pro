import { Daisy } from "@/components/ui/daisy";

// Quay và xem video nằm ở trang riêng /wedmemo (tách từ dự án WedMemo). Hiện ngay dưới sổ lưu bút.
export function VideoWishes() {
  return (
    <a
      href="/wedmemo"
      className="mt-3 flex shrink-0 items-center gap-3 rounded-2xl bg-olive px-4 py-3 text-white shadow-md transition active:scale-[0.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-xl">🎥</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">Gửi video chúc mừng</span>
        <span className="block truncate text-xs text-white/80">Quay một lời chúc bằng giọng nói và nụ cười của bạn</span>
      </span>
      <Daisy size={22} className="shrink-0" />
    </a>
  );
}
