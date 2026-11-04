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
      <Reveal className="rounded-[2rem] bg-cream p-4 shadow-sm ring-1 ring-line">
        <p className="text-center font-serif text-xl text-ink">
          Tháng {month} <span className="text-ink-soft">/</span> {year}
        </p>
        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-sm">
          {WEEKDAYS.map((d) => (
            <p key={d} className={`pb-1 text-[11px] font-semibold tracking-wider ${d === "CN" ? "text-rose" : "text-ink-soft"}`}>
              {d}
            </p>
          ))}
          {cells.map((d, i) =>
            d === day ? (
              <div key={i} className="relative grid h-9 place-items-center">
                <Heart className="absolute h-9 w-9 animate-heartbeat text-rose" />
                <span className="relative font-semibold text-white">{d}</span>
              </div>
            ) : (
              <p key={i} className={`grid h-9 place-items-center ${i % 7 === 6 ? "text-rose/80" : "text-ink"}`}>
                {d ?? ""}
              </p>
            ),
          )}
        </div>
        <div className="mt-3 text-center">
          <RsvpButton />
        </div>
      </Reveal>
    </div>
  );
}
