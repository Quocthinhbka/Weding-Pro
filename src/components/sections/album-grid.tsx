"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

/**
 * Số cột để ô ảnh gần vuông trong khung cao ~1,75 màn hình (khổ hẹp ~ 1:4):
 * ít ảnh thì ảnh to (2 cột), nhiều ảnh thì chia nhỏ dần (tối đa 4 cột).
 */
export function albumColumns(n: number) {
  return Math.min(4, Math.max(2, Math.round(Math.sqrt(n * 0.28))));
}

/** Ảnh đầu tiên là ảnh nổi bật chiếm 2×2 ô khi đủ ảnh. Trả về số hàng của lưới. */
export function albumLayout(n: number) {
  const cols = albumColumns(n);
  const featured = n >= 5 && cols >= 3;
  const cells = n + (featured ? 3 : 0); // ô 2×2 chiếm thêm 3 ô
  const leftover = cells % cols;
  // Hàng cuối lẻ thì ảnh cuối kéo dài ra cho đủ hàng, không để ô trống.
  return { cols, featured, rows: Math.ceil(cells / cols), lastSpan: leftover ? cols - leftover + 1 : 1 };
}

export function AlbumGrid({ images }: { images: string[] }) {
  const [index, setIndex] = useState(-1);
  const { cols, featured, rows, lastSpan } = albumLayout(images.length);
  return (
    <>
      <div
        className="grid min-h-0 flex-1 grid-flow-dense gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {images.map((src, i) => (
          <button
            key={`${i}-${src}`}
            type="button"
            onClick={() => setIndex(i)}
            style={i === images.length - 1 && lastSpan > 1 && !(featured && i === 0) ? { gridColumn: `span ${lastSpan}` } : undefined}
            className={`relative min-h-0 overflow-hidden rounded-xl ring-1 ring-line ${featured && i === 0 ? "col-span-2 row-span-2" : ""}`}
            aria-label={`Xem ảnh ${i + 1}`}
          >
            <Image src={src} alt={`Ảnh cưới ${i + 1}`} fill sizes="(max-width: 480px) 60vw, 280px" className="object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={images.map((src) => ({ src }))} />
    </>
  );
}
