"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export function AlbumGrid({ images }: { images: string[] }) {
  const [index, setIndex] = useState(-1);
  return (
    <>
      <div className="grid grid-flow-dense grid-cols-3 gap-2">
        {images.map((src, i) => (
          <button
            key={`${i}-${src}`}
            type="button"
            onClick={() => setIndex(i)}
            className={`relative overflow-hidden rounded-xl ring-1 ring-line ${i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
            aria-label={`Xem ảnh ${i + 1}`}
          >
            <Image src={src} alt={`Ảnh cưới ${i + 1}`} fill sizes="(max-width: 480px) 66vw, 320px" className="object-cover transition duration-500 hover:scale-105" />
          </button>
        ))}
      </div>
      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={images.map((src) => ({ src }))} />
    </>
  );
}
