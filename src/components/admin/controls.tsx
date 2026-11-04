"use client";

import { useState, useTransition, type ReactNode } from "react";

/** Nút gọi một server action (có hỏi xác nhận nếu cần). */
export function ActionButton({
  action,
  confirm,
  children,
  className = "rounded-lg border border-line bg-white px-2.5 py-1 text-xs hover:bg-paper",
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  children: ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`${className} disabled:opacity-50`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          await action();
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg bg-olive px-2.5 py-1 text-xs text-white hover:bg-olive-deep"
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Đã chép ✓" : "Chép link"}
    </button>
  );
}
