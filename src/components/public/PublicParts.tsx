"use client";

import "../bowling-form.css";
import "./public-extra.css";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

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

/** Marco común de los formularios públicos: tarjeta crema con el logo y la sucursal arriba. */
export function PublicCard({ sede, children }: { sede: string; children: ReactNode }) {
  return (
    <div className="bf">
      <Defs />
      <div className="card">
        <div className="topbar">
          <span className="logo">ilusion Bowl</span>
          <span className="sede">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </svg>
            {sede}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** La bola rueda hacia los pinos a medida que avanzan los pasos (0 a 1). */
export function BallTrack({ progress }: { progress: number }) {
  return (
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
  );
}

/** Pantalla final con la chuza. */
export function Strike({ children, again, backHref }: { children: ReactNode; again?: { label: string; onClick: () => void }; backHref: string }) {
  return (
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
      <p className="thanks">{children}</p>
      {again && (
        <button type="button" className="btn ghost" onClick={again.onClick}>
          {again.label}
        </button>
      )}
      <Link href={backHref} className="change">
        Volver al menú de la sucursal
      </Link>
    </div>
  );
}
