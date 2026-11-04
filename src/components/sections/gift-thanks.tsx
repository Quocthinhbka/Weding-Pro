"use client";

import Image from "next/image";
import { useState } from "react";
import { coupleNames } from "@/content/wedding";
import { useWedding } from "@/components/site/wedding-context";
import { CopyButton, copyText } from "@/components/ui/copy-button";
import { Daisy, Heart } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";

export function GiftBox() {
  const { gifts } = useWedding();
  return (
    <section className="bg-paper/60 px-6 py-16">
      <SectionTitle eyebrow="Gửi yêu thương" title="Hộp mừng cưới" subtitle="Cảm ơn tấm lòng của bạn dành cho chúng mình!" />
      <div className="grid gap-5">
        {gifts.map((g, i) => (
          <Reveal key={i} delay={i * 80} className="rounded-[2rem] bg-cream p-6 text-center shadow-sm ring-1 ring-line">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-olive">{g.title}</p>
            {g.qr && (
              <div className="relative mx-auto mt-4 aspect-square w-48 overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line">
                <Image src={g.qr} alt={`Mã QR ${g.title}`} fill sizes="192px" className="object-contain p-2" />
              </div>
            )}
            <p className="mt-4 text-sm text-ink-soft">{g.bank}</p>
            <p className="font-serif text-2xl tracking-wider text-ink">{g.accountNumber}</p>
            <p className="text-sm font-medium uppercase tracking-wider text-ink-soft">{g.accountName}</p>
            <div className="mt-4 flex justify-center gap-2">
              {g.accountNumber && <CopyButton text={g.accountNumber} label="Sao chép số TK" />}
              {g.qr && (
                <a href={g.qr} download className="btn btn-outline !px-4 !py-2 !text-xs">
                  Tải mã QR
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
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
    <section className="relative px-6 pb-28 pt-16 text-center">
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
    </section>
  );
}
