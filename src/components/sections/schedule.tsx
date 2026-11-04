import { dateInfo, directionsUrl, eventsAt, mapEmbedUrl, mapsSearchUrl, type WeddingConfig } from "@/content/wedding";
import { googleCalendarUrl } from "@/lib/ics";
import { Daisy } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export function Schedule({ config }: { config: WeddingConfig }) {
  const date = dateInfo(config);
  // Sắp xếp địa điểm theo giờ của sự kiện đầu tiên tại đó.
  const venues = config.venues
    .map((venue) => ({ venue, events: eventsAt(config, venue.id) }))
    .filter((v) => v.events.length > 0)
    .sort((a, b) => a.events[0].time.localeCompare(b.events[0].time));

  return (
    <section className="bg-paper/60 px-6 py-16">
      <SectionTitle
        eyebrow="Lịch trình"
        title="Sự kiện cưới"
        subtitle={`${date.weekday}, ${date.day}.${date.month}.${date.year} · Tức ngày ${date.lunar}`}
      />
      <div className="space-y-8">
        {venues.map(({ venue, events }, idx) => (
          <Reveal key={venue.id} delay={idx * 80} className="overflow-hidden rounded-[2rem] bg-cream shadow-sm ring-1 ring-line">
            <div className="px-6 pt-7 text-center">
              <Daisy size={28} className="mx-auto" />
              <h3 className="mt-2 text-balance font-serif text-xl font-semibold text-ink">{venue.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{venue.address}</p>
            </div>
            <ol className="relative mx-6 mt-6 space-y-4 border-l border-dashed border-olive/50 pl-6">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-cream bg-olive ring-1 ring-olive" />
                  <p className="font-serif text-2xl leading-none text-olive-deep">{e.time}</p>
                  <p className="mt-1 font-medium uppercase tracking-wider text-ink">{e.title}</p>
                </li>
              ))}
            </ol>
            <iframe
              title={`Bản đồ ${venue.name}`}
              src={mapEmbedUrl(venue)}
              className="mt-6 h-56 w-full border-0 grayscale-[30%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="grid grid-cols-2 gap-2 p-4">
              <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-primary !px-3 !text-xs">
                🧭 Chỉ đường
              </a>
              <a href={mapsSearchUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !px-3 !text-xs">
                📍 Google Maps
              </a>
              <a href={googleCalendarUrl(config, venue.id)} target="_blank" rel="noopener noreferrer" className="btn btn-outline !px-3 !text-xs">
                📅 Lịch Google
              </a>
              <a href={`/api/ics/${venue.id}`} className="btn btn-outline !px-3 !text-xs">
                🗓️ Lịch điện thoại
              </a>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
