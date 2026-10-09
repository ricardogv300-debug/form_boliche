"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { login, type LoginState } from "@/app/login/actions";

const inputClass =
  "w-full rounded-2xl border-2 border-brand-ink bg-white px-5 py-3.5 text-[16px] font-medium text-brand-ink outline-none transition-colors placeholder:font-normal placeholder:text-neutral-500 focus:border-brand-red focus:ring-4 focus:ring-brand-red/20";

export default function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  const message = state?.error ?? notice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[440px] rounded-[40px] border-2 border-brand-ink bg-brand-cream p-6 shadow-[8px_8px_0_0_#1a0d0d] sm:p-8"
    >
      <h1 className="text-3xl font-black tracking-tight text-brand-ink">Panel de administración</h1>
      <p className="mt-2 text-[17px] text-neutral-700">Inicia sesión para ver los reportes y gestionar las sucursales.</p>

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-brand-ink">
            Correo
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-brand-ink">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        {message && (
          <p role="alert" className="rounded-2xl border-2 border-brand-red-dark bg-white px-4 py-3 text-sm font-semibold text-brand-red-dark">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl border-2 border-brand-ink bg-brand-red px-8 py-4 font-bold text-brand-cream transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </motion.div>
  );
}
