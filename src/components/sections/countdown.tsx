"use client";

import { useEffect, useState } from "react";
import { dateInfo } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { timeRemaining, type Remaining } from "@/lib/wedding-time";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export function Countdown() {
  const target = dateInfo(useWedding()).countdownTo;
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setLeft(timeRemaining(new Date(target), new Date()));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [target]);

  const units: [string, number | undefined][] = [
    ["Ngày", left?.days],
    ["Giờ", left?.hours],
    ["Phút", left?.minutes],
    ["Giây", left?.seconds],
  ];

  return (
    <div className="mt-6">
      <Reveal>
        <SectionTitle eyebrow="Đếm ngược" title="Ngày chung đôi" subtitle={left?.done ? "Hôm nay là ngày vui của chúng mình! 💛" : "Cùng đếm ngược đến ngày chung đôi"} />
        <div className="grid grid-cols-4 gap-2.5">
          {units.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-olive px-1 py-4 text-center text-white shadow-md">
              <p className="font-serif text-3xl tabular-nums">{value === undefined ? "--" : String(value).padStart(2, "0")}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
