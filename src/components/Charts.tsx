"use client";

import { useRef, useState, type ReactNode } from "react";
import { Face } from "./Faces";
import { RATINGS, type Rating } from "@/lib/form-options";

export type Datum = { label: string; value: number; short?: string };

const nf = new Intl.NumberFormat("es-MX");
const plural = (n: number) => `${nf.format(n)} ${n === 1 ? "reporte" : "reportes"}`;

// Escala con 4 intervalos de números enteros "redondos" (0, 1, 2, 3, 4 / 0, 5, 10... ).
function niceScale(max: number) {
  for (let mag = 1; ; mag *= 10) {
    for (const s of [1, 2, 5]) {
      if (s * mag * 4 >= max) return { step: s * mag, top: s * mag * 4 };
    }
  }
}

export function ChartCard({
  title,
  subtitle,
  rows,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  rows: Datum[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border-2 border-brand-ink bg-white p-5 ${className}`}>
      <h2 className="text-lg font-black text-brand-ink">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-700">{subtitle}</p>}
      <div className="mt-4">{children}</div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-bold text-brand-red-dark underline-offset-4 hover:underline">
          Ver datos en tabla
        </summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-neutral-300">
          <table className="w-full text-left text-brand-ink">
            <tbody className="divide-y divide-neutral-200">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-3 py-1.5">{r.label}</td>
                  <td className="px-3 py-1.5 text-right font-bold tabular-nums">{nf.format(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  hero = false,
}: {
  label: string;
  value: string;
  detail?: string;
  hero?: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-ink bg-white p-5">
      <p className="text-sm font-bold text-neutral-700">{label}</p>
      <p className={`mt-1 font-black leading-none text-brand-ink ${hero ? "text-6xl" : "text-4xl"}`}>{value}</p>
      {detail && <p className="mt-2 text-sm text-neutral-700">{detail}</p>}
    </div>
  );
}

/** Columnas verticales: 24px máx., punta redondeada de 4px, hueco de 2px, tooltip por columna. */
export function ColumnChart({
  data,
  labelEvery = 1,
  plotHeight = 170,
}: {
  data: Datum[];
  labelEvery?: number;
  plotHeight?: number;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; d: Datum } | null>(null);

  const max = Math.max(0, ...data.map((d) => d.value));
  const { step, top } = niceScale(max);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const peak = max > 0 ? data.findIndex((d) => d.value === max) : -1;
  const minWidth = data.length * 14 + 40;

  const show = (el: HTMLElement, d: Datum) => {
    const box = inner.current;
    if (!box) return;
    const a = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const x = a.left - b.left + a.width / 2;
    setTip({ x: Math.min(Math.max(x, 64), Math.max(b.width - 64, 64)), d });
  };

  return (
    <div className="overflow-x-auto">
      <div ref={inner} className="relative pt-14" style={{ minWidth }} onPointerLeave={() => setTip(null)}>
        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border-2 border-brand-ink bg-brand-cream px-3 py-1.5 text-center shadow-[3px_3px_0_0_#1a0d0d]"
            style={{ left: tip.x }}
          >
            <p className="text-sm font-black text-brand-ink">{plural(tip.d.value)}</p>
            <p className="whitespace-nowrap text-xs text-neutral-700">{tip.d.label}</p>
          </div>
        )}

        <div className="flex">
          <div className="relative w-10 shrink-0" style={{ height: plotHeight }}>
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute right-2 translate-y-1/2 text-xs tabular-nums text-neutral-700"
                style={{ bottom: `${(t / top) * 100}%` }}
              >
                {nf.format(t)}
              </span>
            ))}
          </div>

          <div className="relative flex-1" style={{ height: plotHeight }}>
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute inset-x-0 border-t border-neutral-300"
                style={{ bottom: `${(t / top) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex">
              {data.map((d, i) => {
                const h = (d.value / top) * 100;
                return (
                  <div
                    key={d.label}
                    tabIndex={0}
                    role="img"
                    aria-label={`${d.label}: ${plural(d.value)}`}
                    className="group relative flex flex-1 items-end justify-center px-px outline-none hover:bg-brand-yellow/30 focus-visible:bg-brand-yellow/30"
                    onPointerMove={(e) => show(e.currentTarget, d)}
                    onFocus={(e) => show(e.currentTarget, d)}
                    onBlur={() => setTip(null)}
                  >
                    <div
                      className="w-full max-w-6 rounded-t-[4px] bg-brand-red transition-colors group-hover:bg-brand-red-dark group-focus-visible:bg-brand-red-dark"
                      style={{ height: `${h}%` }}
                    />
                    {i === peak && (
                      <span
                        className="absolute text-xs font-black tabular-nums text-brand-ink"
                        style={{ bottom: `calc(${h}% + 3px)` }}
                      >
                        {nf.format(d.value)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex pl-10">
          {data.map((d, i) => (
            <div key={d.label} className="relative flex-1 pt-1.5">
              {i % labelEvery === 0 && (
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-neutral-700">
                  {d.short ?? d.label}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="h-5" />
      </div>
    </div>
  );
}

/** Barras horizontales con el valor en la punta. Para categorías con nombres largos. */
export function BarList({ data, labelWidth = "w-36" }: { data: Datum[]; labelWidth?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className={`${labelWidth} shrink-0 text-sm font-medium text-brand-ink`}>{d.label}</span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className="h-5 rounded-r-[4px] bg-brand-red"
              style={{ width: `${(d.value / max) * 88}%` }}
              role="img"
              aria-label={`${d.label}: ${plural(d.value)}`}
            />
            <span className="text-sm font-black tabular-nums text-brand-ink">{nf.format(d.value)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATUS_COLOR: Record<Rating, string> = { angry: "#f87171", neutral: "#fbbf24", happy: "#86d957" };

/** Parte-del-todo: una sola barra apilada con hueco de 2px + leyenda con carita, cantidad y porcentaje. */
export function RatingBar({ counts }: { counts: Record<Rating, number> }) {
  const total = RATINGS.reduce((s, r) => s + (counts[r.value] ?? 0), 0);
  // Orden de peor a mejor: izquierda = no se solucionó.
  const parts = RATINGS.map((r) => ({ ...r, n: counts[r.value] ?? 0 }));

  return (
    <div>
      <div className="flex h-6 gap-0.5 overflow-hidden rounded-[4px]" role="img" aria-label="Distribución de calificaciones">
        {parts
          .filter((p) => p.n > 0)
          .map((p) => (
            <div key={p.value} style={{ width: `${(p.n / total) * 100}%`, background: STATUS_COLOR[p.value] }} />
          ))}
      </div>
      <ul className="mt-4 space-y-2">
        {parts.map((p) => (
          <li key={p.value} className="flex items-center gap-3">
            <Face type={p.value} size={28} />
            <span className="flex-1 text-sm font-medium text-brand-ink">{p.label}</span>
            <span className="text-sm font-black tabular-nums text-brand-ink">{nf.format(p.n)}</span>
            <span className="w-12 text-right text-sm tabular-nums text-neutral-700">
              {total ? Math.round((p.n / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
