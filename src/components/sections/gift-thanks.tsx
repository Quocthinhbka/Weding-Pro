"use client";

import Image from "next/image";
import { useState } from "react";
import { bankAppName, bankAppUrl } from "@/content/banks";
import { coupleNames, coupleOrder, type Gift, type Side } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { CopyButton, copyText } from "@/components/ui/copy-button";
import { Daisy, Heart } from "@/components/ui/daisy";
import { FitText } from "@/components/ui/fit-text";
import { Modal } from "@/components/ui/modal";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

const ink = "#6b4a3a";

/** Chiếc hòm xinh: thân kem đào, nắp hồng, khoá trái tim vàng, mắt cười và má hồng. */
function CuteChest() {
  return (
    <svg viewBox="0 0 220 200" className="mx-auto w-60 drop-shadow-md" aria-hidden>
      <ellipse cx="110" cy="186" rx="70" ry="8" fill="#6b4a3a" opacity=".12" />
      <ellipse cx="70" cy="178" rx="15" ry="8" fill="#e3b79a" />
      <ellipse cx="150" cy="178" rx="15" ry="8" fill="#e3b79a" />
      <rect x="30" y="94" width="160" height="82" rx="24" fill="#fde7d6" stroke="#e3b79a" strokeWidth="3" />
      <path d="M22 102C22 62 62 44 110 44s88 18 88 58z" fill="#f8b9c8" stroke="#e48ea3" strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 92c6-22 28-34 60-34" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".55" />
      <path d="M22 102h176" stroke="#e48ea3" strokeWidth="3" />
      {[50, 76, 144, 170].map((x) => (
        <circle key={x} cx={x} cy="102" r="3.2" fill="#e48ea3" />
      ))}
      <rect x="96" y="90" width="28" height="30" rx="8" fill="#f6d36e" stroke="#d3a93a" strokeWidth="3" />
      <Heart x="102" y="97" width="16" height="16" className="text-rose" />
      {/* khuôn mặt */}
      <path d="M68 138q8-10 16 0M136 138q8-10 16 0" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M101 146q4.5 7 9 0q4.5 7 9 0" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="62" cy="150" rx="10" ry="6" fill="#f59fb0" opacity=".65" />
      <ellipse cx="158" cy="150" rx="10" ry="6" fill="#f59fb0" opacity=".65" />
      <Daisy size={30} x="30" y="36" />
      <Daisy size={22} x="164" y="44" />
    </svg>
  );
}

/** Tim và tia sáng nhỏ bay quanh hòm. */
const SPARKS = [
  { l: "14%", t: "22%", d: 0, k: "star" },
  { l: "84%", t: "30%", d: 0.8, k: "star" },
  { l: "8%", t: "62%", d: 1.5, k: "heart" },
  { l: "90%", t: "66%", d: 0.4, k: "heart" },
  { l: "28%", t: "10%", d: 1.1, k: "heart" },
  { l: "70%", t: "8%", d: 1.9, k: "star" },
] as const;

