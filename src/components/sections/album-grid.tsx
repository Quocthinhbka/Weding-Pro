"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

/** Chia ảnh thành các hàng 1 – 2 – 2 – 1 – 2…: hàng 1 ảnh là ảnh ngang to, hàng 2 ảnh là hai ảnh dọc. */
export function mosaicRows(n: number) {
  const pattern = [1, 2, 2];
  const rows: number[] = [];
  for (let left = n, i = 0; left > 0; i++) {
    const take = Math.min(pattern[i % pattern.length], left);
    rows.push(take);
    left -= take;
  }
  return rows;
}

export function AlbumGrid({ images }: { images: string[] }) {
  const [index, setIndex] = useState(-1);
  const rows = mosaicRows(images.length);
  let next = 0;
  return (
    <>
      <div className="grid min-h-0 flex-1 gap-2" style={{ gridTemplateRows: rows.map((r) => (r === 1 ? "1.25fr" : "1fr")).join(" ") }}>
        {rows.map((count, r) => (
          <div key={r} className="grid min-h-0 gap-2" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
            {Array.from({ length: count }, () => {
              const i = next++;
              return (
                <button
                  key={`${i}-${images[i]}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  className="relative min-h-0 overflow-hidden rounded-xl ring-1 ring-line"
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <Image src={images[i]} alt={`Ảnh cưới ${i + 1}`} fill sizes="(max-width: 480px) 90vw, 420px" className="object-cover transition duration-500 hover:scale-105" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={images.map((src) => ({ src }))} />
    </>
  );
}
