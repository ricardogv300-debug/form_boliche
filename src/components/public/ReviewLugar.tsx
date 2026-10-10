"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { submitResenaLugar, type ResenaInput } from "@/app/sucursal/resena-actions";
import { Face } from "../Faces";
import { BallTrack, PublicCard, Strike } from "./PublicParts";

const STAR = "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z";
const LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

type AreaKey = "ambiente" | "limpieza" | "atencion" | "comida" | "pistas" | "precio";
const AREAS: { key: AreaKey; label: string }[] = [
  { key: "ambiente", label: "Ambiente y música" },
  { key: "limpieza", label: "Limpieza" },
  { key: "atencion", label: "Atención del personal" },
  { key: "comida", label: "Comida y bebidas" },
  { key: "pistas", label: "Las pistas" },
  { key: "precio", label: "Precio" },
];

const VISITAS = [
  { v: "familia", l: "En familia" },
  { v: "amigos", l: "Con amigos" },
  { v: "pareja", l: "En pareja" },
  { v: "trabajo", l: "Evento de trabajo" },
  { v: "cumpleanos", l: "Cumpleaños" },
  { v: "otro", l: "Otro" },
];

const RECOMIENDA = [
  { v: "si", l: "Sí, claro", face: "happy" },
  { v: "tal_vez", l: "Tal vez", face: "neutral" },
  { v: "no", l: "No", face: "angry" },
] as const;

const STEP_NAMES = ["Tu visita", "Cada detalle", "Cuéntanos más", "Algo más"];

