"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CropDialog } from "./crop-dialog";

// Các ô nhập dùng trong trang cấu hình thiệp.

export type MediaKind = "photo" | "qr" | "audio";

export async function uploadFile(file: Blob, kind: MediaKind): Promise<string> {
  const fallbackType = kind === "audio" ? "audio/mpeg" : "image/jpeg";
  const res = await fetch(`/api/admin/media?kind=${kind}`, {
    method: "POST",
    headers: { "Content-Type": file.type || fallbackType },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Tải lên thất bại");
  return data.url as string;
}

export function Card({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-36 rounded-3xl bg-cream p-5 ring-1 ring-line sm:p-6">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Ô nhập một dòng; `multiline` cho phép xuống dòng (Enter) và tự giãn chiều cao theo nội dung. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  maxLength,
  multiline = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: "text" | "date" | "time" | "tel";
  maxLength?: number;
  multiline?: boolean;
  className?: string;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value, multiline]);
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {multiline ? (
        <textarea ref={area} rows={1} className="field resize-none overflow-hidden" value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="field" value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

/** Ô nhập nhiều dòng: Enter xuống dòng, thiệp hiển thị đúng các dòng đã xuống. */
export function TextArea({ label, value, onChange, rows = 3, maxLength }: { label: string; value: string; onChange: (v: string) => void; rows?: number; maxLength?: number }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="field" rows={rows} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function NumberField({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="number" className="field" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

function useUpload(kind: MediaKind, onDone: (url: string) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onDone(await uploadFile(file, kind));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return { input, busy, error, handle };
}

/** Ô ảnh: xem trước + chọn hoặc kéo thả ảnh vào, căn chỉnh và cắt đúng tỉ lệ rồi mới tải lên. */
export function ImageField({
  label,
  value,
  onChange,
  kind = "photo",
  ratio = 3 / 4,
  outSide = 1600,
  optional = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "photo" | "qr";
  ratio?: number; // rộng / cao của khung hiển thị trên thiệp
  outSide?: number; // cạnh dài của ảnh sau khi cắt
  optional?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  function pick(f: File | undefined) {
    if (input.current) input.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Vui lòng chọn một tệp ảnh.");
    setError("");
    setFile(f);
  }

  return (
    <div className={className}>
      <span className="label">{label}</span>
      <div
        style={{ aspectRatio: ratio }}
        className={`relative w-full overflow-hidden rounded-2xl bg-paper ring-1 ${over ? "ring-2 ring-olive" : "ring-line"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị
          <img src={value} alt={label} className={`h-full w-full ${kind === "qr" ? "object-contain p-2" : "object-cover"}`} />
        ) : (
          <div className="grid h-full place-items-center p-2 text-center text-xs text-ink-soft">Chưa có ảnh. Kéo ảnh thả vào đây</div>
        )}
        {over && <div className="absolute inset-0 grid place-items-center bg-olive/20 text-sm font-medium text-olive-deep">Thả ảnh để căn chỉnh</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-olive px-3 py-1.5 text-xs text-white hover:bg-olive-deep" onClick={() => input.current?.click()}>
          {value ? "Đổi ảnh" : "Tải ảnh lên"}
        </button>
        {optional && value && (
          <button type="button" className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs hover:bg-paper" onClick={() => onChange("")}>
            Bỏ ảnh
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#8a4a3e]">{error}</p>}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {file && (
        <CropDialog
          file={file}
          spec={{ aspect: ratio, outSide, png: kind === "qr" }}
          title={`Căn chỉnh: ${label}`}
          onCancel={() => setFile(null)}
          onDone={async (blob) => {
            onChange(await uploadFile(blob, kind));
            setFile(null);
          }}
        />
      )}
    </div>
  );
}

export function AudioField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { input, busy, error, handle } = useUpload("audio", onChange);
  return (
    <div>
      <span className="label">Tệp nhạc (MP3, tối đa 25MB)</span>
      {value ? (
        <audio src={value} controls preload="none" className="w-full" />
      ) : (
        <p className="rounded-xl bg-paper px-3 py-2 text-sm text-ink-soft">Chưa có nhạc nền – nút nhạc sẽ được ẩn.</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-olive px-3 py-1.5 text-xs text-white hover:bg-olive-deep disabled:opacity-50" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Đang tải lên…" : value ? "Đổi bài khác" : "Tải nhạc lên"}
        </button>
        {value && (
          <button type="button" className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs hover:bg-paper" onClick={() => onChange("")}>
            Bỏ nhạc
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#8a4a3e]">{error}</p>}
      <input ref={input} type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,.mp3,.m4a" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}

/** Nút sắp xếp / xoá cho một phần tử trong danh sách. */
export function ItemTools({ index, count, onMove, onRemove, removeLabel = "Xoá" }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; removeLabel?: string }) {
  const btn = "grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-sm hover:bg-paper disabled:opacity-30";
  return (
    <div className="flex gap-1">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Đưa lên">
        ↑
      </button>
      <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Đưa xuống">
        ↓
      </button>
      <button type="button" className="h-8 rounded-lg border border-line bg-white px-2.5 text-xs text-[#8a4a3e] hover:bg-paper" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
  );
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-2xl border border-dashed border-olive/60 py-2.5 text-sm text-olive-deep hover:bg-olive/5">
      + {children}
    </button>
  );
}

export function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
