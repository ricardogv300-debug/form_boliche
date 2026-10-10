import { Suspense } from "react";
import { connection } from "next/server";
import { NewSucursalForm, SucursalRow } from "@/components/SucursalAdmin";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function Sucursales() {
  await connection();
  const { supabase } = await requireAdmin();
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre, slug, num_pistas, activa, reportes(count)")
    .order("created_at", { ascending: true });

  return (
    <div className="adm-page">
      <div>
        <h1>Sucursales</h1>
        <p className="sub">
          El número de pistas de cada sucursal es el que verá la gente en el formulario.
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <NewSucursalForm />
      </div>

      <ul className="stack" style={{ padding: 0, margin: "14px 0 0" }}>
        {sucursales?.map((s) => (
          <SucursalRow key={s.id} sucursal={{ ...s, reportes: s.reportes[0]?.count ?? 0 }} />
        ))}
        {sucursales?.length === 0 && <li className="empty" style={{ listStyle: "none" }}>Aún no hay sucursales.</li>}
      </ul>
    </div>
  );
}

export default function AdminSucursalesPage() {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Sucursales />
    </Suspense>
  );
}