function StarRow({ value, onPick, label, small = false }: { value: number; onPick: (n: number) => void; label: string; small?: boolean }) {
  return (
    <div className={small ? "stars-mini" : "stars-pick"} role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= value ? "on" : ""}`}
          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
          aria-pressed={value === n}
          onClick={() => onPick(value === n && small ? 0 : n)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={STAR} />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewLugar({ sucursal, backHref }: { sucursal: { id: string; nombre: string }; backHref: string }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [general, setGeneral] = useState(0);
  const [areas, setAreas] = useState<Record<AreaKey, number>>({ ambiente: 0, limpieza: 0, atencion: 0, comida: 0, pistas: 0, precio: 0 });
  const [visita, setVisita] = useState("");
  const [recomienda, setRecomienda] = useState("");
  const [comentario, setComentario] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"queja" | "sugerencia">("queja");
  const [mensaje, setMensaje] = useState("");
  const [contacto, setContacto] = useState("");
  const [trampa, setTrampa] = useState("");
  const [done, setDone] = useState<{ queja: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);

  const go = (delta: number) => {
    setDirection(delta);
    setError(null);
    setStep((s) => s + delta);
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  };

  const send = (conQueja: boolean) => {
    setError(null);
    const input: ResenaInput = {
      calificacion: general,
      ...areas,
      recomendaria: recomienda,
      visita,
      comentario,
      nombre,
      tipo,
      mensaje: conQueja ? mensaje : "",
      contacto,
      website: trampa,
    };
    start(async () => {
      const r = await submitResenaLugar(sucursal.id, input);
      if (r.ok) setDone({ queja: r.quejaGuardada });
      else setError(r.error);
    });
  };

  const reset = () => {
    setStep(0);
    setDirection(1);
    setGeneral(0);
    setAreas({ ambiente: 0, limpieza: 0, atencion: 0, comida: 0, pistas: 0, precio: 0 });
    setVisita("");
    setRecomienda("");
    setComentario("");
    setNombre("");
    setMensaje("");
    setContacto("");
    setError(null);
    setDone(null);
  };

  const answered = Object.values(areas).filter(Boolean).length;
  const queja = mensaje.trim().length >= 5;

  return (
    <PublicCard sede={sucursal.nombre}>
      {done ? (
        <Strike again={{ label: "Enviar otra reseña", onClick: reset }} backHref={backHref}>
          Gracias por contarnos cómo estuvo tu visita a <b>{sucursal.nombre}</b>.
          {done.queja ? " También recibimos tu mensaje y el equipo le dará seguimiento." : " Tu opinión nos ayuda a mejorar."}
        </Strike>
      ) : (
        <>
          <BallTrack progress={step / 3} />
          <p className="step-label" aria-live="polite">
            Paso {step + 1} de 4 · {STEP_NAMES[step]}
          </p>

          <div className="stage" style={{ minHeight: 0 }}>
            <div key={step} className={`panel${direction < 0 ? " back" : ""}`}>
              {step === 0 && (
                <>
                  <h1 ref={heading} tabIndex={-1}>
                    ¿Cómo estuvo tu visita?
                  </h1>
                  <p className="sub">Danos tu calificación general de {sucursal.nombre}.</p>
                  <StarRow value={general} onPick={setGeneral} label="Calificación general de 1 a 5 estrellas" />
                  <p className="rate-label" aria-live="polite">
                    {LABELS[general]}
                  </p>
                  <div className="group">
                    <p className="label">
                      ¿Con quién nos visitaste? <small>opcional</small>
                    </p>
                    <div className="visits" role="group" aria-label="Tipo de visita">
                      {VISITAS.map((o) => (
                        <button key={o.v} type="button" className="chip" aria-pressed={visita === o.v} onClick={() => setVisita(visita === o.v ? "" : o.v)}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h1 ref={heading} tabIndex={-1}>
                    Califica cada detalle
                  </h1>
                  <p className="sub">Toca solo lo que quieras. Lo que no aplique, déjalo sin calificar.</p>
                  <div className="area-rows">
                    {AREAS.map((a) => (
                      <div key={a.key} className="area-row">
                        <span>{a.label}</span>
                        <StarRow small value={areas[a.key]} onPick={(n) => setAreas((s) => ({ ...s, [a.key]: n }))} label={`${a.label}: de 1 a 5 estrellas`} />
                      </div>
                    ))}
                  </div>
                  <p className="hint">{answered === 0 ? "Puedes continuar sin calificar ninguno." : `Calificaste ${answered} de ${AREAS.length}.`}</p>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 ref={heading} tabIndex={-1}>
                    Cuéntanos más
                  </h1>
                  <p className="sub">Tu comentario lo lee el equipo completo.</p>
                  <div className="group">
                    <p className="label">¿Nos recomendarías con tus amigos?</p>
                    <div className="faces" role="group" aria-label="Recomendación">
                      {RECOMIENDA.map((r) => (
                        <button key={r.v} type="button" className="face" data-v={r.face} aria-pressed={recomienda === r.v} onClick={() => setRecomienda(r.v)}>
                          <Face type={r.face} />
                          <span>{r.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="group">
                    <div className="field">
                      <label className="label" htmlFor="rl-comment">
                        ¿Qué fue lo mejor o lo que mejoraríamos? <small>opcional</small>
                      </label>
                      <textarea id="rl-comment" value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4} maxLength={1000} placeholder="Escribe lo que quieras compartir..." />
                      <p className="count">{comentario.length}/1000</p>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="rl-name">
                        Tu nombre <small>opcional</small>
                      </label>
                      <input id="rl-name" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoComplete="name" placeholder="Ej. María López" />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 ref={heading} tabIndex={-1}>
                    ¿Algo que quieras decirnos?
                  </h1>
                  <p className="sub">Si tuviste una queja o tienes una sugerencia, cuéntanosla aquí. Es opcional: si no, puedes terminar.</p>
                  <div className="group">
                    <div className="types" role="group" aria-label="Tipo de mensaje">
                      <button type="button" aria-pressed={tipo === "queja"} onClick={() => setTipo("queja")}>
                        <b>Queja</b>
                        <small>Algo salió mal</small>
                      </button>
                      <button type="button" aria-pressed={tipo === "sugerencia"} onClick={() => setTipo("sugerencia")}>
                        <b>Sugerencia</b>
                        <small>Una idea para mejorar</small>
                      </button>
                    </div>
                  </div>
                  <div className="group">
                    <div className="field">
                      <label className="label" htmlFor="rl-msg">
                        Tu mensaje
                      </label>
                      <textarea
                        id="rl-msg"
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        placeholder={tipo === "queja" ? "Cuéntanos qué pasó, dónde y más o menos a qué hora..." : "¿Qué te gustaría que hiciéramos o cambiáramos?"}
                      />
                      <p className="count">{mensaje.length}/1000</p>
                    </div>
                    {mensaje.trim().length > 0 && (
                      <div className="field">
                        <label className="label" htmlFor="rl-contact">
                          Teléfono o correo <small>opcional, por si necesitamos buscarte</small>
                        </label>
                        <input id="rl-contact" type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={120} autoComplete="email" placeholder="Para darte una respuesta" />
                      </div>
                    )}
                    {/* Campo trampa: queda fuera de la vista y de la navegación con teclado */}
                    <div className="gone" aria-hidden="true">
                      <label>
                        No lo llenes
                        <input type="text" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}

          <div className="nav">
            {step === 0 && (
              <Link href={backHref} className="change">
                ← Volver
              </Link>
            )}
            <div className="actions">
              {step > 0 && (
                <button type="button" className="btn ghost" onClick={() => go(-1)} disabled={pending}>
                  Atrás
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="btn primary" disabled={step === 0 && general === 0} onClick={() => go(1)}>
                  Siguiente
                </button>
              ) : (
                <>
                  <button type="button" className="btn ghost" disabled={pending} onClick={() => send(false)}>
                    {pending && !queja ? "Enviando..." : "No, enviar mi reseña"}
                  </button>
                  {queja && (
                    <button type="button" className="btn primary" disabled={pending} onClick={() => send(true)}>
                      {pending ? "Enviando..." : `Enviar con mi ${tipo}`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </PublicCard>
  );
}
