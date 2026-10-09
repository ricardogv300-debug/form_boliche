import { notFound } from "next/navigation";
import BowlingForm from "@/components/BowlingForm";
import { SEDES, getSede } from "@/lib/sedes";

export function generateStaticParams() {
  return SEDES.map((s) => ({ sede: s.slug }));
}

export default async function FormPage({ params }: PageProps<"/formulario/[sede]">) {
  const { sede: slug } = await params;
  const sede = getSede(slug);
  if (!sede) notFound();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <BowlingForm sede={sede.name} />
    </main>
  );
}
