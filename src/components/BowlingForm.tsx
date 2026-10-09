"use client";

import "./bowling-form.css";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { DAYS, EMPTY_FORM, RATINGS, TIME_SLOTS, type ComplaintForm } from "@/lib/form-options";
import { submitReport } from "@/app/formulario/actions";
import { Face } from "./Faces";

const TOTAL_STEPS = 4;
const STEP_NAMES = ["Pista", "Cuándo", "El problema", "Tu opinión"];
const STEP_COPY = [
  { title: "¿Qué pista falló?", subtitle: "Toca el carril donde tuviste el problema." },
  { title: "¿Cuándo ocurrió?", subtitle: "Dinos el día de la semana y el horario aproximado." },
  { title: "¿Qué problema tuviste?", subtitle: "Cuéntanos con detalle qué pasó con la pista." },
  { title: "¿Se solucionó tu problema?", subtitle: "Elige la carita que mejor describa tu experiencia." },
];
const QUICK_IDEAS = [
  "Los pinos no se acomodaron",
  "La bola no regresó",
  "La pista estaba resbalosa",
  "El marcador no funcionó",
  "La barrera no bajó",
];

function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <g id="bf-pin">
          <path
            d="M30 2c-9 0-13 8-12 17 1 7 5 11 3 18-2 6-14 20-14 45 0 22 8 34 8 48 0 7 3 14 15 14s15-7 15-14c0-14 8-26 8-48 0-25-12-39-14-45-2-7 2-11 3-18 1-9-3-17-12-17z"
            fill="#fff4e3"
            stroke="#1a0d0d"
            strokeWidth="3"
          />
          <path d="M19 42c8 4 14 4 22 0M17 52c9 4 17 4 26 0" stroke="#d4202b" strokeWidth="5" fill="none" />
        </g>
        <g id="bf-ball">
          <circle cx="60" cy="60" r="58" fill="#241a3a" stroke="#1a0d0d" strokeWidth="3" />
          <ellipse cx="40" cy="32" rx="16" ry="9" fill="#fff" opacity=".2" transform="rotate(-30 40 32)" />
          <circle cx="62" cy="40" r="5" fill="#0d0710" />
          <circle cx="78" cy="48" r="5" fill="#0d0710" />
          <circle cx="68" cy="58" r="5" fill="#0d0710" />
        </g>
      </defs>
    </svg>
  );
}

const Pin = () => (
  <svg viewBox="0 0 60 160" aria-hidden="true">
    <use href="#bf-pin" />
  </svg>
);

