"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition, type DragEvent, type FormEvent } from "react";
import { addNota, createQueja, deleteQueja, moveQueja, setPrioridad } from "@/app/admin/quejas/actions";

export type Estado = "nueva" | "en_revision" | "atendida" | "descartada";
export type Seg = { id: string; tipo: "nota" | "estado"; nota: string | null; estado_nuevo: Estado | null; fecha: string };
export type Queja = {
  id: string;
  tipo: "queja" | "sugerencia";
  sucursal_id: string;
  sucursal: string;
  mensaje: string;
  nombre: string | null;
  contacto: string | null;
  prioridad: "normal" | "alta";
  estado: Estado;
  fecha: string;
  hace: string;
  segs: Seg[];
};
type Sucursal = { id: string; nombre: string };

const COLS: { k: Estado; label: string; hint: string }[] = [
  { k: "nueva", label: "Nuevas", hint: "Sin revisar" },
  { k: "en_revision", label: "En revisión", hint: "Se está atendiendo" },
  { k: "atendida", label: "Atendidas", hint: "Ya se resolvieron" },
  { k: "descartada", label: "Descartadas", hint: "No procede" },
];
const LABEL: Record<Estado, string> = { nueva: "Nueva", en_revision: "En revisión", atendida: "Atendida", descartada: "Descartada" };

type Action =
  | { type: "move"; id: string; estado: Estado }
  | { type: "prioridad"; id: string; prioridad: "normal" | "alta" }
  | { type: "nota"; id: string; nota: string }
  | { type: "delete"; id: string };

function reduce(list: Queja[], a: Action): Queja[] {
  if (a.type === "delete") return list.filter((q) => q.id !== a.id);
  return list.map((q) => {
    if (q.id !== a.id) return q;
    if (a.type === "move") {
      return { ...q, estado: a.estado, segs: [...q.segs, { id: `tmp-${q.segs.length}`, tipo: "estado", nota: null, estado_nuevo: a.estado, fecha: "Ahora" }] };
    }
    if (a.type === "prioridad") return { ...q, prioridad: a.prioridad };
    return { ...q, segs: [...q.segs, { id: `tmp-${q.segs.length}`, tipo: "nota", nota: a.nota, estado_nuevo: null, fecha: "Ahora" }] };
  });
}

