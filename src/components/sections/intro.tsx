import Image from "next/image";
import { dateInfo, directionsUrl, inviteEvent, venueById, type Side, type WeddingConfig } from "@/content/wedding";
import { Daisy, DaisySprig, Heart } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export function Hero({ config }: { config: WeddingConfig }) {
  const { groom, bride } = config;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image src={config.heroImage} alt={`${groom.name} và ${bride.name}`} fill priority sizes="480px" className="object-cover" />
      {/* Hai lớp tối: đầu ảnh cho tên nổi bật, đáy ảnh cho ngày và dòng giới thiệu */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent via-45% to-ink/75" />
      <div className="absolute inset-x-0 top-9 px-7 text-white [text-shadow:0_2px_14px_rgb(0_0_0/0.5)]">
        <h2 className="font-script text-6xl leading-none">{groom.name}</h2>
        <p className="my-0.5 text-center font-script text-3xl text-daisy">&</p>
        <h2 className="text-right font-script text-6xl leading-none">{bride.name}</h2>
      </div>
      <div className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-3 px-6 text-center text-white">
        <p className="rounded-full border border-daisy/70 bg-ink/55 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-daisy shadow-lg backdrop-blur-sm">
          Tiệc cưới của chúng tôi
        </p>
        <p className="font-serif text-xl tracking-[0.3em] [text-shadow:0_2px_10px_rgb(0_0_0/0.55)]">{dateInfo(config).dots}</p>
      </div>
      <p className="absolute inset-x-0 bottom-3 animate-float text-center text-[11px] uppercase tracking-[0.3em] text-white/85">Vuốt lên ⌃</p>
    </div>
  );
}

export function Family({ config }: { config: WeddingConfig }) {
  const { groom, bride } = config;
  const sides = [config.families.trai, config.families.gai];
  return (
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-1 py-14 text-center">
      <FamilyOrnaments />
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

/** Họa tiết nhẹ phía trên và phía dưới sector, lấp khoảng trống mà không tranh với chữ. */
function FamilyOrnaments() {
  return (
    <div className="pointer-events-none" aria-hidden>
      <div className="absolute left-1/2 top-0 w-56 -translate-x-1/2 opacity-80">
        <DaisyGarland />
      </div>
      <DaisySprig className="absolute -left-8 top-0 w-24 opacity-40" />
      <DaisySprig className="absolute -right-8 top-0 w-24 opacity-40" flip />
      <div className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2 rotate-180 opacity-80">
        <DaisyGarland />
      </div>
      <DaisySprig className="absolute -left-8 bottom-0 w-24 rotate-180 opacity-40" flip />
      <DaisySprig className="absolute -right-8 bottom-0 w-24 rotate-180 opacity-40" />
    </div>
  );
}

/** Dải hoa cúc nhỏ nối nhau bằng vòng dây mảnh. */
function DaisyGarland() {
  return (
    <svg viewBox="0 0 240 40" className="w-full" fill="none">
      <path d="M6 10 C 50 34, 90 34, 120 20 C 150 34, 190 34, 234 10" stroke="var(--olive)" strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
      {[20, 60, 100, 140, 180, 220].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i % 2 ? 24 : 18})`}>
          <Daisy size={i === 2 || i === 3 ? 26 : 20} />
        </g>
      ))}
    </svg>
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

/** Mái nhà: tam giác mái có ngói, ống khói và cửa sổ trái tim; rộng hơn thân nhà để tạo mái hiên. */
function Roof() {
  return (
    <svg viewBox="0 0 360 118" className="relative z-10 -mb-px block w-full" aria-hidden>
      <rect x="262" y="14" width="30" height="54" rx="3" fill="var(--olive-deep)" />
      <rect x="258" y="10" width="38" height="9" rx="3" fill="var(--olive)" />
      <polygon points="180,6 354,112 6,112" fill="var(--olive)" stroke="var(--olive-deep)" strokeWidth="3" strokeLinejoin="round" />
      <g stroke="var(--olive-deep)" strokeWidth="1.2" opacity=".35" fill="none">
        <path d="M63 90 H297 M95 70 H265 M127 50 H233" />
      </g>
      <rect x="6" y="104" width="348" height="9" rx="4.5" fill="var(--olive-deep)" />
      <circle cx="180" cy="62" r="19" fill="var(--cream)" stroke="var(--olive-deep)" strokeWidth="3" />
      <Heart x="168" y="50" width="24" height="24" className="text-rose" />
    </svg>
  );
}

/** Ngôi nhà bao lấy ảnh cô dâu chú rể: mái ở trên, thân nhà ôm hai bức chân dung, nền cỏ hoa ở dưới. */
export function HouseOfCouple({ config }: { config: WeddingConfig }) {
  return (
    <div className="shrink-0">
      <p className="mb-2 text-center font-script text-4xl leading-none text-olive">Về chung một nhà</p>
      <Reveal className="mx-auto w-full max-w-[400px]">
        <Roof />
        <div className="mx-[4.5%] grid grid-cols-2 gap-4 rounded-b-[1.5rem] border-x-[5px] border-b-[5px] border-olive-deep bg-cream px-4 pb-4 pt-4 shadow-lg">
          <Portrait src={config.groom.photo} name={config.groom.name} role="Chú rể" />
          <Portrait src={config.bride.photo} name={config.bride.name} role="Cô dâu" />
        </div>
        <div className="mx-[1%] -mt-1 flex items-end justify-between" aria-hidden>
          <Daisy size={22} />
          <span className="mb-1 h-1.5 flex-1 rounded-full bg-olive/30" />
          <Daisy size={26} />
          <span className="mb-1 h-1.5 flex-1 rounded-full bg-olive/30" />
          <Daisy size={22} />
        </div>
      </Reveal>
    </div>
  );
}

export function InviteCard({ config, side }: { config: WeddingConfig; side: Side }) {
  const main = inviteEvent(config, side);
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
