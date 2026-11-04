import Image from "next/image";
import type { WeddingConfig } from "@/content/wedding";
import { Daisy } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { AlbumGrid } from "./album-grid";

export function LoveStory({ config }: { config: WeddingConfig }) {
  return (
    <section className="px-6 py-16">
      <SectionTitle eyebrow="Love Story" title="Câu chuyện tình yêu" />
      <div className="space-y-10">
        {config.loveStory.map((s, i) => (
          <Reveal key={i} className={`flex items-center gap-5 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
            <div className="relative aspect-square w-[44%] shrink-0 overflow-hidden rounded-[1.5rem] border-4 border-white shadow-md ring-1 ring-line">
              <Image src={s.image} alt={s.title} fill sizes="200px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`flex items-center gap-1.5 ${i % 2 ? "justify-end" : ""}`}>
                <Daisy size={18} />
                <p className="font-script text-2xl text-olive">{s.title}</p>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-12 text-center font-script text-3xl leading-snug text-ink">
        Một ngày để nhớ…
        <br />
        Một đời để thương…
      </Reveal>
    </section>
  );
}

export function Album({ config }: { config: WeddingConfig }) {
  return (
    <section className="bg-paper/60 px-4 py-16">
      <SectionTitle eyebrow="Our Moments" title="Album cưới" />
      <AlbumGrid images={config.album} />
    </section>
  );
}
