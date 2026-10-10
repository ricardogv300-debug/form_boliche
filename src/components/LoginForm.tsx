"use client";

import { useActionState, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Image from "next/image";
import { login, type LoginState } from "@/app/login/actions";

// Orden de entrada de cada bloque (la animación escalona con --i).
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  const [show, setShow] = useState(false);
  const message = state?.error ?? notice;
  const card = useRef<HTMLDivElement>(null);

  // Misma preferencia de tema que el panel (sin elección guardada se sigue al sistema).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adm-theme");
      if (saved === "light" || saved === "dark") card.current?.closest(".adm")?.setAttribute("data-theme", saved);
    } catch {}
  }, []);

  // Un intento fallido sacude la tarjeta.
  useEffect(() => {
    if (!state?.error) return;
    const el = card.current;
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }, [state]);

  const ripple = (e: PointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const dot = document.createElement("i");
    dot.className = "ripple";
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 750);
  };

  return (
    <div className="login-card" ref={card}>
      <div className="login-brand st" style={step(0)}>
        <Image src="/logo-ilusion-bowl.png" alt="" width={36} height={40} priority />
        <div>
          Ilusion Bowl
          <small>Panel de administración</small>
        </div>
      </div>
      <h1 className="st" style={step(1)}>
        Iniciar sesión
      </h1>
      <p className="sub st" style={step(2)}>
        Entra para ver los reportes y gestionar las sucursales.
      </p>

      <form action={action} className="login-form">
        <div className={`lfield st${state?.error ? " bad" : ""}`} style={step(3)}>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder=" " className="input" />
          <label htmlFor="email">Correo</label>
        </div>
        <div className={`lfield st${state?.error ? " bad" : ""}`} style={step(4)}>
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder=" "
            className="input"
          />
          <label htmlFor="password">Contraseña</label>
          <button
            type="button"
            className="eye"
            aria-pressed={show}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShow((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="on" aria-hidden>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg viewBox="0 0 24 24" className="off" aria-hidden>
              <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A16.6 16.6 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          </button>
        </div>

        {message && (
          <p role="alert" className="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn accent st" style={step(5)} onPointerDown={ripple}>
          {pending && <span className="spin" aria-hidden />}
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="login-credit st" style={step(6)}>
        <Image src="/logo-niocat.png" alt="" width={22} height={21} />
        <span>
          Servicio brindado por <b>NioCat</b>
        </span>
      </p>
    </div>
  );
}
