"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { collageRows, packCollage } from "@/lib/collage";

const GAP = 6;
const SPEED = 26; // px mỗi giây: tự trôi chậm từ phải sang trái
const DRAG_START = 6; // kéo quá ngần này px thì tính là kéo, không phải bấm vào ảnh
const MAX_FLING = 1800; // px/giây: vận tốc tối đa khi thả tay sau cú vuốt

/**
 * Album: một mảng ảnh khít nhau, to nhỏ khác nhau nhưng giữ nguyên tỉ lệ từng ảnh, tự trôi chậm từ phải sang trái.
 * Giữ tay thì ảnh dừng, kéo / vuốt sang trái hoặc phải để xem nhanh (thả tay sau cú vuốt có đà rồi chậm dần);
 * thả tay ra ảnh lại tự trôi như cũ. Bấm nhanh vào ảnh để xem lớn.
 * `ratios` (rộng/cao) do máy chủ đọc sẵn; ảnh nào chưa có (VD vừa thêm trong khung xem trước) thì đo ở trình duyệt.
 * Mảng được nhân bản liên tiếp nên vòng lặp liền mạch theo cả hai chiều kéo.
 */
export function AlbumDrift({ images, ratios }: { images: string[]; ratios: Record<string, number> }) {
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [measured, setMeasured] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    for (const src of images) {
      if (ratios[src] || measured[src]) continue;
      const im = new window.Image();
      im.onload = () => alive && im.naturalHeight && setMeasured((m) => ({ ...m, [src]: im.naturalWidth / im.naturalHeight }));
      im.src = src;
    }
    return () => {
      alive = false;
    };
  }, [images, ratios, measured]);

  const a = images.map((src) => ratios[src] ?? measured[src] ?? 1);
  const collage = size && size.h > 0 && images.length > 0 ? packCollage(a, size.h, GAP, collageRows(size.h, images.length)) : null;
  const copies = collage && size ? Math.max(2, Math.ceil(size.w / (collage.W + GAP)) + 1) : 0;
  const shift = collage ? collage.W + GAP : 0;

  // Vòng lặp chuyển động: vị trí `pos` (px đã trôi sang trái), vận tốc `v` hồi dần về tốc độ tự trôi khi không giữ tay.
  useEffect(() => {
    const root = box.current;
    const el = track.current;
    if (!root || !el || shift <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pos = 0;
    let v = reduce ? 0 : SPEED;
    let holding = false; // đang chạm giữ hoặc rê chuột: ảnh dừng lại
    let hover = false; // chuột đang nằm trên album
    let dragging = false;
    let moved = 0;
    let last = { x: 0, t: 0 };
    let lastV = 0;
    let visible = true;
    let raf = 0;
    let prev = performance.now();
    const apply = () => {
      pos = ((pos % shift) + shift) % shift;
      el.style.transform = `translate3d(${-pos}px,0,0)`;
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!holding && !dragging) {
        v += ((reduce ? 0 : SPEED) - v) * Math.min(1, dt * 2.5); // hồi dần về tốc độ trôi mặc định
        pos += v * dt;
        apply();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      holding = true;
      dragging = false;
      moved = 0;
      v = 0;
      lastV = 0;
      last = { x: e.clientX, t: performance.now() };
    };
    const move = (e: PointerEvent) => {
      if (!holding) return;
      const dx = e.clientX - last.x;
      const now = performance.now();
      moved += Math.abs(dx);
      if (!dragging && moved > DRAG_START) {
        dragging = true;
        root.setPointerCapture(e.pointerId);
      }
      if (dragging) {
        pos -= dx; // kéo sang phải thì ảnh đi sang phải
        apply();
        const dt = (now - last.t) / 1000;
        if (dt > 0) lastV = lastV * 0.6 + ((-dx / dt) * 0.4);
      }
      last = { x: e.clientX, t: now };
    };
    const up = (e: PointerEvent) => {
      if (!holding) return;
      holding = e.pointerType === "mouse" && hover; // chuột vẫn đang rê trên album thì tiếp tục dừng
      if (dragging) {
        dragging = false;
        v = Math.max(-MAX_FLING, Math.min(MAX_FLING, performance.now() - last.t < 80 ? lastV : 0)); // vuốt có đà thì trôi tiếp rồi chậm dần
        try {
          root.releasePointerCapture(e.pointerId);
        } catch {}
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
    };
    let suppressClick = false;
    const click = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        hover = true;
        holding = true; // rê chuột lên thì tạm dừng
      }
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hover = false;
      if (!dragging) holding = false;
    };
    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("click", click, true);
    apply();
    start();
    return () => {
      stop();
      io.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("click", click, true);
    };
  }, [shift]);

  return (
    <>
      <div ref={box} className="album-drift relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden rounded-2xl active:cursor-grabbing">
        {collage && (
          <div ref={track} className="absolute left-0 top-0 flex will-change-transform" style={{ gap: GAP, height: collage.H }}>
            {Array.from({ length: copies }, (_, c) => (
              <div key={c} className="flex shrink-0 flex-col" style={{ width: collage.W, height: collage.H, gap: GAP }} aria-hidden={c > 0}>
                {collage.rows.map((row, r) => (
                  <div key={r} className="flex" style={{ height: row.h, gap: GAP }}>
                    {row.tiles.map((t) => (
                      <button
                        key={t.i}
                        type="button"
                        tabIndex={c > 0 ? -1 : 0}
                        onClick={() => setIndex(t.i)}
                        className="relative shrink-0 overflow-hidden rounded-lg ring-1 ring-line"
                        style={{ width: t.w, height: t.h }}
                        aria-label={`Xem ảnh ${t.i + 1}`}
                      >
                        <Image src={images[t.i]} alt={`Ảnh cưới ${t.i + 1}`} fill sizes={`${Math.ceil(t.w)}px`} className="pointer-events-none object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={images.map((src) => ({ src }))} />
    </>
  );
}
