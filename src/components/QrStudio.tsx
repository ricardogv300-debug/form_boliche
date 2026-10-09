"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { QRCodeCanvas } from "qrcode.react";
import QrPoster from "./QrPoster";

type Sucursal = { slug: string; nombre: string };

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

// Tamaños de hoja. 5x7 pulgadas es el del portacartel de acrílico; carta es para imprimir en cualquier impresora.
const PRINT_SIZES = {
  "5x7": {
    label: "5 × 7 pulgadas (portacartel de acrílico)",
    css: "@page { size: 5in 7in; margin: 0; } html, body { height: 7in !important; overflow: hidden !important; } .poster-print { width: 5in !important; margin: 0 !important; } .poster { height: 7in !important; aspect-ratio: auto !important; }",
  },
  carta: {
    label: "Carta (8.5 × 11 pulgadas)",
    css: "@page { size: letter; margin: 0; } html, body { height: 11in !important; overflow: hidden !important; } .poster-print { width: 7.3in !important; margin: 0.39in 0 0 0.6in !important; } .poster { height: 10.22in !important; aspect-ratio: auto !important; }",
  },
} as const;
type PrintSize = keyof typeof PRINT_SIZES;

const inputClass =
  "rounded-xl border-2 border-brand-ink bg-white px-3 py-2 text-[15px] font-medium text-brand-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20";

export default function QrStudio({ sucursales }: { sucursales: Sucursal[] }) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const [custom, setCustom] = useState<string | null>(null);
  const [choice, setChoice] = useState("general");
  const [size, setSize] = useState<PrintSize>("5x7");
  const canvas = useRef<HTMLCanvasElement>(null);

  const base = (custom ?? origin).trim().replace(/\/+$/, "");
  const sede = sucursales.find((s) => s.slug === choice);
  const url = sede ? `${base}/formulario/${sede.slug}` : base;
  const label = sede ? sede.nombre : "Elige tu sucursal";
  const isLocal = /localhost|127\.0\.0\.1|^http:\/\/192\.168\./.test(base);

  const downloadPng = () => {
    const el = canvas.current;
    if (!el) return;
    const a = document.createElement("a");
    a.href = el.toDataURL("image/png");
    a.download = `qr-ilusion-bowl-${choice}.png`;
    a.click();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-brand-ink bg-white p-4">
          <label className="block text-sm font-bold text-brand-ink" htmlFor="qr-choice">
            ¿Para qué sucursal es el cartel?
          </label>
          <select
            id="qr-choice"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className={`${inputClass} mt-2 w-full`}
          >
            <option value="general">General: el cliente elige su sucursal</option>
            {sucursales.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-bold text-brand-ink" htmlFor="qr-size">
            Tamaño de impresión
          </label>
          <select
            id="qr-size"
            value={size}
            onChange={(e) => setSize(e.target.value as PrintSize)}
            className={`${inputClass} mt-2 w-full`}
          >
            {(Object.keys(PRINT_SIZES) as PrintSize[]).map((k) => (
              <option key={k} value={k}>
                {PRINT_SIZES[k].label}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-bold text-brand-ink" htmlFor="qr-base">
            Dirección de tu página
          </label>
          <input
            id="qr-base"
            type="url"
            value={custom ?? origin}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="https://tu-pagina.com"
            className={`${inputClass} mt-2 w-full`}
          />
          <p className="mt-2 break-all text-xs text-neutral-700">
            El QR abre: <b>{url || "—"}</b>
          </p>
          {isLocal && (
            <p role="alert" className="mt-3 rounded-xl border-2 border-brand-red-dark bg-brand-cream px-3 py-2 text-sm font-semibold text-brand-red-dark">
              Esta dirección solo funciona en tu computadora. Abre este panel desde tu página en línea o escribe aquí
              su dirección antes de imprimir.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border-2 border-brand-ink bg-brand-red px-5 py-2.5 font-bold text-brand-cream shadow-[3px_3px_0_0_#1a0d0d] hover:bg-brand-red-dark"
          >
            Imprimir cartel
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="rounded-xl border-2 border-brand-ink bg-white px-5 py-2.5 font-bold text-brand-ink hover:bg-brand-yellow"
          >
            Descargar solo el QR (PNG)
          </button>
        </div>
        <p className="text-sm text-neutral-700">
          Para guardarlo como PDF, en la ventana de impresión elige &quot;Guardar como PDF&quot;. Si ves rayas blancas en el
          fondo, activa &quot;Gráficos de fondo&quot; en Más opciones.
        </p>
      </div>

      <style>{`@media print { ${PRINT_SIZES[size].css} }`}</style>
      <QrPoster url={url} label={label} />

      {/* QR en alta resolución para el botón de descarga */}
      <div className="hidden">
        <QRCodeCanvas ref={canvas} value={url} size={1024} level="Q" marginSize={4} fgColor="#1a0d0d" bgColor="#ffffff" />
      </div>
    </div>
  );
}
