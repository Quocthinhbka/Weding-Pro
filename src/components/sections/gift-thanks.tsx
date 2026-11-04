"use client";

import Image from "next/image";
import { useState } from "react";
import { bankAppName, bankAppUrl } from "@/content/banks";
import { coupleNames, type Gift } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { CopyButton, copyText } from "@/components/ui/copy-button";
import { Daisy, Heart } from "@/components/ui/daisy";
import { Modal } from "@/components/ui/modal";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

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
      <button type="button" onClick={() => setOpen(true)} className="group mx-auto block" aria-label="Mở hòm mừng cưới">
        <svg viewBox="0 0 200 170" className="mx-auto w-52 animate-float drop-shadow-lg transition group-hover:scale-105" aria-hidden>
          <rect x="22" y="78" width="156" height="78" rx="10" fill="#8a6a45" />
          <rect x="22" y="78" width="156" height="78" rx="10" fill="none" stroke="#5f4630" strokeWidth="3" />
          <path d="M22 100h156M22 126h156" stroke="#5f4630" strokeWidth="2" opacity=".5" />
          <path d="M16 80c0-34 20-54 84-54s84 20 84 54z" fill="#a47f55" stroke="#5f4630" strokeWidth="3" />
          <rect x="88" y="70" width="24" height="34" rx="5" fill="#e2c08d" stroke="#5f4630" strokeWidth="3" />
          <circle cx="100" cy="86" r="4" fill="#5f4630" />
          <path d="M100 18c-2-10 10-12 10-4 8-2 10 8 2 10 6 6-2 14-8 8-6 6-14-2-8-8-8-2-6-12 2-10 0-8 12-6 10 4z" fill="#f3b6c0" opacity=".95" transform="translate(0 -4) scale(.9) translate(11 4)" />
          <circle cx="100" cy="17" r="5" fill="#f0c24a" />
        </svg>
        <span className="btn btn-primary mt-4">Chạm để mở hòm</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Hộp mừng cưới" wide>
        <div className={`grid gap-3 ${gifts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {gifts.map((g, i) => {
            const bankUrl = bankAppUrl(g.bankApp);
            return (
              <div key={i} className="rounded-2xl bg-white/80 p-3 text-center ring-1 ring-line">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">{g.title}</p>
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
                <p className="mt-2 text-xs text-ink-soft">{g.bank}</p>
                <p className="font-serif text-lg tracking-wider text-ink">{g.accountNumber}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">{g.accountName}</p>
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

export function ThankYou() {
  const config = useWedding();
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
        <p className="mx-auto mt-4 max-w-xs font-serif text-[17px] italic leading-relaxed text-ink">{config.texts.thankYou}</p>
        <div className="mt-6 flex items-center justify-center gap-2 font-script text-3xl text-ink">
          {config.groom.name} <Heart className="h-5 w-5 text-rose" /> {config.bride.name}
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
