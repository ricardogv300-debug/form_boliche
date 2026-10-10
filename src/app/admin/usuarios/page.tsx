import { Suspense } from "react";
import { connection } from "next/server";
import { NewUsuarioForm, UsuarioRow } from "@/components/UsuariosAdmin";
import { requireSuper } from "@/lib/supabase/require-admin";

async function Usuarios() {
  await connection();
  const { supabase, user } = await requireSuper();
  const [{ data: admins }, { data: sucursales }] = await Promise.all([
    supabase
      .from("admins")
      .select("user_id, rol, nombre, email, created_at, admin_sucursales(sucursal_id)")
      .order("created_at", { ascending: true }),
    supabase.from("sucursales").select("id, nombre, activa").order("created_at", { ascending: true }),
  ]);

  const options = (sucursales ?? []).map((s) => ({ id: s.id, nombre: s.activa ? s.nombre : `${s.nombre} (inactiva)` }));

  return (
    <div className="adm-page">
      <div>
        <h1>Usuarios</h1>
        <p className="sub">
          Crea administradores y elige a qué sucursales tienen acceso. Solo verán los reportes, reseñas, meseros y quejas de esas sucursales.
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <NewUsuarioForm sucursales={options} />
      </div>

      <ul className="stack" style={{ padding: 0, margin: "14px 0 0" }}>
        {admins?.map((a) => (
          <UsuarioRow
            key={a.user_id}
            usuario={{
              id: a.user_id,
              rol: a.rol === "super" ? "super" : "sucursal",
              nombre: a.nombre,
              email: a.email,
              yo: a.user_id === user.id,
              acceso: a.admin_sucursales.map((x) => x.sucursal_id),
            }}
            sucursales={options}
          />
        ))}
      </ul>
    </div>
  );
}

export default function AdminUsuariosPage() {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Usuarios />
    </Suspense>
  );
}
