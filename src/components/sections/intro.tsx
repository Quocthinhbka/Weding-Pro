import Image from "next/image";
import { coupleOrder, dateInfo, directionsUrl, feastOf, inviteEvent, venueById, type Side, type WeddingConfig } from "@/content/wedding";
import { Daisy, DaisySprig, Heart } from "@/components/ui/daisy";
import { FitText } from "@/components/ui/fit-text";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export function Hero({ config, side }: { config: WeddingConfig; side: Side }) {
  const [first, second] = coupleOrder(config, side);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image src={config.heroImage} alt={`${first.person.name} và ${second.person.name}`} fill priority sizes="480px" className="object-cover" />
      {/* Hai lớp tối: đầu ảnh cho tên nổi bật, đáy ảnh cho ngày và dòng giới thiệu */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent via-48% to-ink/75" />
      {/* Tên đặt trên lớp tối mờ dạng vệt sáng-tối + bóng chữ 2 lớp + viền mảnh để không lẫn với ảnh nền */}
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_50%_35%,rgb(26_20_16/0.5),transparent_72%)]" aria-hidden />
      <div className="absolute inset-x-0 top-9 px-7 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.7),0_3px_18px_rgb(0_0_0/0.6)]">
        <h2 className="font-script leading-none [-webkit-text-stroke:0.6px_rgb(0_0_0/0.25)]">
          <FitText max={60}>{first.person.name}</FitText>
        </h2>
        <p className="my-0.5 text-center font-script text-3xl text-daisy">&</p>
        <h2 className="text-right font-script leading-none [-webkit-text-stroke:0.6px_rgb(0_0_0/0.25)]">
          <FitText max={60}>{second.person.name}</FitText>
        </h2>
      </div>
      <div className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-3 px-6 text-center text-white">
        <p className="rounded-full border border-daisy/70 bg-ink/55 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-daisy shadow-lg backdrop-blur-sm">
          Ngày vui của chúng tôi
        </p>
        <p className="font-serif text-xl tracking-[0.3em] [text-shadow:0_2px_10px_rgb(0_0_0/0.55)]">{dateInfo(config).dots}</p>
      </div>
      <p className="absolute inset-x-0 bottom-3 animate-float text-center text-[11px] uppercase tracking-[0.3em] text-white/85">Vuốt lên ⌃</p>
    </div>
  );
}

export function Family({ config, side }: { config: WeddingConfig; side: Side }) {
  const couple = coupleOrder(config, side);
  // Thiệp nhà gái: nhà gái đứng trước (bên trái); thiệp nhà trai: nhà trai đứng trước.
  const families = side === "bride" ? [config.families.gai, config.families.trai] : [config.families.trai, config.families.gai];
  const feast = feastOf(config, side);
  const date = dateInfo(config);
  return (
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden px-1 py-14 text-center">
      <FamilyOrnaments />
      <Reveal>
        <SectionTitle title="Đại diện gia đình" />
        <div className="grid grid-cols-2 gap-4">
          {families.map((family) => (
            <div key={family.label}>
              <p className="whitespace-pre-line text-xs font-semibold uppercase tracking-[0.3em] text-olive">{family.label}</p>
              <div className="mt-3 space-y-1.5">
                {family.members.map((m) => (
                  <p key={`${m.role}-${m.name}`} className="text-[15px] text-ink">
                    <span className="text-ink-soft">{m.role}:</span> <b className="font-medium">{m.name}</b>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xs whitespace-pre-line font-serif text-[17px] italic leading-relaxed text-ink">
          {side === "bride" ? config.texts.invitationBride : config.texts.invitation}
        </p>
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          {[couple[0], null, couple[1]].map((c, i) =>
            c ? (
              <div key={c.key} className="min-w-0">
                <p className="font-script text-ink">
                  <FitText max={36}>{c.person.name}</FitText>
                </p>
                {c.person.born && <p className="text-xs tracking-widest text-ink-soft">{c.person.born}</p>}
              </div>
            ) : (
              <Heart key={i} className="mb-3 h-5 w-5 animate-heartbeat text-rose" />
            ),
          )}
        </div>
        {feast && (
          <div className="relative mx-auto mt-7 max-w-[20rem] overflow-hidden rounded-[1.75rem] bg-olive px-5 py-5 text-center text-white shadow-xl ring-4 ring-olive/20">
            <Daisy size={90} className="pointer-events-none absolute -right-5 -top-5 opacity-20" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-daisy">Buổi tiệc thân mật</p>
            <p className="mt-1 text-xs text-white/80">Thời gian hẹn quý khách</p>
            <p className="mt-1.5 font-serif text-[2.1rem] leading-none tracking-wide">{feast.event.time.replace(":", "h")}</p>
            <p className="mt-1.5 font-serif text-lg tracking-[0.2em]">{date.dots}</p>
            <p className="text-sm uppercase tracking-[0.25em] text-white/85">{date.weekday}</p>
            {feast.venue && (
              <p className="mt-3 whitespace-pre-line border-t border-white/25 pt-3 text-sm leading-snug text-white/90">
                <b className="font-semibold text-white">{feast.venue.name}</b>
                <br />
                {feast.venue.address}
              </p>
            )}
          </div>
        )}
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
        <p className="font-script text-ink">
          <FitText max={30}>{name}</FitText>
        </p>
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
      <Heart x="168" y="50" width="24" height="24" className="animate-heartbeat-fast text-rose" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    </svg>
  );
}

/** Ngôi nhà bao lấy ảnh cô dâu chú rể: mái ở trên, thân nhà ôm hai bức chân dung, nền cỏ hoa ở dưới. Thiệp nhà gái: cô dâu bên trái. */
export function HouseOfCouple({ config, side }: { config: WeddingConfig; side: Side }) {
  const [left, right] = coupleOrder(config, side);
  return (
    <div className="shrink-0">
      <p className="mb-2 text-center font-script text-4xl leading-none text-olive">Về chung một nhà</p>
      <Reveal className="mx-auto w-full max-w-[400px]">
        <Roof />
        <div className="mx-[4.5%] grid grid-cols-2 gap-4 rounded-b-[1.5rem] border-x-[5px] border-b-[5px] border-olive-deep bg-cream px-4 pb-4 pt-4 shadow-lg">
          <Portrait src={left.person.photo} name={left.person.name} role={left.role} />
          <Portrait src={right.person.photo} name={right.person.name} role={right.role} />
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
      <h3 className="mt-2 whitespace-pre-line text-balance font-serif text-3xl font-semibold uppercase tracking-[0.12em] text-olive-deep">{main.title}</h3>
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
            <p className="mt-2 whitespace-pre-line text-balance font-semibold text-ink">{venue.name}</p>
            <p className="whitespace-pre-line text-sm text-ink-soft">{venue.address}</p>
          </div>
          <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-6">
            Chỉ đường
          </a>
        </>
      )}
    </Reveal>
  );
}
