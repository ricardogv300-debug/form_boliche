import { Suspense } from "react";
import { connection } from "next/server";
import QrStudio from "@/components/QrStudio";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function Qr() {
  await connection();
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("sucursales")
    .select("slug, nombre")
    .order("created_at", { ascending: true });

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">Código QR</h1>
        <p className="mt-1 text-neutral-700">
          Cartel listo para imprimir. Al escanearlo, el cliente abre el formulario de queja desde su celular.
        </p>
      </div>
      <QrStudio sucursales={data ?? []} />
    </section>
  );
}

export default function AdminQrPage() {
  return (
    <Suspense fallback={<p className="font-semibold text-neutral-700">Cargando...</p>}>
      <Qr />
    </Suspense>
  );
}
