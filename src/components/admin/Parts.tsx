import type { CSSProperties, ReactNode } from "react";

export function SampleNote({ children }: { children?: ReactNode }) {
  return <p className="note">{children ?? "Vista de diseño con datos de ejemplo. Aún no está conectada a la base de datos."}</p>;
}

// Escala con 4 intervalos de números redondos (igual que las gráficas).
function niceTop(max: number) {
  for (let mag = 1; ; mag *= 10) {
    for (const s of [1, 2, 5]) if (s * mag * 4 >= max) return s * mag * 4;
  }
}

// Barras apiladas con una sola escala: reseñas abajo (negro) y reportes de pistas arriba (rojo rayado).
export function ActivityChart({ months, pistas, resenas }: { months: string[]; pistas: number[]; resenas: number[] }) {
  const W = 420;
  const H = 230;
  const L = 34;
  const B = 24;
  const T = 8;
  const max = niceTop(Math.max(4, ...months.map((_, i) => pistas[i] + resenas[i])));
  const bw = 28;
  const step = (W - L - 6) / months.length;
  const plotH = H - B - T;
  const y0 = H - B;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Reportes de pistas y reseñas por mes">
      <defs>
        <pattern id="adm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--accent)" opacity=".32" />
          <rect width="2.6" height="6" fill="var(--accent)" />
        </pattern>
      </defs>
      {[0, 1, 2, 3, 4].map((q) => q * (max / 4)).map((v) => {
        const y = y0 - (v / max) * plotH;
        return (
          <g key={v}>
            <line x1={L} x2={W} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={L - 6} y={y + 4} textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}
      {months.map((m, i) => {
        const x = L + i * step + (step - bw) / 2;
        const hr = (resenas[i] / max) * plotH;
        const hp = (pistas[i] / max) * plotH;
        return (
          <g key={m} style={{ "--i": i } as CSSProperties}>
            <rect x={x} y={y0 - hr} width={bw} height={hr} rx={6} fill="var(--bar-ink)" />
            <rect x={x} y={y0 - hr - hp - 2} width={bw} height={hp} rx={6} fill="url(#adm-hatch)" />
            <text x={x + bw / 2} y={H - 6} textAnchor="middle">
              {m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
