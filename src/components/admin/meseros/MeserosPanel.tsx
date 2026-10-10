"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { saveMesero, deleteMesero, setMeseroActivo, type MeseroState } from "@/app/admin/meseros/actions";
import { createClient } from "@/lib/supabase/client";
import { iniciales } from "@/lib/fotos";
import { Stars } from "../Icon";

export type MeseroView = {
  id: string;
  sucursal_id: string;
  sucursal: string;
  nombre: string;
  puesto: string;
  turno: string | null;
  telefono: string | null;
  fecha_ingreso: string | null;
  foto_path: string | null;
  foto_url: string | null;
  activo: boolean;
  avg: number;
  count: number;
  dist: number[]; // reseñas de 1 a 5 estrellas
  best: boolean;
};

type Sucursal = { id: string; nombre: string };

const TURNOS = ["Matutino", "Vespertino", "Nocturno", "Mixto"];
const MAX_SIDE = 512;

// Recorta la imagen a un cuadrado centrado y la reduce a 512 px: la foto pesa unos 40 KB y se ve igual de nítida.
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(MAX_SIDE, side);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85));
}

function Avatar({ nombre, url, size = 72 }: { nombre: string; url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene reducida a 512 px desde el navegador
    <img src={url} alt={`Foto de ${nombre}`} width={size} height={size} className="photo" style={{ width: size, height: size }} />
  ) : (
    <span className="photo ph" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {iniciales(nombre) || "?"}
    </span>
  );
}