function NewDialog({ sucursales, defaultSucursal, onClose }: { sucursales: Sucursal[]; defaultSucursal: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState<"queja" | "sugerencia">("queja");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    setError(null);
    start(async () => {
      const r = await createQueja(fd);
      if (r.error) setError(r.error);
      else ref.current?.close();
    });
  };

  return (
    <dialog ref={ref} className="dlg" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <form onSubmit={submit} className="dlg-in">
        <div className="row between">
          <h2>Registrar queja o sugerencia</h2>
          <button type="button" className="ibtn" aria-label="Cerrar" onClick={() => ref.current?.close()}>
            ✕
          </button>
        </div>
        <p className="hint">Para lo que te dijo un cliente en persona o por teléfono. Lo que llegue por formulario se sumará aquí solo.</p>

        <div className="chips">
          {(["queja", "sugerencia"] as const).map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
              {t === "queja" ? "Queja" : "Sugerencia"}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label className="field span2">
            Sucursal
            <select name="sucursal_id" required defaultValue={defaultSucursal} className="input">
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field span2">
            ¿Qué pasó o qué propone?
            <textarea name="mensaje" required minLength={5} maxLength={1000} rows={4} className="input" placeholder="Escribe el mensaje con el mayor detalle posible" />
          </label>
          <label className="field">
            Nombre del cliente
            <input name="nombre" maxLength={100} className="input" placeholder="Opcional" />
          </label>
          <label className="field">
            Contacto
            <input name="contacto" maxLength={120} className="input" placeholder="Teléfono o correo (opcional)" />
          </label>
        </div>
        <label className="check" style={{ paddingBottom: 0 }}>
          <input name="prioridad" type="checkbox" value="alta" />
          Marcar como prioridad alta
        </label>

        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => ref.current?.close()}>
            Cancelar
          </button>
          <button type="submit" className="btn accent" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Drawer({
  q,
  onClose,
  onMove,
  onPrioridad,
  onNota,
  onDelete,
}: {
  q: Queja;
  onClose: () => void;
  onMove: (e: Estado) => void;
  onPrioridad: (p: "normal" | "alta") => void;
  onNota: (n: string) => Promise<string | null>;
  onDelete: () => void;
}) {
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [q.segs.length]);

  const send = async () => {
    const text = nota.trim();
    if (text.length < 2) return;
    setError(null);
    setNota("");
    const err = await onNota(text);
    if (err) {
      setError(err);
      setNota(text);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden />
      <aside className="drawer" role="dialog" aria-label="Seguimiento">
        <div className="row between">
          <div className="row wrap" style={{ gap: 6 }}>
            <span className={`badge ${q.tipo === "queja" ? "q" : "s"}`}>{q.tipo === "queja" ? "Queja" : "Sugerencia"}</span>
            {q.prioridad === "alta" && <span className="badge q">Prioridad alta</span>}
          </div>
          <button type="button" className="ibtn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="dmsg">{q.mensaje}</p>
        <div className="meta">
          {q.sucursal} · {q.fecha}
          {q.nombre ? ` · ${q.nombre}` : ""}
          {q.contacto ? ` · ${q.contacto}` : ""}
        </div>

        <div>
          <div className="lbl" style={{ fontSize: 12, marginBottom: 6 }}>
            Estado
          </div>
          <div className="seg">
            {COLS.map((c) => (
              <button key={c.k} type="button" aria-pressed={q.estado === c.k} onClick={() => q.estado !== c.k && onMove(c.k)}>
                {LABEL[c.k]}
              </button>
            ))}
          </div>
        </div>

        <label className="check" style={{ paddingBottom: 0 }}>
          <input type="checkbox" checked={q.prioridad === "alta"} onChange={(e) => onPrioridad(e.target.checked ? "alta" : "normal")} />
          Prioridad alta
        </label>

        <div className="tl-wrap">
          <div className="lbl" style={{ fontSize: 12, marginBottom: 8 }}>
            Seguimiento
          </div>
          <ol className="tl">
            <li>
              <i />
              <div>
                <b>Se recibió</b>
                <span className="meta">{q.fecha}</span>
              </div>
            </li>
            {q.segs.map((s) => (
              <li key={s.id} className={s.tipo === "nota" ? "note" : ""}>
                <i />
                <div>
                  {s.tipo === "estado" ? <b>Pasó a {s.estado_nuevo ? LABEL[s.estado_nuevo].toLowerCase() : "otro estado"}</b> : <p>{s.nota}</p>}
                  <span className="meta">{s.fecha}</span>
                </div>
              </li>
            ))}
          </ol>
          <div ref={end} />
        </div>

        <div className="nota-box">
          <textarea
            className="input"
            rows={2}
            maxLength={1000}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Agrega una nota: qué se hizo, con quién se habló..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
          />
          <button type="button" className="btn dark" onClick={send} disabled={nota.trim().length < 2}>
            Agregar nota
          </button>
        </div>
        {error && (
          <p role="alert" className="msg bad">
            {error}
          </p>
        )}

        <div className="divider" style={{ marginTop: "auto" }}>
          <span>Se quedará guardado en el historial.</span>
          {confirming ? (
            <span className="row" style={{ gap: 8 }}>
              <button type="button" className="linkbtn" onClick={onDelete}>
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
      </aside>
    </>
  );
}

export default function QuejasBoard({ items, sucursales }: { items: Queja[]; sucursales: Sucursal[] }) {
  const [list, apply] = useOptimistic(items, reduce);
  const [, start] = useTransition();
  const [tipo, setTipo] = useState<"all" | "queja" | "sugerencia">("all");
  const [suc, setSuc] = useState("");
  const [soloAlta, setSoloAlta] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [drag, setDrag] = useState<{ id: string | null; over: Estado | null }>({ id: null, over: null });
  const [toast, setToast] = useState<string | null>(null);

  const open = list.find((q) => q.id === openId) ?? null;
  const filtered = useMemo(
    () => list.filter((q) => (tipo === "all" || q.tipo === tipo) && (!suc || q.sucursal_id === suc) && (!soloAlta || q.prioridad === "alta")),
    [list, tipo, suc, soloAlta],
  );
  const count = (e: Estado) => list.filter((q) => q.estado === e).length;
  const abiertas = count("nueva") + count("en_revision");
  const altas = list.filter((q) => q.prioridad === "alta" && (q.estado === "nueva" || q.estado === "en_revision")).length;

  const fail = (msg?: string) => {
    if (!msg) return;
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const move = (id: string, estado: Estado) => {
    const q = list.find((x) => x.id === id);
    if (!q || q.estado === estado) return;
    start(async () => {
      apply({ type: "move", id, estado });
      fail((await moveQueja(id, estado)).error);
    });
  };

  const onDrop = (e: DragEvent, estado: Estado) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || drag.id;
    setDrag({ id: null, over: null });
    if (id) move(id, estado);
  };

  const step = (q: Queja, dir: -1 | 1) => {
    const i = COLS.findIndex((c) => c.k === q.estado) + dir;
    if (i >= 0 && i < COLS.length) move(q.id, COLS[i].k);
  };

  return (
    <>
      <div className="row between wrap">
        <div>
          <h1>Quejas y sugerencias</h1>
          <p className="sub">Arrastra cada tarjeta a su etapa y deja notas para darle seguimiento hasta resolverla.</p>
        </div>
        <button type="button" className="btn accent" onClick={() => setCreating(true)} disabled={sucursales.length === 0}>
          + Registrar
        </button>
      </div>

      <div className="filters">
        <div className="chips">
          {([["all", "Todo"], ["queja", "Quejas"], ["sugerencia", "Sugerencias"]] as const).map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={tipo === k} onClick={() => setTipo(k)}>
              {l}
            </button>
          ))}
          <button type="button" className="chip" aria-pressed={soloAlta} onClick={() => setSoloAlta(!soloAlta)}>
            Prioridad alta{altas ? ` · ${altas}` : ""}
          </button>
        </div>
        <select className="sel" aria-label="Filtrar por sucursal" value={suc} onChange={(e) => setSuc(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        <span className="meta">
          {abiertas} {abiertas === 1 ? "abierta" : "abiertas"} · {count("atendida")} {count("atendida") === 1 ? "atendida" : "atendidas"}
        </span>
      </div>

      <div className="board">
        {COLS.map((c) => {
          const col = filtered.filter((q) => q.estado === c.k);
          return (
            <section
              key={c.k}
              className={`col ${drag.over === c.k ? "over" : ""}`}
              aria-label={c.label}
              onDragOver={(e) => {
                e.preventDefault();
                if (drag.over !== c.k) setDrag((d) => ({ ...d, over: c.k }));
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag((d) => ({ ...d, over: null }));
              }}
              onDrop={(e) => onDrop(e, c.k)}
            >
              <h3>
                <span className="ctitle">
                  {c.label}
                  <small>{c.hint}</small>
                </span>
                <span>{col.length}</span>
              </h3>
              {col.map((q) => (
                <article
                  key={q.id}
                  className={`qcard ${drag.id === q.id ? "dragging" : ""} ${q.prioridad === "alta" ? "alta" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", q.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDrag({ id: q.id, over: null });
                  }}
                  onDragEnd={() => setDrag({ id: null, over: null })}
                >
                  <button type="button" className="qbody" onClick={() => setOpenId(q.id)}>
                    <span className="row" style={{ gap: 6 }}>
                      <span className={`badge ${q.tipo === "queja" ? "q" : "s"}`}>{q.tipo === "queja" ? "Queja" : "Sugerencia"}</span>
                      {q.prioridad === "alta" && <span className="flag">● Alta</span>}
                    </span>
                    <span className="qtext">{q.mensaje}</span>
                    <span className="meta">
                      {q.sucursal} · {q.hace}
                      {q.segs.some((s) => s.tipo === "nota") ? ` · ${q.segs.filter((s) => s.tipo === "nota").length} 💬` : ""}
                    </span>
                  </button>
                  <div className="qmove">
                    <button type="button" aria-label="Mover a la etapa anterior" disabled={c.k === COLS[0].k} onClick={() => step(q, -1)}>
                      ←
                    </button>
                    <button type="button" aria-label="Mover a la siguiente etapa" disabled={c.k === COLS[COLS.length - 1].k} onClick={() => step(q, 1)}>
                      →
                    </button>
                  </div>
                </article>
              ))}
              {col.length === 0 && <div className="empty">{drag.id ? "Suéltala aquí" : "Nada por aquí."}</div>}
            </section>
          );
        })}
      </div>

      {open && (
        <Drawer
          q={open}
          onClose={() => setOpenId(null)}
          onMove={(e) => move(open.id, e)}
          onPrioridad={(p) =>
            start(async () => {
              apply({ type: "prioridad", id: open.id, prioridad: p });
              fail((await setPrioridad(open.id, p)).error);
            })
          }
          onNota={(nota) =>
            new Promise((resolve) =>
              start(async () => {
                apply({ type: "nota", id: open.id, nota });
                const r = await addNota(open.id, nota);
                resolve(r.error ?? null);
              }),
            )
          }
          onDelete={() => {
            const id = open.id;
            setOpenId(null);
            start(async () => {
              apply({ type: "delete", id });
              fail((await deleteQueja(id)).error);
            });
          }}
        />
      )}

      {creating && <NewDialog sucursales={sucursales} defaultSucursal={suc || sucursales[0]?.id || ""} onClose={() => setCreating(false)} />}
      {toast && (
        <div role="alert" className="toast">
          {toast}
        </div>
      )}
    </>
  );
}
