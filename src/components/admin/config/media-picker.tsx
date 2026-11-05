"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

type Item = { url: string; size: number; at: number };

/**
 * Hộp chọn ảnh từ thư viện (các ảnh đã tải lên trước đây, mới nhất trước), không cần tải lại.
 * `max` = số ảnh tối đa được chọn trong một lần; 1 thì bấm vào ảnh là chọn luôn.
 */
export function MediaPicker({ title, max = 1, exclude = [], onPick, onClose }: { title: string; max?: number; exclude?: string[]; onPick: (urls: string[]) => void; onClose: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/media", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Không tải được thư viện ảnh"))))
      .then((d: { items: Item[] }) => alive && setItems(d.items))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  function toggle(url: string) {
    if (max === 1) return onPick([url]);
    setChosen((c) => (c.includes(url) ? c.filter((u) => u !== url) : c.length < max ? [...c, url] : c));
  }

  return (
    <Modal open onClose={onClose} title={title} wide>
      {error && <p className="rounded-xl bg-rose/15 px-3 py-2 text-sm text-[#8a4a3e]">{error}</p>}
      {!items && !error && <p className="py-8 text-center text-sm text-ink-soft">Đang tải thư viện…</p>}
      {items && items.length === 0 && <p className="py-8 text-center text-sm text-ink-soft">Chưa có ảnh nào được tải lên. Hãy tải ảnh lên trước.</p>}
      {items && items.length > 0 && (
        <>
          <p className="mb-3 text-xs text-ink-soft">
            {max === 1 ? "Bấm vào ảnh để chọn." : `Chọn tối đa ${max} ảnh, rồi bấm “Thêm”.`} Thư viện có {items.length} ảnh đã tải lên.
          </p>
          <div className="grid max-h-[55dvh] grid-cols-3 gap-2 overflow-y-auto overscroll-contain pr-1">
            {items.map((it) => {
              const idx = chosen.indexOf(it.url);
              const used = exclude.includes(it.url);
              return (
                <button
                  key={it.url}
                  type="button"
                  onClick={() => toggle(it.url)}
                  className={`relative aspect-square overflow-hidden rounded-xl bg-paper ring-2 transition ${idx >= 0 ? "ring-olive" : "ring-transparent hover:ring-line"}`}
                  aria-pressed={idx >= 0}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị */}
                  <img src={it.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {used && <span className="absolute left-1 top-1 rounded-full bg-ink/70 px-1.5 text-[10px] text-white">đang dùng</span>}
                  {idx >= 0 && <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-olive text-xs font-semibold text-white">{idx + 1}</span>}
                </button>
              );
            })}
          </div>
          {max > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Huỷ
              </button>
              <button type="button" className="btn btn-primary" disabled={chosen.length === 0} onClick={() => onPick(chosen)}>
                Thêm {chosen.length ? `(${chosen.length})` : ""}
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
