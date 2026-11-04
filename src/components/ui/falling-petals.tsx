"use client";

import { useEffect, useState } from "react";
import { Daisy } from "./daisy";

type Petal = { left: number; delay: number; duration: number; size: number; drift: number; spin: number; flower: boolean };

/** Cánh hoa cúc rơi nhẹ. Tạo ngẫu nhiên sau khi tải trang để tránh lệch giữa máy chủ và trình duyệt. */
export function FallingPetals({ count = 12 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => {
      setPetals(
        Array.from({ length: count }, (_, i) => ({
          left: Math.random() * 100,
          delay: Math.random() * 14,
          duration: 12 + Math.random() * 10,
          size: 10 + Math.random() * 12,
          drift: (Math.random() - 0.5) * 160,
          spin: 360 + Math.random() * 540,
          flower: i % 4 === 0,
        })),
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
            ["--drift" as string]: `${p.drift}px`,
            ["--spin" as string]: `${p.spin}deg`,
            opacity: 0,
          }}
        >
          {p.flower ? (
            <Daisy size={p.size * 1.4} />
          ) : (
            <svg width={p.size * 0.5} height={p.size} viewBox="0 0 10 20">
              <ellipse cx="5" cy="10" rx="4.2" ry="9.5" fill="#fff" stroke="#e4d8c2" strokeWidth="0.8" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
