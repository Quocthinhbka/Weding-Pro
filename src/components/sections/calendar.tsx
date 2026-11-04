import { dateInfo, type WeddingConfig } from "@/content/wedding";
import { monthGrid } from "@/lib/wedding-time";
import { Heart } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { RsvpButton } from "./rsvp-cta";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function CalendarMonth({ config }: { config: WeddingConfig }) {
  const { day, month, year } = dateInfo(config);
  const cells = monthGrid(year, month);
  return (
    <div>
      <Reveal className="rounded-[2rem] bg-cream p-6 shadow-sm ring-1 ring-line">
        <p className="text-center font-serif text-2xl text-ink">
          Tháng {month} <span className="text-ink-soft">/</span> {year}
        </p>
        <div className="mt-5 grid grid-cols-7 gap-y-2 text-center text-sm">
          {WEEKDAYS.map((d) => (
            <p key={d} className={`pb-2 text-[11px] font-semibold tracking-wider ${d === "CN" ? "text-rose" : "text-ink-soft"}`}>
              {d}
            </p>
          ))}
          {cells.map((d, i) =>
            d === day ? (
              <div key={i} className="relative grid aspect-square place-items-center">
                <Heart className="absolute h-11 w-11 animate-heartbeat text-rose" />
                <span className="relative font-semibold text-white">{d}</span>
              </div>
            ) : (
              <p key={i} className={`grid aspect-square place-items-center ${i % 7 === 6 ? "text-rose/80" : "text-ink"}`}>
                {d ?? ""}
              </p>
            ),
          )}
        </div>
        <div className="mt-6 text-center">
          <RsvpButton />
        </div>
      </Reveal>
    </div>
  );
}
