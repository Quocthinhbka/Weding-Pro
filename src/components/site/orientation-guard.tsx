"use client";

import { useEffect } from "react";

/**
 * Chặn xoay ngang trên điện thoại: thử khoá hướng dọc (chỉ trình duyệt cho phép khi toàn màn hình / ứng dụng đã cài),
 * còn không thì khi máy nằm ngang hiện lớp phủ nhắc xoay dọc (CSS .orient-guard trong globals.css).
 */
export function OrientationGuard() {
  useEffect(() => {
    const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
    o?.lock?.("portrait").catch(() => {}); // trình duyệt không cho khoá thì đã có lớp phủ
  }, []);
  return (
    <div className="orient-guard" role="alert">
      <svg viewBox="0 0 64 64" width="72" height="72" aria-hidden className="animate-rotate-hint">
        <rect x="20" y="6" width="24" height="44" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="43" r="2.2" fill="currentColor" />
        <path d="M10 54c6 6 14 8 22 6M54 54c-6 6-14 8-22 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      </svg>
      <p className="mt-3 font-serif text-lg">Vui lòng xoay dọc điện thoại</p>
      <p className="mt-1 text-sm text-ink-soft">Thiệp được thiết kế để xem ở chiều dọc</p>
    </div>
  );
}
