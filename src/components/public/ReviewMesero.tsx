"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { submitResenaMesero } from "@/app/sucursal/actions";
import { iniciales } from "@/lib/fotos";
import { BallTrack, PublicCard, Strike } from "./PublicParts";

export type MeseroPublico = { id: string; nombre: string; puesto: string; foto_url: string | null };

const LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];
const STAR = "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z";

function Pic({ m }: { m: MeseroPublico }) {
  return m.foto_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- foto ya reducida a 512 px
    <img src={m.foto_url} alt="" className="pic" />
  ) : (
    <span className="pic" aria-hidden>
      {iniciales(m.nombre)}
    </span>
  );
}

export default function ReviewMesero({
  sucursal,
  meseros,
  backHref,
  fixed = false,
}: {
  sucursal: { id: string; nombre: string };
  meseros: MeseroPublico[];
  backHref: string;
  /** Llegó por el QR de un mesero: ya sabemos quién es, así que se salta la elección. */
  fixed?: boolean;
}) {
  const [step, setStep] = useState(fixed ? 1 : 0);
  const [direction, setDirection] = useState(1);
  const [picked, setPicked] = useState<MeseroPublico | null>(fixed ? (meseros[0] ?? null) : null);
  const [stars, setStars] = useState(0);
  const [popped, setPopped] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);

  const go = (delta: number) => {
    setDirection(delta);
    setError(null);
    setStep((s) => s + delta);
    setTimeout(() => heading.current?.focus({ preventScroll: true }), 0);
  };

  const submit = () => {
    if (!picked) return;
    setError(null);
    start(async () => {
      const r = await submitResenaMesero(picked.id, stars, comment);
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  };

  const reset = () => {
    setStep(0);
    setDirection(1);
    setPicked(null);
    setStars(0);
    setComment("");
    setError(null);
    setDone(false);
  };

  return (
    <PublicCard sede={sucursal.nombre}>
      {done ? (
        <Strike again={fixed ? undefined : { label: "Opinar de otro mesero", onClick: reset }} backHref={backHref}>
          Gracias por opinar sobre <b>{picked?.nombre.split(" ")[0]}</b>. Tu reseña ayuda a reconocer a quien lo hace bien y a mejorar
          en {sucursal.nombre}.
        </Strike>
      ) : (
        <>
          <BallTrack progress={fixed ? 0.5 : step} />
          <p className="step-label" aria-live="polite">
            {fixed ? "Tu opinión" : `Paso ${step + 1} de 2 · ${step === 0 ? "Tu mesero" : "Tu opinión"}`}
          </p>

          <div className="stage" style={{ minHeight: 0 }}>
            <div key={step} className={`panel${direction < 0 ? " back" : ""}`}>
              {step === 0 ? (
                <>
                  <h1 ref={heading} tabIndex={-1}>
                    ¿Quién te atendió?
                  </h1>
                  <p className="sub">Toca a la persona que te atendió hoy.</p>
                  {meseros.length === 0 ? (
                    <p className="empty-note">Esta sucursal todavía no tiene meseros registrados. Vuelve pronto.</p>
                  ) : (
                    <div className="group">
                      <div className="waiters" role="group" aria-label="Meseros">
                        {meseros.map((m) => (
                          <button key={m.id} type="button" className="waiter" aria-pressed={picked?.id === m.id} onClick={() => setPicked(m)}>
                            <Pic m={m} />
                            <b>{m.nombre}</b>
                            <small>{m.puesto}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                picked && (
                  <>
                    <h1 ref={heading} tabIndex={-1}>
                      ¿Cómo fue su atención?
                    </h1>
                    <div className="picked">
                      <Pic m={picked} />
                      <div>
                        <b>{picked.nombre}</b>
                        <small>{picked.puesto}</small>
                      </div>
                    </div>

                    <div className="stars-pick" role="group" aria-label="Calificación de 1 a 5 estrellas">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`star ${n <= stars ? "on" : ""} ${popped === n ? "pop" : ""}`}
                          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                          aria-pressed={stars === n}
                          onClick={() => {
                            setStars(n);
                            setPopped(n);
                            setTimeout(() => setPopped(0), 260);
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d={STAR} />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <p className="rate-label" aria-live="polite">
                      {LABELS[stars]}
                    </p>

                    <div className="group">
                      <div className="field">
                        <label className="label" htmlFor="rv-comment">
                          Comentario <small>opcional</small>
                        </label>
                        <textarea
                          id="rv-comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          maxLength={600}
                          placeholder="¿Qué hizo bien o qué podría mejorar?"
                        />
                        <p className="count">{comment.length}/600</p>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}

          <div className="nav">
            {(step === 0 || fixed) && (
              <Link href={backHref} className="change">
                ← {fixed ? "Menú de la sucursal" : "Volver"}
              </Link>
            )}
            <div className="actions">
              {step > 0 && !fixed && (
                <button type="button" className="btn ghost" onClick={() => go(-1)}>
                  Atrás
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                disabled={pending || (step === 0 ? !picked : stars === 0)}
                onClick={step === 0 ? () => go(1) : submit}
              >
                {step === 0 ? "Siguiente" : pending ? "Enviando..." : "Enviar reseña"}
              </button>
            </div>
          </div>
        </>
      )}
    </PublicCard>
  );
}
