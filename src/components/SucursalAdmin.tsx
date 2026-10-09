"use client";

import { useActionState } from "react";
import {
  createSucursal,
  deleteSucursal,
  updateSucursal,
  type SucursalState,
} from "@/app/admin/sucursales/actions";

const inputClass =
  "rounded-xl border-2 border-brand-ink bg-white px-3 py-2 text-[15px] font-medium text-brand-ink outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/20";

function Message({ state }: { state: SucursalState }) {
  if (state?.error)
    return (
      <p role="alert" className="mt-2 text-sm font-semibold text-brand-red-dark">
        {state.error}
      </p>
    );
  if (state?.ok) return <p className="mt-2 text-sm font-semibold text-green-800">Guardado ✓</p>;
  return null;
}

export function NewSucursalForm() {
  const [state, action, pending] = useActionState<SucursalState, FormData>(createSucursal, null);

  return (
    <form action={action} key={state?.ok ? "ok" : "form"} className="rounded-2xl border-2 border-brand-ink bg-white p-4">
      <h2 className="text-lg font-black text-brand-ink">Registrar nueva sucursal</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-48 text-sm font-bold text-brand-ink">
          Nombre
          <input name="nombre" required maxLength={80} placeholder="Ej. Plaza Norte" className={`${inputClass} mt-1 w-full`} />
        </label>
        <label className="w-36 text-sm font-bold text-brand-ink">
          Número de pistas
          <input
            name="num_pistas"
            type="number"
            required
            min={1}
            max={100}
            defaultValue={24}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border-2 border-brand-ink bg-brand-red px-5 py-2.5 font-bold text-brand-cream hover:bg-brand-red-dark disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          {pending ? "Guardando..." : "Agregar"}
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function SucursalRow({
  sucursal,
}: {
  sucursal: { id: string; nombre: string; slug: string; num_pistas: number; activa: boolean };
}) {
  const [state, action, pending] = useActionState<SucursalState, FormData>(updateSucursal, null);
  const [delState, delAction, deleting] = useActionState<SucursalState, FormData>(deleteSucursal, null);

  return (
    <li className="rounded-2xl border-2 border-brand-ink bg-white p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={sucursal.id} />
        <label className="flex-1 min-w-48 text-sm font-bold text-brand-ink">
          Nombre
          <input name="nombre" required maxLength={80} defaultValue={sucursal.nombre} className={`${inputClass} mt-1 w-full`} />
        </label>
        <label className="w-28 text-sm font-bold text-brand-ink">
          Pistas
          <input
            name="num_pistas"
            type="number"
            required
            min={1}
            max={100}
            defaultValue={sucursal.num_pistas}
            className={`${inputClass} mt-1 w-full`}
          />
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-bold text-brand-ink">
          <input name="activa" type="checkbox" defaultChecked={sucursal.activa} className="h-5 w-5 accent-brand-red" />
          Activa
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border-2 border-brand-ink bg-brand-yellow px-5 py-2.5 font-bold text-brand-ink hover:bg-brand-yellow-dark disabled:bg-neutral-300"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </form>
      <Message state={state} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-300 pt-3">
        <p className="text-xs font-medium text-neutral-700">
          Enlace: <code>/formulario/{sucursal.slug}</code>
          {!sucursal.activa && " · oculta para el público"}
        </p>
        <form
          action={delAction}
          onSubmit={(e) => {
            if (!confirm(`¿Borrar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={sucursal.id} />
          <button
            type="submit"
            disabled={deleting}
            className="text-sm font-bold text-brand-red-dark underline underline-offset-4 disabled:opacity-50"
          >
            Borrar
          </button>
        </form>
      </div>
      <Message state={delState} />
    </li>
  );
}
