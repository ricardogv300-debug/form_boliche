import { Suspense } from "react";
import { connection } from "next/server";
import QrTabs from "@/components/QrTabs";
import { fotoUrl } from "@/lib/fotos";
import { requireAdmin } from "@/lib/supabase/require-admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Qr({ searchParams }: { searchParams: PageProps<"/admin/qr">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: sucursales }, { data: meseros }] = await Promise.all([
    supabase.from("sucursales").select("id, slug, nombre").order("created_at", { ascending: true }),
    supabase
      .from("meseros")
      .select("id, nombre, puesto, foto_path, sucursal_id")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
  ]);

  const sucName = new Map((sucursales ?? []).map((s) => [s.id, s.nombre]));
  const preselect = typeof sp.mesero === "string" && UUID.test(sp.mesero) ? sp.mesero : null;

  return (
    <div className="adm-page">
      <div>
        <h1>Código QR</h1>
        <p className="sub">
          Imprime el cartel de cada sucursal o el gafete de cada mesero. Con el QR del mesero, el cliente califica su atención sin tener que elegirlo.
        </p>
      </div>
      <QrTabs
        sucursales={sucursales ?? []}
        initialTab={sp.tab === "meseros" || preselect ? "meseros" : "cartel"}
        preselect={preselect}
        meseros={(meseros ?? []).map((m) => ({
          id: m.id,
          nombre: m.nombre,
          puesto: m.puesto,
          foto_url: fotoUrl(m.foto_path),
          sucursal_id: m.sucursal_id,
          sucursal: sucName.get(m.sucursal_id) ?? "",
        }))}
      />
    </div>
  );
}

export default function AdminQrPage({ searchParams }: PageProps<"/admin/qr">) {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Qr searchParams={searchParams} />
    </Suspense>
  );
}
