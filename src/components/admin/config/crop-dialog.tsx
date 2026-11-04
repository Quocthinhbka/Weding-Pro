"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { clampPan, fitFrame, minScale, outputSize, sourceRect } from "@/lib/crop";

export type Aspects = readonly (readonly [label: string, aspect: number | null])[];

/** Cách cắt cho một ô ảnh. `aspect` cố định, hoặc `aspects` để người dùng chọn (null = giữ tỉ lệ ảnh gốc). */
export type CropSpec = {
  aspect?: number;
  aspects?: Aspects;
  outSide: number; // cạnh dài của ảnh sau khi cắt (điểm ảnh)
  png?: boolean; // mã QR: giữ PNG, thấy trọn ảnh, nền trắng
};

const MAX_ZOOM = 4;

/**
 * Hộp thoại căn chỉnh ảnh: kéo để dời, kéo thanh / cuộn chuột / chụm hai ngón để phóng to,
 * rồi cắt và thu nhỏ đúng kích thước trước khi tải lên.
 */
export function CropDialog({
  file,
  spec,
  title,
  onCancel,
  onSkip,
  onDone,
}: {
  file: File;
  spec: CropSpec;
  title: string;
  onCancel: () => void;
  onSkip?: { label: string; run: () => Promise<void> }[];
  onDone: (blob: Blob) => Promise<void>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [aspect, setAspect] = useState<number | null>(spec.aspect ?? spec.aspects?.[0]?.[1] ?? null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [maxSide] = useState(() => Math.min(340, window.innerWidth - 80)); // hộp thoại chỉ mở sau thao tác của người dùng
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImg(el);
    el.onerror = () => setLoadError("Không đọc được ảnh này. Hãy dùng ảnh JPG, PNG hoặc WebP.");
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const size = img && { w: img.naturalWidth, h: img.naturalHeight };
  const ratio = aspect ?? (size ? size.w / size.h : 1); // null = giữ tỉ lệ ảnh gốc
  const frame = fitFrame(ratio, maxSide);
  const mode = spec.png ? "contain" : "cover";
  const base = size ? minScale(size, frame, mode) : 1;

  // Đổi ảnh hoặc đổi tỉ lệ thì đặt lại: ảnh vừa khung, căn giữa.
  const placeKey = `${img?.src}|${ratio}|${maxSide}`;
  const [placed, setPlaced] = useState("");
  if (size && placed !== placeKey) {
    setPlaced(placeKey);
    setView({ scale: base, ...clampPan(size, frame, base, 0, 0) });
  }

  const zoom = view.scale / base;

  function setScale(next: number) {
    if (!size) return;
    const s = Math.min(base * MAX_ZOOM, Math.max(base, next));
    // Giữ nguyên điểm ở giữa khung khi phóng to / thu nhỏ.
    const cx = frame.w / 2;
    const cy = frame.h / 2;
    const k = s / view.scale;
    setView({ scale: s, ...clampPan(size, frame, s, cx - (cx - view.x) * k, cy - (cy - view.y) * k) });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = 0;
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !size) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch.current) setScale(view.scale * (dist / pinch.current));
      pinch.current = dist;
      return;
    }
    setView((v) => ({ ...v, ...clampPan(size, frame, v.scale, v.x + e.clientX - prev.x, v.y + e.clientY - prev.y) }));
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    pinch.current = 0;
  }

  async function apply() {
    if (!img || !size) return;
    setBusy(true);
    setError("");
    try {
      const { sx, sy, sw, sh } = sourceRect(frame, view.scale, view.x, view.y);
      const out = outputSize(ratio, spec.outSide, sw);
      const canvas = document.createElement("canvas");
      canvas.width = out.w;
      canvas.height = out.h;
      const g = canvas.getContext("2d")!;
      g.fillStyle = "#fff";
      g.fillRect(0, 0, out.w, out.h);
      g.imageSmoothingQuality = "high";
      g.drawImage(img, sx, sy, sw, sh, 0, 0, out.w, out.h);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, spec.png ? "image/png" : "image/jpeg", 0.92));
      if (!blob) throw new Error("Không cắt được ảnh");
      await onDone(blob);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function skip(run: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await run();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const sw = size ? sourceRect(frame, view.scale, view.x, view.y).sw : 0;
  const out = size ? outputSize(ratio, spec.outSide, sw) : null;

  return (
    <Modal open onClose={busy ? () => {} : onCancel} title={title} wide>
      {loadError ? (
        <div className="space-y-4">
          <p className="rounded-xl bg-rose/15 px-3 py-2 text-sm text-[#8a4a3e]">{loadError}</p>
          <button type="button" className="btn btn-outline w-full" onClick={onCancel}>
            Đóng
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {spec.aspects && (
            <div className="flex flex-wrap justify-center gap-1.5 text-xs">
              {spec.aspects.map(([label, a]) => (
                <button
                  key={label}
                  type="button"
                  disabled={busy}
                  onClick={() => setAspect(a)}
                  className={`rounded-full px-3 py-1 ring-1 ring-line ${aspect === a ? "bg-olive text-white" : "bg-white hover:bg-paper"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div
            style={{ width: frame.w, height: frame.h }}
            className={`relative mx-auto touch-none select-none overflow-hidden rounded-xl ring-2 ring-olive ${spec.png ? "bg-white" : "bg-paper"} ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) => setScale(view.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          >
            {img && size ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh tạm trên trình duyệt, chưa tải lên
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none"
                style={{ width: size.w * view.scale, height: size.h * view.scale, transform: `translate(${view.x}px, ${view.y}px)` }}
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-ink-soft">Đang mở ảnh…</div>
            )}
            {/* Lưới 1/3 giúp căn bố cục */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, transparent 33.2%, #fff 33.3%, transparent 33.5%, transparent 66.5%, #fff 66.6%, transparent 66.8%), linear-gradient(to bottom, transparent 33.2%, #fff 33.3%, transparent 33.5%, transparent 66.5%, #fff 66.6%, transparent 66.8%)",
              }}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-ink-soft">
            <span aria-hidden>🔍</span>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={busy || !img}
              onChange={(e) => setScale(base * Number(e.target.value))}
              className="w-full accent-[var(--olive)]"
              aria-label="Phóng to"
            />
          </label>
          <p className="text-center text-xs text-ink-soft">
            Kéo ảnh để căn vị trí; kéo thanh, cuộn chuột hoặc chụm hai ngón để phóng to.
            {out && <> Ảnh sau khi cắt: <b>{out.w}×{out.h}</b> px.</>}
          </p>

          {error && <p className="rounded-xl bg-rose/15 px-3 py-2 text-sm text-[#8a4a3e]">{error}</p>}

          <div className="grid gap-2">
            <button type="button" className="btn btn-primary" disabled={busy || !img} onClick={apply}>
              {busy ? "Đang xử lý…" : "Cắt và tải lên"}
            </button>
            {onSkip?.map((s) => (
              <button key={s.label} type="button" className="btn btn-outline" disabled={busy} onClick={() => skip(s.run)}>
                {s.label}
              </button>
            ))}
            <button type="button" className="text-sm text-ink-soft underline disabled:opacity-50" disabled={busy} onClick={onCancel}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
