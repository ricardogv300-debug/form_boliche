import { Suspense } from "react";
import { connection } from "next/server";
import Landing from "@/components/Landing";
import { createClient } from "@/lib/supabase/server";

async function LandingWithSedes() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucursales")
    .select("slug, nombre")
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
