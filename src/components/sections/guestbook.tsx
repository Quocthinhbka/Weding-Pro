"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PublicWish } from "@/lib/queries";
import { relativeTimeVi } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";
import { SectionTitle } from "@/components/ui/section-title";

const PAGE = 5;

export function Guestbook({ initial }: { initial: PublicWish[] }) {
  const { state } = useGuest();
  const [wishes, setWishes] = useState(initial);
  const [shown, setShown] = useState(PAGE); // hiện 5 lời chúc mới nhất, "Xem thêm" mở thêm 5 lời chúc nữa
  const [name, setName] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  // Tự điền tên khách đã biết, cho tới khi khách tự sửa ô tên.
  const displayName = name ?? state?.rsvp?.name ?? state?.guest?.name ?? "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { wish } = await postJson<{ wish?: PublicWish }>("/api/wishes", { name: displayName, message, private: isPrivate, website });
      if (wish) setWishes((w) => [wish, ...w]);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionTitle
        compact
        eyebrow="Guestbook"
        title="Sổ lưu bút"
        subtitle="Trân trọng cảm ơn sự yêu mến và những lời chúc phúc ngọt ngào bạn dành cho chúng mình!"
      />
      <form onSubmit={submit} className="shrink-0 space-y-2 rounded-[1.75rem] bg-paper/70 p-3 ring-1 ring-line">
        <input className="field" placeholder="Tên của bạn *" value={displayName} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <textarea className="field !min-h-0" rows={2} placeholder="Lời chúc của bạn *" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} />
        <div className="grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1 text-xs ring-1 ring-line" role="group" aria-label="Chế độ hiển thị lời chúc">
          {([[false, "🌐 Công khai"], [true, "🔒 Riêng tư"]] as const).map(([v, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsPrivate(v)}
              aria-pressed={isPrivate === v}
              className={`rounded-full py-1.5 font-medium transition ${isPrivate === v ? "bg-olive text-white shadow" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {error && <p className="text-sm text-[#8a4a3e]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Đang gửi…" : sent ? "Đã gửi lời chúc ✓" : "Gửi lời chúc"}
        </button>
      </form>

      {/* Cuộn hết danh sách rồi vuốt tiếp thì sang sector kế tiếp (không chặn cuộn lan) */}
      <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1" tabIndex={0} aria-label="Danh sách lời chúc">
        {wishes.length === 0 && (
          <div className="grid h-full min-h-24 place-items-center text-center text-sm text-ink-soft">
            <div>
              <Daisy size={34} className="mx-auto mb-2 opacity-70" />
              Hãy là người đầu tiên gửi lời chúc nhé!
            </div>
          </div>
        )}
        {wishes.slice(0, shown).map((w) => (
          <article key={w.id} className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-line">
            <div className="flex items-center gap-2">
              <Daisy size={18} />
              <p className="font-semibold text-ink">{w.name}</p>
              {w.private && <span className="rounded-full bg-rose/20 px-1.5 text-[10px] text-[#8a4a3e]">🔒 Riêng tư</span>}
              <p className="ml-auto text-xs text-ink-soft">{now ? relativeTimeVi(new Date(w.created_at), now) : ""}</p>
            </div>
            {w.message === null ? <BlurredMessage seed={w.id} /> : <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{w.message}</p>}
          </article>
        ))}
        {wishes.length > shown && (
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-outline w-full !py-2.5 !text-sm">
            Xem thêm {Math.min(PAGE, wishes.length - shown)} lời chúc ({wishes.length - shown} còn lại)
          </button>
        )}
      </div>
    </div>
  );
}

/** Lời chúc riêng tư: không có chữ thật, chỉ là vài vệt gradient mờ có độ dài khác nhau. */
function BlurredMessage({ seed }: { seed: number }) {
  const widths = [92, 78, 55].map((w, i) => `${Math.max(40, Math.min(96, w - ((seed * (i + 3)) % 18)))}%`);
  return (
    <div className="mt-2.5 space-y-1.5" aria-label="Lời chúc riêng tư">
      {widths.map((w, i) => (
        <div key={i} className="h-3 rounded-full bg-gradient-to-r from-rose/45 via-olive/35 to-daisy/50 blur-[5px]" style={{ width: w }} />
      ))}
    </div>
  );
}
