import { QRCodeSVG } from "qrcode.react";
import "./qr-poster.css";
import { Face } from "./Faces";

export default function QrPoster({ url, label }: { url: string; label: string }) {
  return (
    <div className="poster-print">
      <div className="poster">
        <div className="checker" />
        <div className="body">
          <div>
            <h2 className="p-title">
              ¿Algo falló
              <br />
              en tu pista?
            </h2>
            <p className="p-sub">Escanea y cuéntanos qué pasó</p>
          </div>

          <div className="qr-tile">
            <QRCodeSVG value={url} size={256} level="Q" marginSize={0} fgColor="#1a0d0d" bgColor="#ffffff" />
          </div>
          <span className="p-label">{label}</span>

          <p className="p-desc">
            Este código te lleva al <b>formulario para reportar fallas</b> en las pistas. Elige tu pista, dinos qué
            pasó y tu reporte llega directo al equipo.
          </p>

          <div className="p-box">
            <div className="p-faces">
              <Face type="angry" />
              <Face type="neutral" />
              <Face type="happy" />
            </div>
            <p className="p-thanks">¡Gracias por ayudarnos a mejorar!</p>
          </div>

          <div className="p-foot">
            <p className="p-hint">Ilusion Bowl · Hacemos tu juego ¡perfecto!</p>
            <p className="p-url">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
        <div className="checker" />
      </div>
    </div>
  );
}
