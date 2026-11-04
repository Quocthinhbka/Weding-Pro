"use client";

import { useState, type FormEvent } from "react";
import { rsvpGroups } from "@/content/wedding";
import { useWedding } from "./wedding-context";
import type { GuestState } from "@/lib/queries";
import { formatLucky } from "@/lib/game-logic";
import { postJson, useGuest } from "./guest";

export function RsvpForm({ onDone }: { onDone?: () => void }) {
  const { state, setState, inviteCode } = useGuest();
  const groups = rsvpGroups(useWedding());
  const prev = state?.rsvp;
  const [name, setName] = useState(prev?.name ?? state?.guest?.name ?? "");
  const [attending, setAttending] = useState(prev ? prev.attending : true);
  const [partySize, setPartySize] = useState(prev?.partySize || 1);
  const [side, setSide] = useState(prev?.side ?? state?.guest?.side ?? "");
  const [events, setEvents] = useState<string[]>(prev?.events.length ? prev.events : []);
  const [phone, setPhone] = useState(prev?.phone ?? state?.guest?.phone ?? "");
  const [note, setNote] = useState(prev?.note ?? "");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuestState | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const s = await postJson<GuestState>("/api/rsvp", { name, attending, partySize, side, events, phone, note, inviteCode, website });
      setState(s);
      setResult(s);
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result?.rsvp) {
    return (
      <div className="py-6 text-center">
        <p className="font-script text-4xl text-olive">Cảm ơn bạn!</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {result.rsvp.attending
            ? "Xác nhận của bạn đã được gửi đến cô dâu chú rể. Hẹn gặp bạn trong ngày vui!"
            : "Rất tiếc vì bạn không đến được. Cảm ơn bạn đã báo cho chúng mình!"}
        </p>
        {result.rsvp.luckyNumber && (
          <p className="mt-5 inline-block rounded-2xl bg-paper px-5 py-3 text-sm">
            Số may mắn của bạn: <b className="font-serif text-2xl text-olive-deep">{formatLucky(result.rsvp.luckyNumber)}</b>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="-mt-2 text-sm text-ink-soft">Để cô dâu & chú rể chuẩn bị đón tiếp chu đáo nhất.</p>

      <div>
        <label className="label" htmlFor="rsvp-name">Tên của bạn *</label>
        <input id="rsvp-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="VD: Anh Nam & gia đình" />
      </div>

      <fieldset>
        <legend className="label">Bạn sẽ tham dự chứ? *</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            [true, "Có, tôi sẽ đến"],
            [false, "Rất tiếc, tôi không đến được"],
          ].map(([value, text]) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setAttending(value as boolean)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition ${attending === value ? "border-olive bg-olive text-white" : "border-line bg-white"}`}
            >
              {text as string}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Bạn là khách của *</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["trai", "Nhà trai"],
            ["gai", "Nhà gái"],
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSide(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition ${side === value ? "border-olive bg-olive text-white" : "border-line bg-white"}`}
            >
              Khách {text.toLowerCase()}
            </button>
          ))}
        </div>
      </fieldset>

      {attending && (
        <>
          <fieldset>
            <legend className="label">Bạn sẽ dự *</legend>
            <div className="space-y-2">
              {groups.map((g) => {
                const checked = events.includes(g.key);
                return (
                  <label key={g.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${checked ? "border-olive bg-olive/10" : "border-line bg-white"}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--olive)]"
                      checked={checked}
                      onChange={() => setEvents(checked ? events.filter((x) => x !== g.key) : [...events, g.key])}
                    />
                    {g.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="rsvp-size">Số người đi cùng (kể cả bạn)</label>
            <select id="rsvp-size" className="field" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} người</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="rsvp-phone">Số điện thoại (không bắt buộc)</label>
        <input id="rsvp-phone" className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="Để nhận quà từ trò chơi" />
      </div>

      <div>
        <label className="label" htmlFor="rsvp-note">Lời nhắn</label>
        <textarea id="rsvp-note" className="field min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>

      {/* Ô bẫy bot – người thật không thấy */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {error && <p className="rounded-xl bg-rose/15 px-3 py-2 text-sm text-[#8a4a3e]">{error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={busy || !side}>
        {busy ? "Đang gửi…" : prev ? "Cập nhật xác nhận" : "Gửi xác nhận"}
      </button>
      <p className="text-center text-xs text-ink-soft">Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.</p>
    </form>
  );
}