function MeseroDialog({
  sucursales,
  mesero,
  defaultSucursal,
  onClose,
}: {
  sucursales: Sucursal[];
  mesero: MeseroView | null;
  defaultSucursal: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<MeseroState, FormData>(saveMesero, null);
  const [foto, setFoto] = useState<{ path: string | null; url: string | null }>({
    path: mesero?.foto_path ?? null,
    url: mesero?.foto_url ?? null,
  });
  const [subiendo, setSubiendo] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(mesero?.nombre ?? "");
  const subida = useRef<string | null>(null); // foto subida en esta sesión y todavía sin guardar

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      subida.current = null; // ya quedó guardada
      onClose();
    }
  }, [state, onClose]);

  const discardUnsaved = () => {
    if (subida.current) {
      createClient().storage.from("meseros").remove([subida.current]);
      subida.current = null;
    }
  };

  const close = () => {
    discardUnsaved();
    onClose();
  };

  async function pick(file: File | undefined) {
    if (!file) return;
    setFotoError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setFotoError("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    setSubiendo(true);
    try {
      const blob = await toSquareJpeg(file);
      const path = `${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from("meseros").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      discardUnsaved(); // si ya había subido otra en esta sesión, se descarta
      subida.current = path;
      setFoto({ path, url: URL.createObjectURL(blob) });
    } catch {
      setFotoError("No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <dialog ref={dialog} className="dlg" onClose={close} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <form action={action} className="dlg-in">
        <div className="row between">
          <h2>{mesero ? "Editar mesero" : "Agregar mesero"}</h2>
          <button type="button" className="ibtn" aria-label="Cerrar" onClick={() => dialog.current?.close()}>
            ✕
          </button>
        </div>

        {mesero && <input type="hidden" name="id" value={mesero.id} />}
        <input type="hidden" name="foto_path" value={foto.path ?? ""} />

        <div className="photo-pick">
          <Avatar nombre={nombre || "Mesero"} url={foto.url} size={96} />
          <div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button type="button" className="btn sm" onClick={() => fileInput.current?.click()} disabled={subiendo}>
                {subiendo ? "Subiendo..." : foto.url ? "Cambiar foto" : "Subir foto"}
              </button>
              {foto.path && (
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => {
                    discardUnsaved();
                    setFoto({ path: null, url: null });
                  }}
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="hint">JPG, PNG o WebP. Se recorta en cuadrado, así que elige una foto donde se vea la cara.</p>
            {fotoError && (
              <p role="alert" className="msg bad">
                {fotoError}
              </p>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div className="form-grid">
          <label className="field span2">
            Nombre completo
            <input name="nombre" required maxLength={80} className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Carlos Hernández" />
          </label>
          <label className="field">
            Sucursal
            <select name="sucursal_id" required defaultValue={mesero?.sucursal_id ?? defaultSucursal} className="input">
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Puesto
            <input name="puesto" maxLength={40} defaultValue={mesero?.puesto ?? "Mesero"} className="input" />
          </label>
          <label className="field">
            Turno
            <select name="turno" defaultValue={mesero?.turno ?? ""} className="input">
              <option value="">Sin definir</option>
              {TURNOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Fecha de ingreso
            <input name="fecha_ingreso" type="date" defaultValue={mesero?.fecha_ingreso ?? ""} className="input" />
          </label>
          <label className="field span2">
            Teléfono
            <input name="telefono" type="tel" maxLength={20} defaultValue={mesero?.telefono ?? ""} className="input" placeholder="Opcional" />
          </label>
        </div>

        <label className="check" style={{ paddingBottom: 0 }}>
          <input name="activo" type="checkbox" defaultChecked={mesero?.activo ?? true} />
          Activo (aparece en las reseñas)
        </label>

        {state?.error && (
          <p role="alert" className="alert">
            {state.error}
          </p>
        )}

        <div className="row" style={{ justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
          <button type="submit" className="btn accent" disabled={pending || subiendo}>
            {pending ? "Guardando..." : mesero ? "Guardar cambios" : "Agregar mesero"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Card({ m, showSucursal, onEdit }: { m: MeseroView; showSucursal: boolean; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const maxDist = Math.max(1, ...m.dist);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.error) alert(r.error);
    });

  return (
    <article className={`card mcard ${m.best ? "best" : ""} ${m.activo ? "" : "off"}`} aria-busy={pending}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <Avatar nombre={m.nombre} url={m.foto_url} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <b className="mname">{m.nombre}</b>
          <div className="meta">
            {m.puesto}
            {m.turno ? ` · ${m.turno}` : ""}
          </div>
          <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
            {showSucursal && <span className="badge s">{m.sucursal}</span>}
            {!m.activo && <span className="badge q">Inactivo</span>}
            {m.best && <span className="badge w">Mejor valorado</span>}
          </div>
        </div>
      </div>

      <div className="mrate">
        {m.count > 0 ? (
          <>
            <div className="row between">
              <span className="big" style={{ margin: 0, fontSize: 30 }}>
                {m.avg.toFixed(1)}
              </span>
              <div style={{ textAlign: "right" }}>
                <Stars value={m.avg} />
                <div className="meta">
                  {m.count} {m.count === 1 ? "reseña" : "reseñas"}
                </div>
              </div>
            </div>
            <div className="mdist" aria-label="Reseñas por estrellas">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} title={`${s} estrellas: ${m.dist[s - 1]}`}>
                  <span>{s}</span>
                  <i style={{ width: `${(m.dist[s - 1] / maxDist) * 100}%` }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="meta" style={{ padding: "14px 0" }}>
            Todavía no tiene reseñas en este periodo.
          </p>
        )}
      </div>

      <div className="divider" style={{ marginTop: 0 }}>
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn sm" onClick={onEdit}>
            Editar
          </button>
          <Link href={`/admin/qr?mesero=${m.id}`} className="btn sm">
            Código QR
          </Link>
          <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => setMeseroActivo(m.id, !m.activo))}>
            {m.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
        {confirming ? (
          <span className="row" style={{ gap: 8 }}>
            <button type="button" className="linkbtn" disabled={pending} onClick={() => run(() => deleteMesero(m.id))}>
              Sí, borrar
            </button>
            <button type="button" className="chip" onClick={() => setConfirming(false)}>
              No
            </button>
          </span>
        ) : (
          <button type="button" className="linkbtn" onClick={() => setConfirming(true)}>
            Borrar
          </button>
        )}
      </div>
    </article>
  );
}

export default function MeserosPanel({
  meseros,
  sucursales,
  selected,
}: {
  meseros: MeseroView[];
  sucursales: Sucursal[];
  selected: string | null;
}) {
  const [dialog, setDialog] = useState<{ mesero: MeseroView | null } | null>(null);
  const close = () => setDialog(null);
  const defaultSucursal = selected ?? sucursales[0]?.id ?? "";

  return (
    <>
      <div className="row between wrap" style={{ marginTop: 20 }}>
        <h2>Equipo</h2>
        <button type="button" className="btn accent" disabled={sucursales.length === 0} onClick={() => setDialog({ mesero: null })}>
          + Agregar mesero
        </button>
      </div>

      {sucursales.length === 0 ? (
        <p className="empty" style={{ marginTop: 14 }}>
          Primero registra una sucursal en la sección Sucursales.
        </p>
      ) : meseros.length === 0 ? (
        <div className="empty-hero">
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
            +
          </div>
          <h2>Aún no hay meseros aquí</h2>
          <p className="lbl">Agrega a tu equipo con su foto y sus datos. Cuando lleguen las reseñas, aquí verás cómo le va a cada uno.</p>
          <button type="button" className="btn accent" onClick={() => setDialog({ mesero: null })}>
            + Agregar mesero
          </button>
        </div>
      ) : (
        <div className="mgrid">
          {meseros.map((m) => (
            <Card key={m.id} m={m} showSucursal={!selected} onEdit={() => setDialog({ mesero: m })} />
          ))}
        </div>
      )}

      {dialog && (
        <MeseroDialog
          key={dialog.mesero?.id ?? "nuevo"}
          sucursales={sucursales}
          mesero={dialog.mesero}
          defaultSucursal={defaultSucursal}
          onClose={close}
        />
      )}
    </>
  );
}
