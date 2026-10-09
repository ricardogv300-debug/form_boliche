import { Suspense } from "react";
import { connection } from "next/server";
import { NewSucursalForm, SucursalRow } from "@/components/SucursalAdmin";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function Sucursales() {
  await connection();
  const { supabase } = await requireAdmin();
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre, slug, num_pistas, activa")
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">Sucursales</h1>
        <p className="mt-1 text-neutral-700">
          El número de pistas de cada sucursal es el que verá la gente en el formulario.
        </p>
      </div>

      <NewSucursalForm />

      <ul className="space-y-3">
        {sucursales?.map((s) => <SucursalRow key={s.id} sucursal={s} />)}
        {sucursales?.length === 0 && <li className="font-medium text-neutral-700">Aún no hay sucursales.</li>}
      </ul>
    </section>
  );
}

export default function AdminSucursalesPage() {
  return (
    <Suspense fallback={<p className="font-semibold text-neutral-700">Cargando...</p>}>
      <Sucursales />
    </Suspense>
  );
}
