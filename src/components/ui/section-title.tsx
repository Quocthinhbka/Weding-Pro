import { DaisyDivider } from "./daisy";

export function SectionTitle({ eyebrow, title, subtitle, compact = false }: { eyebrow?: string; title: string; subtitle?: string; compact?: boolean }) {
  return (
    <div className={`${compact ? "mb-4" : "mb-6"} shrink-0 text-center`}>
      {eyebrow && <p className="font-script text-3xl text-olive">{eyebrow}</p>}
      <h2 className="mt-1 font-serif text-xl font-semibold uppercase tracking-[0.18em] text-ink">{title}</h2>
      <DaisyDivider className="mt-3" />
      {subtitle && <p className="hide-short mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
    </div>
  );
}
