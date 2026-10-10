import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ReviewMesero from "@/components/public/ReviewMesero";
import { fotoUrl } from "@/lib/fotos";
import { createClient } from "@/lib/supabase/server";

async function ReviewPage({ params }: { params: PageProps<"/sucursal/[sede]/mesero">["params"] }) {
  await connection();
  const { sede: slug } = await params;
  const supabase = await createClient();
  const { data: sucursal } = await supabase.from("sucursales").select("id, nombre").eq("slug", slug).eq("activa", true).maybeSingle();
  if (!sucursal) notFound();

  // El público solo puede leer estas columnas (el teléfono y la fecha de ingreso no se exponen).
  const { data: meseros } = await supabase
    .from("meseros")
    .select("id, nombre, puesto, foto_path")
    .eq("sucursal_id", sucursal.id)
    .eq("activo", true)
    .order("nombre", { ascending: true });

  return (
    <ReviewMesero
      sucursal={sucursal}
      backHref={`/sucursal/${slug}`}
      meseros={(meseros ?? []).map((m) => ({ id: m.id, nombre: m.nombre, puesto: m.puesto, foto_url: fotoUrl(m.foto_path) }))}
    />
  );
}

export default function Page({ params }: PageProps<"/sucursal/[sede]/mesero">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <ReviewPage params={params} />
      </Suspense>
    </main>
  );
}
