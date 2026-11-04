import { SectionTitle } from "@/components/ui/section-title";

// Quay và xem video nằm ở trang riêng /wedmemo (tách từ dự án WedMemo).
export function VideoWishes() {
  return (
    <section className="bg-paper/60 px-6 py-16">
      <SectionTitle eyebrow="Video Wishes" title="Video chúc mừng" subtitle="Gửi tới cô dâu chú rể một lời chúc bằng chính giọng nói và nụ cười của bạn!" />
      <div className="text-center">
        {/* Thẻ <a> thường: /wedmemo là trang tĩnh trong public/, không phải route của Next */}
        <a href="/wedmemo" className="btn btn-primary">
          🎥 Quay video chúc mừng
        </a>
      </div>
    </section>
  );
}
