"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Wish } from "@/lib/queries";
import { relativeTimeVi } from "@/lib/wedding-time";
import { postJson, useGuest } from "@/components/site/guest";
import { Daisy } from "@/components/ui/daisy";
import { SectionTitle } from "@/components/ui/section-title";

export function Guestbook({ initial }: { initial: Wish[] }) {
  const { state } = useGuest();
  const [wishes, setWishes] = useState(initial);
  const [name, setName] = useState<string | null>(null);
  const [message, setMessage] = useState("");
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
      const { wish } = await postJson<{ wish?: Wish }>("/api/wishes", { name: displayName, message, website });
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
    <section className="px-6 py-16">
      <SectionTitle
        eyebrow="Guestbook"
        title="Sổ lưu bút"
        subtitle="Trân trọng cảm ơn sự yêu mến và những lời chúc phúc ngọt ngào bạn dành cho chúng mình!"
      />
      <form onSubmit={submit} className="space-y-3 rounded-[2rem] bg-paper/70 p-5 ring-1 ring-line">
        <input className="field" placeholder="Tên của bạn *" value={displayName} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <textarea className="field min-h-24" placeholder="Lời chúc của bạn *" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={1000} />
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {error && <p className="text-sm text-[#8a4a3e]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Đang gửi…" : sent ? "Đã gửi lời chúc ✓" : "Gửi lời chúc"}
        </button>
      </form>

      <div className="mt-6 max-h-[460px] space-y-3 overflow-y-auto pr-1">
        {wishes.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">Hãy là người đầu tiên gửi lời chúc nhé!</p>}
        {wishes.map((w) => (
          <article key={w.id} className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-line">
            <div className="flex items-center gap-2">
              <Daisy size={18} />
              <p className="font-semibold text-ink">{w.name}</p>
              <p className="ml-auto text-xs text-ink-soft">{now ? relativeTimeVi(new Date(w.created_at), now) : ""}</p>
            </div>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{w.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
