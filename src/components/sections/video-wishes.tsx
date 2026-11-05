import { SectionTitle } from "@/components/ui/section-title";
import { WedMemo } from "@/components/video/wedmemo";
import type { Side } from "@/content/wedding";

/** Video lời chúc: quay, chọn khung, gửi và xem ngay trong thiệp (dựng từ dự án WedMemo). */
export function VideoWishes({ side }: { side: Side }) {
  return (
    <>
      <SectionTitle compact eyebrow="Video Wishes" title="Video chúc mừng" />
      <WedMemo side={side} />
    </>
  );
}
