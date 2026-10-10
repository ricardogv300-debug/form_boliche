import { Suspense } from "react";
import { connection } from "next/server";
import { SampleNote } from "@/components/admin/Parts";
import { FoodPanel } from "@/components/admin/SampleViews";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function Food() {
  await connection();
  await requireAdmin();
  return (
    <div className="adm-page">
      <h1>Alimentos y bebidas</h1>
      <p className="sub">Qué platillos gustan y cuáles hay que revisar.</p>
      <FoodPanel />
      <SampleNote />
    </div>
  );
}

export default function AdminFoodPage() {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Food />
    </Suspense>
  );
}
