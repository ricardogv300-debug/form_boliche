"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { iniciales } from "@/lib/fotos";
import "./badge.css";

export type BadgeMesero = {
  id: string;
  nombre: string;
  puesto: string;
  foto_url: string | null;
  sucursal_id: string;
  sucursal: string;
};

type Sucursal = { id: string; nombre: string };

const SIZES = {
  grande: { label: "Grande: 4 por hoja (3.5 × 4.6 pulgadas)", perPage: 4 },
  chico: { label: "Chico: 9 por hoja (2.3 × 3 pulgadas)", perPage: 9 },
} as const;
type Size = keyof typeof SIZES;

function BadgeCard({ m, url }: { m: BadgeMesero; url: string }) {
  return (
    <div className="badge-card">
      <div className="bd-checker" />
      <div className="bd-inner">
        <span className="bd-brand">ilusion Bowl</span>
        <div className="bd-who">
          {m.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto ya reducida a 512 px
            <img className="bd-photo" src={m.foto_url} alt="" crossOrigin="anonymous" />
          ) : (
            <span className="bd-photo" aria-hidden>
              {iniciales(m.nombre)}
            </span>
          )}
          <div>
            <p className="bd-name">{m.nombre}</p>
            <p className="bd-role">{m.puesto}</p>
          </div>
        </div>
        <div className="bd-qr">
          <QRCodeSVG value={url} size={256} level="Q" marginSize={0} fgColor="#1a0d0d" bgColor="#ffffff" />
        </div>
        <p className="bd-cta">Escanea y opina sobre mi servicio</p>
        <span className="bd-where">{m.sucursal}</span>
      </div>
      <div className="bd-checker" />
    </div>
  );
}

export default function BadgeStudio({
  meseros,
  sucursales,
  base,
  preselect,
}: {
  meseros: BadgeMesero[];
  sucursales: Sucursal[];
  base: string;
  preselect: string | null;
}) {
  const initial = preselect ? meseros.find((m) => m.id === preselect) : null;
  const [suc, setSuc] = useState(initial?.sucursal_id ?? "");
  const [size, setSize] = useState<Size>("grande");
  // Quienes NO se imprimen. Si llegaste desde un mesero en particular, solo se queda ese.
  const [off, setOff] = useState<Set<string>>(() => new Set(initial ? meseros.filter((m) => m.id !== initial.id).map((m) => m.id) : []));

  const visibles = useMemo(() => meseros.filter((m) => !suc || m.sucursal_id === suc), [meseros, suc]);
  const seleccionados = visibles.filter((m) => !off.has(m.id)).length;
  const hojas = Math.ceil(seleccionados / SIZES[size].perPage);

  const toggle = (id: string) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setAll = (on: boolean) =>
    setOff((prev) => {
      const next = new Set(prev);
      for (const m of visibles) {
        if (on) next.delete(m.id);
        else next.add(m.id);
      }
      return next;
    });

  if (meseros.length === 0) {
    return (
      <div className="empty-hero">
        <h2>Aún no hay meseros activos</h2>
        <p className="lbl">Agrégalos en la sección Meseros. Cada uno tendrá su propio gafete con un código QR.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card no-print">
        <div className="form-grid">
          <label className="field">
            Sucursal
            <select value={suc} onChange={(e) => setSuc(e.target.value)} className="input">
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tamaño del gafete
            <select value={size} onChange={(e) => setSize(e.target.value as Size)} className="input">
              {(Object.keys(SIZES) as Size[]).map((k) => (
                <option key={k} value={k}>
                  {SIZES[k].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          El código de cada mesero abre directo su reseña: el cliente solo escanea, da sus estrellas y envía. Marca a quiénes quieres imprimir.
        </p>
        <div className="row wrap" style={{ marginTop: 12 }}>
          <button type="button" className="btn accent" disabled={seleccionados === 0} onClick={() => window.print()}>
            Imprimir {seleccionados} {seleccionados === 1 ? "gafete" : "gafetes"}
            {seleccionados > 0 ? ` · ${hojas} ${hojas === 1 ? "hoja" : "hojas"}` : ""}
          </button>
          <button type="button" className="btn sm" onClick={() => setAll(true)}>
            Marcar todos
          </button>
          <button type="button" className="btn sm" onClick={() => setAll(false)}>
            Quitar todos
          </button>
        </div>
        <p className="hint">
          Se imprime en hoja carta, con línea punteada para recortar. En la ventana de impresión activa &quot;Gráficos de fondo&quot; para que se vean los colores.
        </p>
      </div>

      <div className="badge-sheet" data-size={size}>
        {visibles.map((m) => (
          <div key={m.id} className={`badge-cell ${off.has(m.id) ? "off" : ""}`}>
            <label className="badge-pick">
              <input type="checkbox" checked={!off.has(m.id)} onChange={() => toggle(m.id)} />
              Imprimir
            </label>
            <BadgeCard m={m} url={`${base}/mesero/${m.id}`} />
          </div>
        ))}
        {visibles.length === 0 && <p className="empty">No hay meseros activos en esta sucursal.</p>}
      </div>
    </div>
  );
}
