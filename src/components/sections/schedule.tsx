import { dateInfo, directionsUrl, type Venue, type WeddingConfig, type WeddingEvent, venueById } from "@/content/wedding";
import { googleCalendarUrl } from "@/lib/ics";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

type Row = { kind: "venue"; venue: Venue } | { kind: "event"; event: WeddingEvent };

/** Các mốc theo giờ; khi sang địa điểm khác thì chèn một dòng tên địa điểm. */
export function timeline(config: WeddingConfig): Row[] {
  const rows: Row[] = [];
  let last = "";
  for (const event of [...config.events].sort((a, b) => a.time.localeCompare(b.time))) {
    const venue = venueById(config, event.venueId);
    if (venue && venue.id !== last) rows.push({ kind: "venue", venue });
    if (venue) last = venue.id;
    rows.push({ kind: "event", event });
  }
  return rows;
}

/** Toàn bộ lịch trình trong một sector: dòng thời gian dọc với các mốc giờ. */
export function Schedule({ config }: { config: WeddingConfig }) {
  const date = dateInfo(config);
  const rows = timeline(config);
  return (
    <>
      <SectionTitle compact eyebrow="Lịch trình" title="Sự kiện cưới" subtitle={`${date.weekday}, ${date.dots}`} />
      <Reveal className="flex min-h-0 max-h-[46rem] flex-1 flex-col overflow-y-auto rounded-[2rem] bg-cream px-4 py-3 shadow-sm ring-1 ring-line">
        {/* justify-between: các mốc giãn đều theo chiều cao khung, màn hình cao thì thưa ra, màn hình thấp thì khít lại */}
        <ol className="relative ml-3 flex flex-1 flex-col justify-between border-l border-dashed border-olive/50">
          {rows.map((row, i) =>
            row.kind === "venue" ? (
              <li key={`v-${i}`} className="relative -ml-px pb-1 pl-5 pt-2 first:pt-0">
                <span className="absolute -left-[7px] top-[0.8rem] grid h-3.5 w-3.5 place-items-center rounded-full bg-olive-deep text-[8px] text-white first:top-1" aria-hidden>
                  ●
                </span>
                <p className="whitespace-pre-line text-[12.5px] font-semibold leading-tight text-olive-deep">📍 {row.venue.name}</p>
                {/* Chỉ đường và nhắc lịch nằm riêng một dòng bên dưới địa điểm */}
                <div className="mt-1 flex flex-wrap gap-2">
                  <a href={directionsUrl(row.venue)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-olive px-3 py-1 text-[11px] text-white">
                    🧭 Chỉ đường
                  </a>
                  <a href={googleCalendarUrl(config, row.venue.id)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-paper px-3 py-1 text-[11px] ring-1 ring-line">
                    🔔 Nhắc lịch
                  </a>
                </div>
              </li>
            ) : (
              <li key={row.event.id} className="relative flex items-baseline gap-2.5 py-[3px] pl-5">
                <span className="absolute -left-[5px] top-[0.65rem] h-2.5 w-2.5 rounded-full border-2 border-cream bg-olive ring-1 ring-olive" />
                <span className="w-11 shrink-0 font-serif text-[17px] leading-none text-olive-deep tabular-nums">{row.event.time}</span>
                <span className="min-w-0 flex-1 whitespace-pre-line text-[13.5px] font-medium leading-snug text-ink">{row.event.title}</span>
              </li>
            ),
          )}
        </ol>
      </Reveal>
    </>
  );
}
