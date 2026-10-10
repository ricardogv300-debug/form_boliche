"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import QrPoster from "./QrPoster";

type Sucursal = { slug: string; nombre: string };

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

export default function QrStudio({ sucursales, base }: { sucursales: Sucursal[]; base: string }) {
  const [choice, setChoice] = useState("general");
  const [size, setSize] = useState<PrintSize>("5x7");
  const canvas = useRef<HTMLCanvasElement>(null);

  // El QR lleva al menú de la sucursal (reportar pista, opinar de un mesero, queja o sugerencia).
  // El cartel general lleva al inicio, donde el cliente elige su sucursal.
  const sede = sucursales.find((s) => s.slug === choice);
  const url = sede ? `${base}/sucursal/${sede.slug}` : base;
  const label = sede ? sede.nombre : "Elige tu sucursal";

  const downloadPng = () => {
    const el = canvas.current;
    if (!el) return;
    const a = document.createElement("a");
    a.href = el.toDataURL("image/png");
    a.download = `qr-ilusion-bowl-${choice}.png`;
    a.click();
  };

  return (
    <div className="qr-layout">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <label className="field" htmlFor="qr-choice">
            ¿Para qué sucursal es el cartel?
          </label>
          <select
            id="qr-choice"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="input"
          >
            <option value="general">General: el cliente elige su sucursal</option>
            {sucursales.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </select>

          <label className="field" style={{ marginTop: 14 }} htmlFor="qr-size">
            Tamaño de impresión
          </label>
          <select
            id="qr-size"
            value={size}
            onChange={(e) => setSize(e.target.value as PrintSize)}
            className="input"
          >
            {(Object.keys(PRINT_SIZES) as PrintSize[]).map((k) => (
              <option key={k} value={k}>
                {PRINT_SIZES[k].label}
              </option>
            ))}
          </select>

          <p className="hint" style={{ wordBreak: "break-all" }}>
            El QR abre: <b>{url || "—"}</b>
          </p>
        </div>

        <div className="row wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn accent"
          >
            Imprimir cartel
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="btn dark"
          >
            Descargar solo el QR (PNG)
          </button>
        </div>
        <p className="hint">
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
