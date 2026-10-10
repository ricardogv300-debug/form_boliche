import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { PublicCard } from "@/components/public/PublicParts";
import { createClient } from "@/lib/supabase/server";

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

async function Hub({ params }: { params: PageProps<"/sucursal/[sede]">["params"] }) {
  await connection();
  const { sede: slug } = await params;
  const supabase = await createClient();
  const { data: sucursal } = await supabase.from("sucursales").select("nombre").eq("slug", slug).eq("activa", true).maybeSingle();
  if (!sucursal) notFound();

  const options = [
    {
      href: `/sucursal/${slug}/resena`,
      title: "Reseñar tu visita",
      text: "Cuéntanos cómo te fue en general. Al final puedes dejarnos una queja o sugerencia si quieres.",
      featured: true,
      icon: svg(<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z" />),
    },
    {
      href: `/formulario/${slug}`,
      title: "Reportar una pista",
      text: "Algo falló en tu carril: pinos, bola, marcador...",
      icon: svg(
        <>
          <path d="M10 2h4l.8 5-1.1 2.6c2.3 1.4 3.8 3.8 3.8 6.4a5.5 5.5 0 0 1-11 0c0-2.6 1.5-5 3.8-6.4L9.2 7z" />
          <path d="M9 7h6" />
        </>,
      ),
    },
    {
      href: `/sucursal/${slug}/mesero`,
      title: "Opinar de un mesero",
      text: "Cuéntanos cómo fue la atención que recibiste.",
      icon: svg(<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z" />),
    },
  ];

  return (
    <PublicCard sede={sucursal.nombre}>
      <div className="panel" style={{ marginTop: 22 }}>
        <h1>¿Qué quieres contarnos?</h1>
        <p className="sub">Elige una opción. Solo toma un minuto y el equipo lo lee de verdad.</p>
        <nav className="hub" aria-label="Formularios">
          {options.map((o) => (
            <Link key={o.href} href={o.href} className={o.featured ? "featured" : undefined}>
              <span className="ico">{o.icon}</span>
              <span>
                <b>{o.title}{o.featured && <em className="tag-rec">Recomendado</em>}</b>
                <span className="t">{o.text}</span>
              </span>
              <span className="go" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>
        <div className="nav">
          <Link href="/" className="change">
            ← Cambiar sede
          </Link>
        </div>
      </div>
    </PublicCard>
  );
}

export default function HubPage({ params }: PageProps<"/sucursal/[sede]">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <Hub params={params} />
      </Suspense>
    </main>
  );
}
