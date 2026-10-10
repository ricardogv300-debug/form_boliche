"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
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
    <section className={`card ${className}`}>
      <h2>{title}</h2>
      {subtitle && <p className="hint">{subtitle}</p>}
      <div className="mt-4">{children}</div>
      <details className="more">
        <summary>
          Ver datos en tabla
        </summary>
        <div className="tw" style={{ maxHeight: 224 }}>
          <table style={{ minWidth: 0 }}>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{nf.format(r.value)}</td>
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
    <div className={`card ${hero ? "kpi hot" : ""}`}>
      <p className="lbl">{label}</p>
      <p className="big" style={{ margin: "4px 0" }}>{value}</p>
      {detail && <small className="lbl" style={{ fontSize: 13 }}>{detail}</small>}
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
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-[var(--ink)] px-3 py-1.5 text-center"
            style={{ left: tip.x }}
          >
            <p className="text-sm font-bold text-[var(--panel)]">{plural(tip.d.value)}</p>
            <p className="whitespace-nowrap text-xs text-[var(--panel)] opacity-70">{tip.d.label}</p>
          </div>
        )}

        <div className="flex">
          <div className="relative w-10 shrink-0" style={{ height: plotHeight }}>
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute right-2 translate-y-1/2 text-xs tabular-nums text-[var(--muted)]"
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
                className="absolute inset-x-0 border-t border-[var(--line)]"
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
                    className="group relative flex flex-1 items-end justify-center px-px outline-none hover:bg-[var(--tile)] focus-visible:bg-[var(--tile)]"
                    onPointerMove={(e) => show(e.currentTarget, d)}
                    onFocus={(e) => show(e.currentTarget, d)}
                    onBlur={() => setTip(null)}
                  >
                    <div
                      className="adm-grow w-full max-w-6 rounded-t-[4px] bg-[var(--accent)] transition-opacity group-hover:opacity-75 group-focus-visible:opacity-75"
                      style={{ height: `${h}%`, "--i": Math.min(i, 20) / 3 } as CSSProperties}
                    />
                    {i === peak && (
                      <span
                        className="absolute text-xs font-bold tabular-nums text-[var(--ink)]"
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
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-[var(--muted)]">
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
      {data.map((d, idx) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className={`${labelWidth} shrink-0 text-sm font-medium text-[var(--ink)]`}>{d.label}</span>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className="adm-grow-x h-5 rounded-r-[4px] bg-[var(--accent)]"
              style={{ width: `${(d.value / max) * 88}%`, "--i": idx } as CSSProperties}
              role="img"
              aria-label={`${d.label}: ${plural(d.value)}`}
            />
            <span className="text-sm font-bold tabular-nums text-[var(--ink)]">{nf.format(d.value)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATUS_COLOR: Record<Rating, string> = { angry: "var(--bad)", neutral: "var(--warn)", happy: "var(--ok)" };

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
            <span className="flex-1 text-sm font-medium text-[var(--ink)]">{p.label}</span>
            <span className="text-sm font-bold tabular-nums text-[var(--ink)]">{nf.format(p.n)}</span>
            <span className="w-12 text-right text-sm tabular-nums text-[var(--muted)]">
              {total ? Math.round((p.n / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
