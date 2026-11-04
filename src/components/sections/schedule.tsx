import { dateInfo, directionsUrl, eventsAt, mapEmbedUrl, mapsSearchUrl, type Venue, type WeddingConfig, type WeddingEvent } from "@/content/wedding";
import { googleCalendarUrl } from "@/lib/ics";
import { Daisy } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export type VenueSchedule = { venue: Venue; events: WeddingEvent[] };

/** Các địa điểm có sự kiện, sắp xếp theo giờ của sự kiện đầu tiên tại đó. Mỗi địa điểm là một sector. */
export function scheduleVenues(config: WeddingConfig): VenueSchedule[] {
  return config.venues
    .map((venue) => ({ venue, events: eventsAt(config, venue.id) }))
    .filter((v) => v.events.length > 0)
    .sort((a, b) => a.events[0].time.localeCompare(b.events[0].time));
}

export function VenueCard({ config, venue, events, index, total }: VenueSchedule & { config: WeddingConfig; index: number; total: number }) {
  const date = dateInfo(config);
  return (
    <>
      <SectionTitle
        compact
        eyebrow={total > 1 ? `Lịch trình ${index + 1}/${total}` : "Lịch trình"}
        title="Sự kiện cưới"
        subtitle={`${date.weekday}, ${date.day}.${date.month}.${date.year} · Tức ngày ${date.lunar}`}
      />
      {/* Bản đồ co lại khi màn hình thấp để cả thẻ vẫn vừa một màn hình */}
      <Reveal className="flex min-h-0 shrink flex-col overflow-hidden rounded-[2rem] bg-cream shadow-sm ring-1 ring-line">
        <div className="shrink-0 px-6 pt-5 text-center">
          <Daisy size={24} className="mx-auto" />
          <h3 className="mt-1 text-balance font-serif text-lg font-semibold text-ink">{venue.name}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">{venue.address}</p>
        </div>
        <ol className="relative mx-6 mt-4 shrink-0 space-y-3 border-l border-dashed border-olive/50 pl-6">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-cream bg-olive ring-1 ring-olive" />
              <p className="font-serif text-xl leading-none text-olive-deep">{e.time}</p>
              <p className="mt-0.5 text-sm font-medium uppercase tracking-wider text-ink">{e.title}</p>
            </li>
          ))}
        </ol>
        <iframe
          title={`Bản đồ ${venue.name}`}
          src={mapEmbedUrl(venue)}
          className="mt-4 min-h-24 w-full flex-1 basis-40 border-0 grayscale-[30%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="grid shrink-0 grid-cols-2 gap-2 p-3">
          <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-primary !px-3 !py-2.5 !text-xs">
            🧭 Chỉ đường
          </a>
          <a href={mapsSearchUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !px-3 !py-2.5 !text-xs">
            📍 Google Maps
          </a>
          <a href={googleCalendarUrl(config, venue.id)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !px-3 !py-2.5 !text-xs">
            📅 Lịch Google
          </a>
          <a href={`/api/ics/${venue.id}`} className="btn btn-outline !px-3 !py-2.5 !text-xs">
            🗓️ Lịch điện thoại
          </a>
        </div>
      </Reveal>
    </>
  );
}
