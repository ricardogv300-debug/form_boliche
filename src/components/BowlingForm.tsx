"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  DAYS,
  EMPTY_FORM,
  LANES,
  RATINGS,
  TIME_SLOTS,
  type ComplaintForm,
} from "@/lib/form-options";
import { Face } from "./Faces";

const TOTAL_STEPS = 4;

const STEP_COPY = [
  { title: "¿Qué pista falló?", subtitle: "Selecciona el número de la pista donde tuviste el problema." },
  { title: "¿Cuándo ocurrió?", subtitle: "Dinos el día de la semana y el horario aproximado." },
  { title: "¿Qué problema tuviste?", subtitle: "Cuéntanos con detalle qué pasó con la pista." },
  { title: "¿Se solucionó tu problema?", subtitle: "Elige la carita que mejor describa tu experiencia." },
];

function Pill({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[15px] transition-colors ${
        selected
          ? "border-brand-ink bg-brand-yellow font-semibold text-brand-ink"
          : "border-neutral-500 bg-white text-brand-ink hover:bg-brand-cream"
      } ${className}`}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="#fff4e3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      )}
      {children}
    </motion.button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-bold text-brand-ink">{children}</p>;
}

export default function BowlingForm({ sede }: { sede: string }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<ComplaintForm>({ ...EMPTY_FORM, sede });
  const [done, setDone] = useState(false);

  const set = <K extends keyof ComplaintForm>(key: K, value: ComplaintForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canContinue = [
    form.lane !== null,
    form.day !== null && form.timeSlot !== null,
    form.description.trim().length >= 5,
    form.rating !== null,
  ][step];

  const go = (delta: number) => {
    setDirection(delta);
    setStep((s) => s + delta);
  };

  const submit = () => {
    // TODO: guardar en Supabase
    console.log("Queja enviada:", form);
    setDone(true);
  };

  const reset = () => {
    setForm({ ...EMPTY_FORM, sede });
    setStep(0);
    setDirection(1);
    setDone(false);
  };

  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-[40px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[8px_8px_0_0_#1a0d0d] sm:p-8">
      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-ink bg-brand-yellow"
          >
            <svg width="30" height="30" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="#1a0d0d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight">¡Gracias por avisarnos!</h2>
          <p className="mt-2 max-w-xs text-neutral-800">
            Registramos tu queja sobre la pista {form.lane} de {sede}. La revisaremos lo antes posible.
          </p>
          <button
            onClick={reset}
            className="mt-8 rounded-2xl border-2 border-brand-ink bg-white px-6 py-3 font-bold text-brand-ink transition-colors hover:bg-brand-yellow"
          >
            Enviar otra queja
          </button>
          <Link href="/" className="mt-4 text-sm font-semibold text-brand-red-dark underline underline-offset-4">
            Volver al inicio
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-800">
              Paso {step + 1}/{TOTAL_STEPS}
            </p>
            <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-cream">
              {sede}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-brand-ink bg-white">
            <motion.div
              className="h-full rounded-full bg-brand-red"
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
            />
          </div>

          <div className="relative mt-6 min-h-[420px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-3xl font-black tracking-tight text-brand-ink">{STEP_COPY[step].title}</h1>
                <p className="mt-3 text-[17px] leading-snug text-neutral-700">{STEP_COPY[step].subtitle}</p>

                <div className="mt-7">
                  {step === 0 && (
                    <>
                      <Label>Número de pista:</Label>
                      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                        {LANES.map((n) => (
                          <Pill key={n} selected={form.lane === n} onClick={() => set("lane", n)} className="!px-2">
                            {n}
                          </Pill>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label>Día de la semana:</Label>
                        <div className="flex flex-wrap gap-2.5">
                          {DAYS.map((d) => (
                            <Pill key={d} selected={form.day === d} onClick={() => set("day", d)}>
                              {d}
                            </Pill>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Horario:</Label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {TIME_SLOTS.map((t) => (
                            <Pill
                              key={t}
                              selected={form.timeSlot === t}
                              onClick={() => set("timeSlot", t)}
                              className="!px-3 !text-sm"
                            >
                              {t}
                            </Pill>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <>
                      <Label>Describe el problema:</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        rows={6}
                        maxLength={600}
                        placeholder="Ej. Los pinos no se acomodaron después del segundo tiro..."
                        className="w-full resize-none rounded-3xl border-2 border-brand-ink bg-white px-5 py-4 text-[16px] font-medium text-brand-ink outline-none transition-colors placeholder:font-normal placeholder:text-neutral-500 focus:border-brand-red focus:ring-4 focus:ring-brand-red/20"
                      />
                      <p className="mt-2 text-right text-xs font-medium text-neutral-700">{form.description.length}/600</p>
                    </>
                  )}

                  {step === 3 && (
                    <div className="grid grid-cols-3 gap-3">
                      {RATINGS.map((r) => {
                        const selected = form.rating === r.value;
                        return (
                          <motion.button
                            key={r.value}
                            type="button"
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => set("rating", r.value)}
                            aria-pressed={selected}
                            className={`flex flex-col items-center gap-3 rounded-3xl border px-2 py-5 transition-colors ${
                              selected ? "border-brand-ink bg-brand-yellow" : "border-neutral-500 bg-white hover:bg-brand-cream"
                            }`}
                          >
                            <motion.div animate={{ scale: selected ? 1.15 : 1, opacity: form.rating && !selected ? 0.45 : 1 }}>
                              <Face type={r.value} />
                            </motion.div>
                            <span className="text-center text-sm font-bold leading-tight text-brand-ink">{r.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2.5">
            {step === 0 ? (
              <Link href="/" className="text-sm font-bold text-brand-red-dark underline underline-offset-4">
                ← Cambiar sede
              </Link>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
            {step > 0 && (
              <button
                onClick={() => go(-1)}
                className="rounded-2xl border-2 border-brand-ink bg-white px-8 py-4 font-bold text-brand-ink transition-colors hover:bg-brand-yellow"
              >
                Atrás
              </button>
            )}
            <button
              onClick={step === TOTAL_STEPS - 1 ? submit : () => go(1)}
              disabled={!canContinue}
              className="rounded-2xl border-2 border-brand-ink bg-brand-red px-8 py-4 font-bold text-brand-cream transition-all hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:border-neutral-400 disabled:bg-neutral-300 disabled:text-neutral-600"
            >
              {step === TOTAL_STEPS - 1 ? "Enviar" : "Siguiente"}
            </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