/** Hòm mừng cưới: bấm vào mới mở hộp thoại các mã QR. Bấm vào mã QR thì mở thẳng ứng dụng ngân hàng. */
export function GiftBox() {
  const { gifts } = useWedding();
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");

  async function openBank(g: Gift) {
    // Chép số tài khoản để khách dán vào ứng dụng (chỉ vài ngân hàng tự điền được qua deeplink).
    if (g.accountNumber && (await copyText(g.accountNumber))) {
      setHint(`Đã chép số tài khoản ${g.accountNumber}`);
      setTimeout(() => setHint(""), 2500);
    }
  }

  return (
    <div className="text-center">
      <SectionTitle eyebrow="Gửi yêu thương" title="Hộp mừng cưới" subtitle="Cảm ơn tấm lòng của bạn dành cho chúng mình!" />
      <button type="button" onClick={() => setOpen(true)} className="group relative mx-auto mt-1 block w-full max-w-[340px]" aria-label="Mở hòm mừng cưới">
        {/* Khung vòm mảnh + quầng sáng dịu phía sau hòm */}
        <span className="absolute inset-x-6 inset-y-0 rounded-t-full border border-olive/25" aria-hidden />
        <span className="absolute inset-x-10 inset-y-3 rounded-t-full border border-dashed border-rose/40" aria-hidden />
        <span className="absolute inset-x-12 top-14 h-48 rounded-full bg-[radial-gradient(circle,rgb(248_185_200/0.45),transparent_70%)]" aria-hidden />
        {SPARKS.map((p, i) => (
          <span key={i} className={`absolute ${p.k === "star" ? "twinkle text-daisy" : "float-heart text-rose"}`} style={{ left: p.l, top: p.t, animationDelay: `${p.d}s` }} aria-hidden>
            {p.k === "star" ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11C7 11 11 7 12 1z" /></svg>
            ) : (
              <Heart className="h-3.5 w-3.5" />
            )}
          </span>
        ))}
        <span className="relative block animate-float pb-5 pt-12 transition group-active:scale-95">
          <CuteChest />
        </span>
      </button>
      <p className="mt-1 font-script text-2xl text-olive-deep">Chạm vào hòm để gửi yêu thương</p>
      <p className="hide-short mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-soft">Mọi tấm lòng đều là món quà quý với chúng mình.</p>

      <Modal open={open} onClose={() => setOpen(false)} title="Gửi yêu thương 💌" wide>
        <div className={`grid gap-3 ${gifts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {gifts.map((g, i) => {
            const bankUrl = bankAppUrl(g.bankApp);
            return (
              <div key={i} className="rounded-2xl bg-white/80 p-3 text-center ring-1 ring-line">
                <p className="whitespace-pre-line text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">{g.title}</p>
                {g.qr && (
                  <a
                    href={bankUrl || g.qr}
                    {...(bankUrl ? { target: "_blank", rel: "noopener noreferrer", onClick: () => void openBank(g) } : { download: true })}
                    className="relative mx-auto mt-2 block aspect-square w-full max-w-44 overflow-hidden rounded-xl bg-white ring-1 ring-line"
                    aria-label={bankUrl ? `Mở ứng dụng ${bankAppName(g.bankApp)} để mừng cưới` : `Tải mã QR ${g.title}`}
                  >
                    <Image src={g.qr} alt={`Mã QR ${g.title}`} fill sizes="176px" className="object-contain p-1.5" />
                  </a>
                )}
                {g.qr && bankUrl && <p className="mt-1.5 text-[11px] leading-tight text-olive-deep">Chạm vào mã QR để mở {bankAppName(g.bankApp)}</p>}
                <p className="mt-2 whitespace-pre-line text-xs text-ink-soft">{g.bank}</p>
                <p className="font-serif text-lg tracking-wider text-ink">{g.accountNumber}</p>
                <p className="whitespace-pre-line text-[11px] font-medium uppercase tracking-wider text-ink-soft">{g.accountName}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {g.accountNumber && <CopyButton text={g.accountNumber} label="Chép số TK" />}
                  {g.qr && (
                    <a href={g.qr} download className="btn btn-outline !px-3 !py-1.5 !text-xs">
                      Tải QR
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {hint && <p className="mt-3 text-center text-sm text-olive-deep">{hint} ✓</p>}
      </Modal>
    </div>
  );
}

export function ThankYou({ side }: { side: Side }) {
  const config = useWedding();
  const [first, second] = coupleOrder(config, side);
  const [copied, setCopied] = useState(false);
  const shareUrl = () => window.location.origin;

  async function share() {
    const data = { title: `Thiệp cưới ${coupleNames(config)}`, text: "Trân trọng kính mời bạn đến chung vui cùng chúng mình!", url: shareUrl() };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        return;
      }
    }
    if (await copyText(data.url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div className="relative pb-16 text-center">
      <Reveal>
        <Daisy size={44} className="mx-auto" />
        <p className="mt-3 font-script text-6xl text-olive">Thank you!</p>
        <p className="mx-auto mt-4 max-w-xs whitespace-pre-line font-serif text-[17px] italic leading-relaxed text-ink">{config.texts.thankYou}</p>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 font-script text-ink">
          <FitText max={30}>{first.person.name}</FitText>
          <Heart className="h-5 w-5 text-rose" />
          <FitText max={30}>{second.person.name}</FitText>
        </div>
        <div className="mx-auto mt-10 max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft">Chia sẻ thiệp</p>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" onClick={share} className="btn btn-primary">
              {copied ? "Đã sao chép link ✓" : "Chia sẻ"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`, "_blank", "noopener,width=600,height=500")}
            >
              Facebook
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
