import Image from "next/image";
import { dateInfo, directionsUrl, mainEvent, venueById, type WeddingConfig } from "@/content/wedding";
import { Daisy, DaisySprig, Heart } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { MusicCard } from "./music-card";

export function Hero({ config }: { config: WeddingConfig }) {
  const { groom, bride } = config;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image src={config.heroImage} alt={`${groom.name} và ${bride.name}`} fill priority sizes="480px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-transparent to-ink/65" />
      <div className="absolute inset-x-0 top-10 text-center text-white">
        <p className="text-xs font-medium uppercase tracking-[0.4em]">Tiệc cưới của chúng tôi</p>
      </div>
      <div className="absolute inset-x-0 bottom-14 px-6 text-center text-white">
        <h2 className="font-script text-6xl leading-none drop-shadow">{groom.name}</h2>
        <p className="my-1 font-script text-4xl text-daisy">&</p>
        <h2 className="font-script text-6xl leading-none drop-shadow">{bride.name}</h2>
        <p className="mt-6 font-serif text-xl tracking-[0.3em]">{dateInfo(config).dots}</p>
      </div>
      <p className="absolute inset-x-0 bottom-3 animate-float text-center text-[11px] uppercase tracking-[0.3em] text-white/85">Vuốt lên ⌃</p>
    </div>
  );
}

export function Family({ config }: { config: WeddingConfig }) {
  const { groom, bride } = config;
  const sides = [config.families.trai, config.families.gai];
  return (
    <div className="relative text-center">
      <DaisySprig className="absolute -right-8 -top-6 w-28 opacity-50" flip />
      <Reveal>
        <SectionTitle title="Đại diện gia đình" />
        <div className="grid grid-cols-2 gap-4">
          {sides.map((side) => (
            <div key={side.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-olive">{side.label}</p>
              <div className="mt-3 space-y-1.5">
                {side.members.map((m) => (
                  <p key={`${m.role}-${m.name}`} className="text-[15px] text-ink">
                    <span className="text-ink-soft">{m.role}:</span> <b className="font-medium">{m.name}</b>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xs whitespace-pre-line font-serif text-[17px] italic leading-relaxed text-ink">{config.texts.invitation}</p>
        <div className="mt-8 flex items-end justify-center gap-4">
          <div>
            <p className="font-script text-4xl text-ink">{groom.name}</p>
            {groom.born && <p className="text-xs tracking-widest text-ink-soft">{groom.born}</p>}
          </div>
          <Heart className="mb-3 h-5 w-5 animate-heartbeat text-rose" />
          <div>
            <p className="font-script text-4xl text-ink">{bride.name}</p>
            {bride.born && <p className="text-xs tracking-widest text-ink-soft">{bride.born}</p>}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Portrait({ src, name, role }: { src: string; name: string; role: string }) {
  return (
    <figure className="text-center">
      <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-t-full border-4 border-white shadow-lg ring-1 ring-line">
        <Image src={src} alt={name} fill sizes="200px" className="object-cover" />
      </div>
      <figcaption className="mt-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-soft">{role}</p>
        <p className="font-script text-3xl text-ink">{name}</p>
      </figcaption>
    </figure>
  );
}

export function Portraits({ config }: { config: WeddingConfig }) {
  return (
    <Reveal className="grid grid-cols-2 gap-5">
      <Portrait src={config.groom.photo} name={config.groom.name} role="Chú rể" />
      <Portrait src={config.bride.photo} name={config.bride.name} role="Cô dâu" />
    </Reveal>
  );
}

export function InviteCard({ config }: { config: WeddingConfig }) {
  const main = mainEvent(config);
  const venue = main && venueById(config, main.venueId);
  const date = dateInfo(config);
  if (!main) return null;
  return (
    <Reveal className="rounded-[2rem] bg-cream px-6 py-8 text-center shadow-sm ring-1 ring-line">
      <p className="text-sm text-ink-soft">Trân trọng kính mời bạn tới dự</p>
      <h3 className="mt-2 text-balance font-serif text-3xl font-semibold uppercase tracking-[0.12em] text-olive-deep">{main.title}</h3>
      <p className="mt-4 text-sm uppercase tracking-[0.25em] text-ink-soft">Vào lúc</p>
      <p className="font-serif text-4xl text-ink">{main.time.replace(":", "h")}</p>
      <div className="mx-auto mt-5 grid max-w-[300px] grid-cols-[1fr_auto_1fr] items-center">
        <p className="border-y border-line py-2 text-sm font-medium uppercase tracking-widest">{date.weekday}</p>
        <p className="px-4 font-serif text-6xl leading-none text-olive-deep">{date.day}</p>
        <p className="border-y border-line py-2 text-sm font-medium uppercase tracking-widest">Tháng {date.month}</p>
      </div>
      <p className="mt-1 font-serif text-xl tracking-[0.3em]">{date.year}</p>
      <p className="mt-2 text-sm italic text-ink-soft">(Tức ngày {date.lunar})</p>
      {venue && (
        <>
          <div className="mt-6">
            <Daisy size={26} className="mx-auto" />
            <p className="mt-2 text-balance font-semibold text-ink">{venue.name}</p>
            <p className="text-sm text-ink-soft">{venue.address}</p>
          </div>
          <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-6">
            Chỉ đường
          </a>
        </>
      )}
    </Reveal>
  );
}

export function IntroMusic() {
  return (
    <Reveal>
      <MusicCard />
    </Reveal>
  );
}
