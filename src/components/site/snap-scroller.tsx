"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Khung cuộn của thiệp (mỗi lần vuốt một sector) kèm các chấm điều hướng ở mép phải. */
export function SnapScroller({ ids, children }: { ids: string[]; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const key = ids.join("|");

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sectors = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-sec]"));
    // Sector nào đang cắt qua đường giữa màn hình thì là sector hiện tại (sector dài cũng đúng).
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(sectors.indexOf(e.target as HTMLElement))),
      { root: el, rootMargin: "-49% 0px -49% 0px" },
    );
    sectors.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [key]);

  const go = (id: string) => root.current?.querySelector(`:scope > [data-sec="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative">
      <div ref={root} className="snap-scroller" tabIndex={0} aria-label="Thiệp cưới">
        {children}
      </div>
      <nav aria-label="Các phần của thiệp" className="pointer-events-none absolute right-1 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center">
        {ids.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            aria-label={`Tới phần ${i + 1}`}
            aria-current={i === active}
            className="pointer-events-auto grid h-3.5 w-5 place-items-center"
          >
            <span className={`block rounded-full transition-all ${i === active ? "h-2 w-2 bg-olive" : "h-1.5 w-1.5 bg-ink/25"}`} />
          </button>
        ))}
      </nav>
    </div>
  );
}
