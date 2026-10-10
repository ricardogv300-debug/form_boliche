"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitQueja } from "@/app/sucursal/actions";
import { PublicCard, Strike } from "./PublicParts";

type Tipo = "queja" | "sugerencia";

const TIPOS: { value: Tipo; title: string; hint: string; placeholder: string }[] = [
  { value: "queja", title: "Queja", hint: "Algo salió mal", placeholder: "Cuéntanos qué pasó, dónde y más o menos a qué hora..." },
  { value: "sugerencia", title: "Sugerencia", hint: "Una idea para mejorar", placeholder: "¿Qué te gustaría que hiciéramos o cambiáramos?" },
];

export default function FeedbackForm({ sucursal, backHref }: { sucursal: { id: string; nombre: string }; backHref: string }) {
  const [tipo, setTipo] = useState<Tipo>("queja");
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [trampa, setTrampa] = useState("");
  const [done, setDone] = useState<Tipo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const actual = TIPOS.find((t) => t.value === tipo)!;

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await submitQueja(sucursal.id, { tipo, mensaje, nombre, contacto, website: trampa });
      if (r.ok) setDone(tipo);
      else setError(r.error);
    });
  };

  const reset = () => {
    setMensaje("");
    setNombre("");
    setContacto("");
    setDone(null);
    setError(null);
  };

  return (
    <PublicCard sede={sucursal.nombre}>
      {done ? (
        <Strike again={{ label: "Enviar otro mensaje", onClick: reset }} backHref={backHref}>
          {done === "queja"
            ? "Recibimos tu queja y la vamos a revisar. Lamentamos lo ocurrido y gracias por avisarnos."
            : "Recibimos tu sugerencia. Gracias por ayudarnos a mejorar."}
        </Strike>
      ) : (
        <div className="panel" style={{ marginTop: 22 }}>
          <h1>Queja o sugerencia</h1>
          <p className="sub">Cuéntanos con confianza. Lo lee el equipo de {sucursal.nombre} y le damos seguimiento.</p>

          <div className="group">
            <p className="label">¿Qué quieres enviar?</p>
            <div className="types" role="group" aria-label="Tipo de mensaje">
              {TIPOS.map((t) => (
                <button key={t.value} type="button" aria-pressed={tipo === t.value} onClick={() => setTipo(t.value)}>
                  <b>{t.title}</b>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="field">
              <label className="label" htmlFor="fb-msg">
                Tu mensaje
              </label>
              <textarea id="fb-msg" value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={5} maxLength={1000} placeholder={actual.placeholder} />
              <p className="count">{mensaje.length}/1000</p>
            </div>
            <div className="field">
              <label className="label" htmlFor="fb-name">
                Tu nombre <small>opcional</small>
              </label>
              <input id="fb-name" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoComplete="name" placeholder="Ej. María López" />
            </div>
            <div className="field">
              <label className="label" htmlFor="fb-contact">
                Teléfono o correo <small>opcional, por si necesitamos buscarte</small>
              </label>
              <input id="fb-contact" type="text" value={contacto} onChange={(e) => setContacto(e.target.value)} maxLength={120} autoComplete="email" placeholder="Para darte una respuesta" />
            </div>
            {/* Campo trampa: queda fuera de la vista y de la navegación con teclado */}
            <div className="gone" aria-hidden="true">
              <label>
                No lo llenes
                <input type="text" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
              </label>
            </div>
          </div>

          {error && (
            <p role="alert" className="err">
              {error}
            </p>
          )}

          <div className="nav">
            <Link href={backHref} className="change">
              ← Volver
            </Link>
            <div className="actions">
              <button type="button" className="btn primary" disabled={pending || mensaje.trim().length < 5} onClick={submit}>
                {pending ? "Enviando..." : `Enviar ${tipo}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicCard>
  );
}
