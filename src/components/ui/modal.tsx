"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({ open, onClose, children, title, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-lg" : "sm:max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-ink-soft hover:bg-paper"
        >
          ×
        </button>
        {title && <h3 className="mb-5 pr-8 font-serif text-xl font-semibold text-ink">{title}</h3>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
