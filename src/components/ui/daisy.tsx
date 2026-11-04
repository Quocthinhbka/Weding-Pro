import type { SVGProps } from "react";

// Hoa cúc vẽ bằng SVG: cánh trắng xếp vòng quanh nhụy vàng.

function DaisyHead({ petals = 16, petalColor = "#fff", centerColor = "var(--daisy)" }: { petals?: number; petalColor?: string; centerColor?: string }) {
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-25"
          rx="7"
          ry="21"
          fill={petalColor}
          stroke="#e4d8c2"
          strokeWidth="1.2"
          transform={`rotate(${(360 / petals) * i})`}
        />
      ))}
      <circle r="12.5" fill={centerColor} />
      <circle r="12.5" fill="none" stroke="#d9a43a" strokeWidth="1.5" />
      {[[-4, -4], [3, -5], [5, 2], [-2, 4], [-6, 2], [1, -1]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#c98f2a" opacity="0.7" />
      ))}
    </g>
  );
}

export function Daisy({ size = 48, petals, className, ...rest }: { size?: number; petals?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} aria-hidden {...rest}>
      <DaisyHead petals={petals} />
    </svg>
  );
}

/** Cành hoa cúc: thân cong, lá và ba bông hoa. */
export function DaisySprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 220" className={className} aria-hidden style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <g fill="none" stroke="var(--olive)" strokeWidth="2.2" strokeLinecap="round">
        <path d="M80 218 C 78 170, 70 130, 52 92" />
        <path d="M78 170 C 92 140, 108 118, 118 82" />
        <path d="M74 140 C 70 110, 84 70, 82 40" />
      </g>
      <g fill="var(--olive)" opacity="0.85">
        <path d="M78 190 C 58 182, 46 168, 44 150 C 62 156, 74 168, 78 190 Z" />
        <path d="M82 160 C 100 156, 114 146, 120 130 C 102 132, 88 142, 82 160 Z" />
        <path d="M72 120 C 58 112, 52 100, 52 86 C 64 94, 70 104, 72 120 Z" opacity="0.7" />
      </g>
      <g transform="translate(52 88) scale(0.55)">
        <DaisyHead />
      </g>
      <g transform="translate(118 78) scale(0.45)">
        <DaisyHead petals={14} />
      </g>
      <g transform="translate(82 36) scale(0.62)">
        <DaisyHead petals={18} />
      </g>
    </svg>
  );
}

export function DaisyDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-line" />
      <Daisy size={22} />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-line" />
    </div>
  );
}

export function Heart({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...rest}>
      <path
        fill="currentColor"
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.3 1.8-2.1 3.3-3.3 5.4-3.3 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z"
      />
    </svg>
  );
}