export default function BowlingForm({
  sucursal,
}: {
  sucursal: { id: string; nombre: string; numPistas: number };
}) {
  const sede = sucursal.nombre;
  const lanes = Array.from({ length: sucursal.numPistas }, (_, i) => i + 1);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<ComplaintForm>(EMPTY_FORM);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) heading.current?.focus({ preventScroll: true });
    else mounted.current = true;
  }, [step]);

  const set = <K extends keyof ComplaintForm>(key: K, value: ComplaintForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinue = [
    form.lane !== null,
    form.day !== null && form.timeSlot !== null,
    form.name.trim().length >= 2 && form.description.trim().length >= 5,
    form.rating !== null,
  ][step];

  const go = (delta: number) => {
    setDirection(delta);
    setError(null);
    setStep((s) => s + delta);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitReport(sucursal.id, form);
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setStep(0);
    setDirection(1);
    setError(null);
    setDone(false);
  };

  const addIdea = (idea: string) => {
    const current = form.description.trim().replace(/\.*$/, "");
    set("description", (current ? `${current}. ${idea}` : idea).slice(0, 600));
  };

  const progress = step / (TOTAL_STEPS - 1);

  return (
    <div className="bf">
      <Defs />
      <div className="card">
        {done ? (
          <div className="done" role="status">
            <div className="strike" aria-hidden="true">
              <div className="arrows" />
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className={`pin k${k}`}>
                  <Pin />
                </div>
              ))}
              <div className="ball-roll">
                <svg viewBox="0 0 120 120">
                  <use href="#bf-ball" />
                </svg>
              </div>
            </div>
            <p className="chuza">¡Chuza!</p>
            <p className="thanks">
              Registramos tu queja sobre la <b>pista {form.lane}</b> de {sede}, {form.name.trim().split(" ")[0]}. La
              revisaremos lo antes posible.
            </p>
            <button type="button" className="btn ghost" onClick={reset}>
              Enviar otra queja
            </button>
            <Link href="/" className="change">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <div className="topbar">
              <Image src="/logo-ilusion-bowl.png" alt="Ilusion Bowl" width={1294} height={1398} className="logo-img" priority />
              <span className="sede">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.4" />
                </svg>
                {sede}
              </span>
            </div>

            <div className="track" style={{ "--p": progress } as CSSProperties} aria-hidden="true">
              <div className="lane-line">
                <div className="lane-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="ball">
                <svg viewBox="0 0 120 120">
                  <use href="#bf-ball" />
                </svg>
              </div>
              <div className="pinset">
                <Pin />
                <Pin />
                <Pin />
              </div>
            </div>
            <p className="step-label" aria-live="polite">
              Paso {step + 1} de {TOTAL_STEPS} · {STEP_NAMES[step]}
            </p>

            <div className="stage">
              <div key={step} className={`panel${direction < 0 ? " back" : ""}`}>
                <h1 ref={heading} tabIndex={-1}>
                  {STEP_COPY[step].title}
                </h1>
                <p className="sub">{STEP_COPY[step].subtitle}</p>

                {step === 0 && (
                  <div className="group">
                    <p className="label">
                      Número de pista <small>{lanes.length} pistas</small>
                    </p>
                    <div className="lanes" role="group" aria-label="Pistas">
                      {lanes.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="lane"
                          aria-pressed={form.lane === n}
                          aria-label={`Pista ${n}`}
                          onClick={() => set("lane", n)}
                        >
                          <span className="n">{n}</span>
                        </button>
                      ))}
                    </div>
                    <p className="hint">
                      {form.lane ? (
                        <>
                          Elegiste la <b>pista {form.lane}</b>.
                        </>
                      ) : (
                        "Aún no eliges ninguna pista."
                      )}
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div className="group">
                      <p className="label">Día de la semana</p>
                      <div className="days" role="group" aria-label="Día de la semana">
                        {DAYS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            className="chip"
                            aria-pressed={form.day === d}
                            aria-label={d}
                            onClick={() => set("day", d)}
                          >
                            {d.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="group">
                      <p className="label">
                        Horario <small>franjas de una hora</small>
                      </p>
                      <div className="times" role="group" aria-label="Horario">
                        {TIME_SLOTS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="chip"
                            aria-pressed={form.timeSlot === t}
                            onClick={() => set("timeSlot", t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="group">
                    <div className="field">
                      <label className="label" htmlFor="bf-name">
                        Tu nombre
                      </label>
                      <input
                        id="bf-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        maxLength={100}
                        autoComplete="name"
                        placeholder="Ej. María López"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="bf-desc">
                        Describe el problema
                      </label>
                      <textarea
                        id="bf-desc"
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        rows={5}
                        maxLength={600}
                        placeholder="Ej. Los pinos no se acomodaron después del segundo tiro..."
                      />
                      <p className="count">{form.description.length}/600</p>
                      <div className="quick" aria-label="Ideas rápidas">
                        {QUICK_IDEAS.map((idea) => (
                          <button key={idea} type="button" onClick={() => addIdea(idea)}>
                            + {idea}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <>
                    <div className="group">
                      <div className="faces" role="group" aria-label="Calificación">
                        {RATINGS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            className="face"
                            data-v={r.value}
                            aria-pressed={form.rating === r.value}
                            onClick={() => set("rating", r.value)}
                          >
                            <Face type={r.value} />
                            <span>{r.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ticket">
                      <h2>Resumen de tu reporte</h2>
                      <dl>
                        <dt>Sucursal</dt>
                        <dd>{sede}</dd>
                        <dt>Pista</dt>
                        <dd>{form.lane}</dd>
                        <dt>Cuándo</dt>
                        <dd>
                          {form.day}, {form.timeSlot}
                        </dd>
                        <dt>Nombre</dt>
                        <dd>{form.name.trim()}</dd>
                      </dl>
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
                <Link href="/" className="change">
                  ← Cambiar sede
                </Link>
              )}
              <div className="actions">
                {step > 0 && (
                  <button type="button" className="btn ghost" onClick={() => go(-1)}>
                    Atrás
                  </button>
                )}
                <button
                  type="button"
                  className="btn primary"
                  disabled={!canContinue || pending}
                  onClick={step === TOTAL_STEPS - 1 ? submit : () => go(1)}
                >
                  {step === TOTAL_STEPS - 1 ? (pending ? "Enviando..." : "Enviar reporte") : "Siguiente"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
