import type { CSSProperties, ReactNode } from "react";

/**
 * Một sector của thiệp: trọn một màn hình (hoặc `screens` màn hình với sector dài).
 * Sector dài có hai điểm dừng khi cuộn: đầu sector, rồi cuối sector.
 */
export function Sector({
  id,
  tone,
  screens = 1,
  flush = false,
  children,
}: {
  id: string;
  tone?: "paper";
  screens?: number;
  flush?: boolean;
  children: ReactNode;
}) {
  const tall = screens > 1;
  return (
    <section
      data-sec={id}
      data-tall={tall ? "" : undefined}
      style={{ "--screens": screens } as CSSProperties}
      className={`sector ${flush ? "sector-flush" : ""} ${tone === "paper" ? "bg-paper/60" : ""}`}
    >
      {tall && <div className="snap-top" aria-hidden />}
      <div className="sector-body">{children}</div>
      {tall && <div className="snap-bottom" aria-hidden />}
    </section>
  );
}
