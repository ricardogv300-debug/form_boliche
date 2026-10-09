"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Landing({ sedes }: { sedes: { slug: string; nombre: string }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[600px] rounded-[40px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[8px_8px_0_0_#1a0d0d] sm:p-9"
    >
      <div className="mx-auto mb-6 w-fit -rotate-2 rounded-[28px] border-[3px] border-brand-ink bg-brand-red px-6 py-3 text-center text-brand-cream shadow-[4px_4px_0_0_#1a0d0d]">
        <p className="text-3xl font-black italic leading-none tracking-tight">ilusion Bowl</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-yellow">
          Hacemos tu juego ¡perfecto!
        </p>
      </div>

      <h1 className="text-center text-3xl font-black tracking-tight text-brand-ink sm:text-4xl">
        ¿Algo falló en tu pista?
      </h1>
      <p className="mt-4 text-center text-[17px] leading-relaxed text-neutral-800">
        Este formulario sirve para reportar cualquier problema que hayas tenido con una pista de
        boliche. Dinos qué pista fue, cuándo ocurrió y qué pasó, y el equipo lo revisará para
        mejorar tu próxima partida. Solo toma un minuto.
      </p>

      <ol className="mt-6 grid grid-cols-3 gap-2 text-center text-sm font-semibold text-brand-ink">
        {["Elige tu sede", "Cuéntanos qué pasó", "Califica la solución"].map((t, i) => (
          <li key={t} className="rounded-2xl border-2 border-brand-ink bg-brand-yellow px-2 py-3 leading-tight">
            <span className="mb-1 block text-lg font-black">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      <p className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-brand-ink">
        ¿En qué sucursal fue?
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {sedes.length === 0 && (
          <p className="text-sm font-semibold text-neutral-800 sm:col-span-2">
            Aún no hay sucursales disponibles. Vuelve pronto.
          </p>
        )}
        {sedes.map((s, i) => (
          <motion.div
            key={s.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/formulario/${s.slug}`}
              className="flex items-center justify-between rounded-2xl border-2 border-brand-ink bg-white px-5 py-4 text-lg font-bold text-brand-ink transition-colors hover:bg-brand-red hover:text-brand-cream"
            >
              {s.nombre}
              <span aria-hidden className="text-xl">→</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
