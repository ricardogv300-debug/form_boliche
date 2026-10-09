import { Suspense } from "react";
import { connection } from "next/server";
import Landing from "@/components/Landing";
import { createClient } from "@/lib/supabase/server";

async function LandingWithSedes() {
  await connection();
  const supabase = await createClient();
  // Solo las activas, aunque haya una sesión de administrador abierta (que sí puede leer las ocultas):
  // así el inicio se ve igual para todos.
  const { data } = await supabase
    .from("sucursales")
    .select("slug, nombre")
    .eq("activa", true)
    .order("created_at", { ascending: true });

  return <Landing sedes={data ?? []} />;
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <LandingWithSedes />
      </Suspense>
    </main>
  );
}
