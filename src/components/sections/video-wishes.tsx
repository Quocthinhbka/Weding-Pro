import { SectionTitle } from "@/components/ui/section-title";
import { WedMemo } from "@/components/video/wedmemo";

/** Video lời chúc: quay, chọn khung, gửi và xem ngay trong thiệp (dựng từ dự án WedMemo). */
export function VideoWishes() {
  return (
    <>
      <SectionTitle compact eyebrow="Video Wishes" title="Video chúc mừng" subtitle="Gửi cô dâu chú rể một lời chúc bằng chính giọng nói và nụ cười của bạn!" />
      <WedMemo />
    </>
  );
}
