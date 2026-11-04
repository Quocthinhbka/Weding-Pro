import Image from "next/image";
import type { AlbumTheme, WeddingConfig } from "@/content/wedding";
import { Daisy } from "@/components/ui/daisy";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { AlbumGrid } from "./album-grid";

/** Sector dài 1,75 màn hình: các kỷ niệm chia đều chiều cao, nên vừa mọi cỡ màn hình. */
export function LoveStory({ config }: { config: WeddingConfig }) {
  return (
    <>
      <SectionTitle eyebrow="Love Story" title="Câu chuyện tình yêu" />
      <div className="grid min-h-0 flex-1 grid-flow-row auto-rows-fr gap-4">
        {config.loveStory.map((s, i) => (
          <Reveal key={i} className={`flex min-h-0 items-center gap-5 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
            <div className="relative aspect-square max-h-full w-[48%] shrink-0 overflow-hidden rounded-[1.5rem] border-4 border-white shadow-md ring-1 ring-line">
              <Image src={s.image} alt={s.title} fill sizes="240px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`flex items-center gap-1.5 ${i % 2 ? "justify-end" : ""}`}>
                <Daisy size={18} />
                <p className="font-script text-2xl text-olive">{s.title}</p>
              </div>
              <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-4 shrink-0 text-center font-script text-3xl leading-snug text-ink">
        Một ngày để nhớ…
        <br />
        Một đời để thương…
      </Reveal>
    </>
  );
}

/** Một chủ đề của album: sector dài 1,75 màn hình, ảnh xếp mosaic phủ kín chiều cao. */
export function AlbumThemeView({ theme, index, total }: { theme: AlbumTheme; index: number; total: number }) {
  return (
    <>
      <SectionTitle compact eyebrow={total > 1 ? `Our Moments ${index + 1}/${total}` : "Our Moments"} title={theme.title || "Album cưới"} />
      <AlbumGrid images={theme.images} />
    </>
  );
}
