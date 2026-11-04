"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { GuestState } from "@/lib/queries";
import { Modal } from "@/components/ui/modal";
import { RsvpForm } from "./rsvp-form";

type GuestContextValue = {
  state: GuestState | null;
  setState: (s: GuestState) => void;
  refresh: () => Promise<void>;
  inviteCode: string | null;
  openRsvp: () => void;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used inside GuestProvider");
  return ctx;
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
  return data as T;
}

async function fetchGuestState(): Promise<GuestState | null> {
  const res = await fetch("/api/guest", { cache: "no-store" });
  return res.ok ? res.json() : null;
}

/** Thông tin khách hiện tại (tên, xác nhận tham dự, lượt quay) dùng chung cho toàn trang. */
export function GuestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuestState | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);

  const refresh = useCallback(async () => {
    const s = await fetchGuestState();
    if (s) setState(s);
  }, []);

  useEffect(() => {
    // Mở bằng link mời riêng (?k=...) thì gắn khách với lời mời đó.
    const code = new URLSearchParams(window.location.search).get("k");
    const load = code
      ? postJson<GuestState>("/api/guest/invite", { code }).then(
          (s) => {
            setInviteCode(code);
            return s;
          },
          () => fetchGuestState(),
        )
      : fetchGuestState();
    load.then((s) => s && setState(s)).catch(() => {});
  }, []);

  const openRsvp = useCallback(() => setRsvpOpen(true), []);

  return (
    <GuestContext.Provider value={{ state, setState, refresh, inviteCode, openRsvp }}>
      {children}
      <Modal open={rsvpOpen} onClose={() => setRsvpOpen(false)} title="Xác nhận tham dự">
        <RsvpForm onDone={() => setTimeout(() => setRsvpOpen(false), 2200)} />
      </Modal>
    </GuestContext.Provider>
  );
}
