"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Chữ một dòng, tự co cỡ chữ cho vừa chiều ngang của khung chứa (tối đa `max`px, tối thiểu `min`px).
 * Dùng cho tên cô dâu chú rể để tên dài hay màn hình hẹp cũng không bị xuống dòng hay tràn.
 */
export function FitText({ children, max, min = 14, className = "", as: Tag = "span", style }: { children: ReactNode; max: number; min?: number; className?: string; as?: ElementType; style?: React.CSSProperties }) {
  const box = useRef<HTMLElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      const prev = el.style.fontSize; // cỡ chữ React đang đặt, trả lại sau khi đo
      el.style.fontSize = `${max}px`;
      const avail = parent.clientWidth - parseFloat(getComputedStyle(parent).paddingLeft) - parseFloat(getComputedStyle(parent).paddingRight);
      const need = el.scrollWidth;
      setSize(need > avail && need > 0 ? Math.max(min, Math.floor((max * avail) / need)) : max);
      el.style.fontSize = prev;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    document.fonts?.ready.then(fit); // phông chữ nạp xong thì đo lại
    return () => ro.disconnect();
  }, [max, min, children]);

  return (
    <Tag ref={box} className={className} style={{ whiteSpace: "nowrap", display: "inline-block", maxWidth: "100%", fontSize: size ?? max, visibility: size === null ? "hidden" : undefined, ...style }}>
      {children}
    </Tag>
  );
}
