import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import BowlingForm from "@/components/BowlingForm";
import { createClient } from "@/lib/supabase/server";

async function SedeForm({ params }: { params: PageProps<"/formulario/[sede]">["params"] }) {
  await connection();
  const { sede: slug } = await params;
  const supabase = await createClient();
  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("id, nombre, num_pistas")
    .eq("slug", slug)
    .maybeSingle();
  if (!sucursal) notFound();

  return (
    <BowlingForm
      sucursal={{ id: sucursal.id, nombre: sucursal.nombre, numPistas: sucursal.num_pistas }}
    />
  );
}

export default function FormPage({ params }: PageProps<"/formulario/[sede]">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <SedeForm params={params} />
      </Suspense>
    </main>
  );
}
