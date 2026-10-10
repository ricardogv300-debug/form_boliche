"use client";

import { useActionState } from "react";
import {
  createSucursal,
  deleteSucursal,
  updateSucursal,
  type SucursalState,
} from "@/app/admin/sucursales/actions";

function Message({ state }: { state: SucursalState }) {
  if (state?.error)
    return (
      <p role="alert" className="msg bad">
        {state.error}
      </p>
    );
  if (state?.ok) return <p className="msg ok">Guardado ✓</p>;
  return null;
}

export function NewSucursalForm() {
  const [state, action, pending] = useActionState<SucursalState, FormData>(createSucursal, null);

  return (
    <form action={action} key={state?.ok ? "ok" : "form"} className="card">
      <h2>Registrar nueva sucursal</h2>
      <div className="form-row" style={{ marginTop: 14 }}>
        <label className="field grow">
          Nombre
          <input name="nombre" required maxLength={80} placeholder="Ej. Plaza Norte" className="input" />
        </label>
        <label className="field" style={{ width: 150 }}>
          Número de pistas
          <input name="num_pistas" type="number" required min={1} max={100} defaultValue={24} className="input" />
        </label>
        <button type="submit" disabled={pending} className="btn accent">
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
  sucursal: { id: string; nombre: string; slug: string; num_pistas: number; activa: boolean; reportes: number };
}) {
  const [state, action, pending] = useActionState<SucursalState, FormData>(updateSucursal, null);
  const [delState, delAction, deleting] = useActionState<SucursalState, FormData>(deleteSucursal, null);

  return (
    <li className="card" style={{ listStyle: "none" }}>
      <form action={action} className="form-row">
        <input type="hidden" name="id" value={sucursal.id} />
        <label className="field grow">
          Nombre
          <input name="nombre" required maxLength={80} defaultValue={sucursal.nombre} className="input" />
        </label>
        <label className="field" style={{ width: 120 }}>
          Pistas
          <input name="num_pistas" type="number" required min={1} max={100} defaultValue={sucursal.num_pistas} className="input" />
        </label>
        <label className="check">
          <input name="activa" type="checkbox" defaultChecked={sucursal.activa} />
          Activa
        </label>
        <button type="submit" disabled={pending} className="btn dark">
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </form>
      <Message state={state} />

      <div className="divider">
        <p>
          Enlace: <code>/formulario/{sucursal.slug}</code>
          {" · "}
          {sucursal.reportes} {sucursal.reportes === 1 ? "reporte" : "reportes"}
          {!sucursal.activa && " · oculta para el público"}
        </p>
        <form
          action={delAction}
          onSubmit={(e) => {
            const reportes =
              sucursal.reportes === 0
                ? "No tiene reportes."
                : `Se borrarán también sus ${sucursal.reportes} ${sucursal.reportes === 1 ? "reporte" : "reportes"}.`;
            if (!confirm(`¿Borrar la sucursal "${sucursal.nombre}"? ${reportes} Esta acción no se puede deshacer.`))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={sucursal.id} />
          <button type="submit" disabled={deleting} className="linkbtn">
            Borrar
          </button>
        </form>
      </div>
      <Message state={delState} />
    </li>
  );
}
