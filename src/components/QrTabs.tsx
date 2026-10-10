"use client";

import { useState, useSyncExternalStore } from "react";
import BadgeStudio, { type BadgeMesero } from "./BadgeStudio";
import QrStudio from "./QrStudio";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export default function QrTabs({
  sucursales,
  meseros,
  initialTab,
  preselect,
}: {
  sucursales: { id: string; slug: string; nombre: string }[];
  meseros: BadgeMesero[];
  initialTab: "cartel" | "meseros";
  preselect: string | null;
}) {
  const [tab, setTab] = useState(initialTab);
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const [custom, setCustom] = useState<string | null>(null);

  const base = (custom ?? origin).trim().replace(/\/+$/, "");
  const isLocal = /localhost|127\.0\.0\.1|^http:\/\/192\.168\./.test(base);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
      <div className="row between wrap">
        <div className="chips" role="group" aria-label="Qué quieres imprimir">
          <button type="button" className="chip" aria-pressed={tab === "cartel"} onClick={() => setTab("cartel")}>
            Cartel de la sucursal
          </button>
          <button type="button" className="chip" aria-pressed={tab === "meseros"} onClick={() => setTab("meseros")}>
            Gafetes de meseros
          </button>
        </div>
      </div>

      <div className="card">
        <label className="field" htmlFor="qr-base">
          Dirección de tu página
        </label>
        <input id="qr-base" type="url" value={custom ?? origin} onChange={(e) => setCustom(e.target.value)} placeholder="https://tu-pagina.com" className="input" />
        {isLocal && (
          <p role="alert" className="alert">
            Esta dirección solo funciona en tu computadora. Abre este panel desde tu página en línea o escribe aquí su dirección antes de imprimir.
          </p>
        )}
      </div>

      {tab === "cartel" ? (
        <QrStudio sucursales={sucursales} base={base} />
      ) : (
        <BadgeStudio meseros={meseros} sucursales={sucursales} base={base} preselect={preselect} />
      )}
    </div>
  );
}
