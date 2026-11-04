import { DaisyDivider } from "./daisy";

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      {eyebrow && <p className="font-script text-3xl text-olive">{eyebrow}</p>}
      <h2 className="mt-1 font-serif text-xl font-semibold uppercase tracking-[0.18em] text-ink">{title}</h2>
      <DaisyDivider className="mt-3" />
      {subtitle && <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
    </div>
  );
}
