"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

/**
 * Mẫu các hàng, lặp lại: `h` là chiều cao tương đối của hàng, `w` là độ rộng tương đối của từng ảnh trong hàng.
 * Mỗi hàng luôn lấp đủ chiều ngang và các hàng lấp đủ chiều cao sector, nên ảnh to nhỏ khác nhau mà vẫn khít, không có ô trống.
 */
const PATTERN: { h: number; w: number[] }[] = [
  { h: 1.7, w: [1] },
  { h: 1, w: [1, 1, 1] },
  { h: 1.25, w: [2, 1] },
  { h: 1.25, w: [1, 2] },
  { h: 0.9, w: [1, 1, 1, 1] },
  { h: 1.5, w: [1, 1] },
];

export type AlbumRow = { h: number; w: number[] };

/** Chia n ảnh thành các hàng theo mẫu; hàng cuối thiếu ảnh thì chia đều (vẫn lấp đủ ngang). */
export function albumRows(n: number): AlbumRow[] {
  const rows: AlbumRow[] = [];
  for (let left = n, i = 0; left > 0; i++) {
    const p = PATTERN[i % PATTERN.length];
    rows.push(p.w.length <= left ? p : { h: p.h, w: Array(left).fill(1) });
    left -= p.w.length;
  }
  return rows;
}

export function AlbumGrid({ images }: { images: string[] }) {
  const [index, setIndex] = useState(-1);
  const rows = albumRows(images.length);
  let next = 0;
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {rows.map((row, r) => (
          <div key={r} className="flex min-h-0 gap-1.5" style={{ flex: `${row.h} 1 0` }}>
            {row.w.map((weight) => {
              const i = next++;
              return (
                <button
                  key={`${i}-${images[i]}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  style={{ flex: `${weight} 1 0` }}
                  className="relative min-w-0 overflow-hidden rounded-xl ring-1 ring-line"
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <Image src={images[i]} alt={`Ảnh cưới ${i + 1}`} fill sizes="(max-width: 480px) 80vw, 380px" className="object-cover transition duration-500 hover:scale-105" />
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
