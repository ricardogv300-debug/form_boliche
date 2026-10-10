"use client";

import { useActionState, useState } from "react";
import {
  createUsuario,
  deleteUsuario,
  setPasswordUsuario,
  updateAcceso,
  type UsuarioState,
} from "@/app/admin/usuarios/actions";

type Opcion = { id: string; nombre: string };

function Message({ state }: { state: UsuarioState }) {
  if (state?.error)
    return (
      <p role="alert" className="msg bad">
        {state.error}
      </p>
    );
  if (state?.ok) return <p className="msg ok">Guardado ✓</p>;
  return null;
}

// Casillas de sucursal con forma de chip: marcadas = el usuario tiene acceso.
function Picks({ sucursales, selected }: { sucursales: Opcion[]; selected?: string[] }) {
  return (
    <div className="picks">
      {sucursales.map((s) => (
        <label key={s.id} className="pick">
          <input type="checkbox" name="sucursal_id" value={s.id} defaultChecked={selected?.includes(s.id)} />
          <span>{s.nombre}</span>
        </label>
      ))}
      {sucursales.length === 0 && <p className="lbl">Primero registra una sucursal.</p>}
    </div>
  );
}

function generatePassword() {
  const abc = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (n) => abc[n % abc.length]).join("");
}

export function NewUsuarioForm({ sucursales }: { sucursales: Opcion[] }) {
  const [state, action, pending] = useActionState<UsuarioState, FormData>(createUsuario, null);
  const [password, setPassword] = useState("");

  return (
    <form action={action} key={state?.ok ? "ok" : "form"} className="card">
      <h2>Nuevo administrador</h2>
      <div className="form-row" style={{ marginTop: 14 }}>
        <label className="field grow">
          Nombre
          <input name="nombre" maxLength={80} placeholder="Ej. Gerente Zona Real" className="input" />
        </label>
        <label className="field grow">
          Correo
          <input name="email" type="email" required autoComplete="off" placeholder="correo@ilusionbowl.com" className="input" />
        </label>
        <label className="field grow">
          Contraseña
          <input
            name="password"
            type="text"
            required
            minLength={8}
            autoComplete="off"
            placeholder="Mínimo 8 caracteres"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>
          Generar
        </button>
      </div>

      <p className="field" style={{ marginTop: 16 }}>
        Sucursales a las que tendrá acceso
      </p>
      <Picks sucursales={sucursales} />

      <div className="form-row" style={{ marginTop: 16 }}>
        <button type="submit" disabled={pending} className="btn accent">
          {pending ? "Creando..." : "Crear usuario"}
        </button>
        <span className="lbl">Cópiala antes de crear el usuario: después no se puede volver a ver.</span>
      </div>
      <Message state={state} />
    </form>
  );
}

export function UsuarioRow({
  usuario,
  sucursales,
}: {
  usuario: { id: string; rol: "super" | "sucursal"; nombre: string | null; email: string | null; yo: boolean; acceso: string[] };
  sucursales: Opcion[];
}) {
  const [accState, accAction, saving] = useActionState<UsuarioState, FormData>(updateAcceso, null);
  const [pwState, pwAction, changing] = useActionState<UsuarioState, FormData>(setPasswordUsuario, null);
  const [delState, delAction, deleting] = useActionState<UsuarioState, FormData>(deleteUsuario, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titulo = usuario.nombre || usuario.email || "Sin nombre";

  return (
    <li className="card" style={{ listStyle: "none" }}>
      <div className="row between wrap">
        <div>
          <b>
            {titulo}
            {usuario.yo && <span className="lbl"> · tú</span>}
          </b>
          {usuario.nombre && usuario.email && <span className="meta">{usuario.email}</span>}
        </div>
        <span className={`badge ${usuario.rol === "super" ? "super" : ""}`}>
          {usuario.rol === "super" ? "Super administrador" : "Administrador"}
        </span>
      </div>

      {usuario.rol === "super" ? (
        <p className="lbl" style={{ marginTop: 12 }}>
          Ve todas las sucursales y administra a los demás usuarios.
        </p>
      ) : (
        <>
          <form action={accAction} className="divider-form">
            <input type="hidden" name="user_id" value={usuario.id} />
            <p className="field">Acceso a sucursales</p>
            <Picks sucursales={sucursales} selected={usuario.acceso} />
            <div className="form-row" style={{ marginTop: 12 }}>
              <button type="submit" disabled={saving} className="btn dark sm">
                {saving ? "Guardando..." : "Guardar acceso"}
              </button>
            </div>
            <Message state={accState} />
          </form>

          <form action={pwAction} className="form-row divider-form">
            <input type="hidden" name="user_id" value={usuario.id} />
            <label className="field grow">
              Nueva contraseña
              <input name="password" type="text" minLength={8} required autoComplete="off" placeholder="Mínimo 8 caracteres" className="input" />
            </label>
            <button type="submit" disabled={changing} className="btn sm">
              {changing ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
          <Message state={pwState} />

          <div className="divider">
            <p>Si lo borras, ya no podrá entrar al panel.</p>
            {confirmDelete ? (
              <form action={delAction} className="row" style={{ gap: 10 }}>
                <input type="hidden" name="user_id" value={usuario.id} />
                <button type="submit" disabled={deleting} className="linkbtn">
                  {deleting ? "Borrando..." : "Sí, borrar usuario"}
                </button>
                <button type="button" className="linkbtn muted" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </button>
              </form>
            ) : (
              <button type="button" className="linkbtn" onClick={() => setConfirmDelete(true)}>
                Borrar
              </button>
            )}
          </div>
          <Message state={delState} />
        </>
      )}
    </li>
  );
}
