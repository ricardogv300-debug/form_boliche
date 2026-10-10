import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import FeedbackForm from "@/components/public/FeedbackForm";
import { createClient } from "@/lib/supabase/server";

async function FeedbackPage({ params }: { params: PageProps<"/sucursal/[sede]/queja">["params"] }) {
  await connection();
  const { sede: slug } = await params;
  const supabase = await createClient();
  const { data: sucursal } = await supabase.from("sucursales").select("id, nombre").eq("slug", slug).eq("activa", true).maybeSingle();
  if (!sucursal) notFound();

  return <FeedbackForm sucursal={sucursal} backHref={`/sucursal/${slug}`} />;
}

export default function Page({ params }: PageProps<"/sucursal/[sede]/queja">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <FeedbackPage params={params} />
      </Suspense>
    </main>
  );
}
