import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ReviewMesero from "@/components/public/ReviewMesero";
import { fotoUrl } from "@/lib/fotos";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Dirección del código QR que porta cada mesero: la reseña ya sabe de quién es.
async function WaiterReview({ params }: { params: PageProps<"/mesero/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: m } = await supabase
    .from("meseros")
    .select("id, nombre, puesto, foto_path, sucursal_id, sucursales(nombre, slug)")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();
  if (!m || !m.sucursales) notFound();

  return (
    <ReviewMesero
      fixed
      sucursal={{ id: m.sucursal_id, nombre: m.sucursales.nombre }}
      backHref={`/sucursal/${m.sucursales.slug}`}
      meseros={[{ id: m.id, nombre: m.nombre, puesto: m.puesto, foto_url: fotoUrl(m.foto_path) }]}
    />
  );
}

export default function Page({ params }: PageProps<"/mesero/[id]">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <WaiterReview params={params} />
      </Suspense>
    </main>
  );
}
