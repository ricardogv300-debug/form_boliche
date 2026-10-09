import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import DeleteReportButton from "@/components/DeleteReportButton";
import ExportPdf from "@/components/ExportPdf";
import { Face } from "@/components/Faces";
import { RATINGS, type Rating } from "@/lib/form-options";
import { requireAdmin } from "@/lib/supabase/require-admin";

const TZ = "America/Mexico_City";
const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: TZ });

async function Reports({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection();
  const { sucursal } = await searchParams;
  const filter = typeof sucursal === "string" ? sucursal : undefined;
  const { supabase } = await requireAdmin();

  const [{ data: sucursales }, { data: reportes, error }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("created_at", { ascending: true }),
    (() => {
      const q = supabase
        .from("reportes")
        .select("id, nombre, pista, dia_semana, horario, descripcion, calificacion, created_at, sucursales(nombre)")
        .order("created_at", { ascending: false })
        .limit(500);
      return filter ? q.eq("sucursal_id", filter) : q;
    })(),
  ]);

  const chip = (active: boolean) =>
    `rounded-full border-2 border-brand-ink px-3 py-1.5 text-sm font-bold ${
      active ? "bg-brand-ink text-brand-cream" : "bg-white text-brand-ink hover:bg-brand-yellow"
    }`;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-ink">Reportes</h1>
          <p className="mt-1 text-neutral-700">
            {reportes?.length ?? 0} {reportes?.length === 1 ? "reporte" : "reportes"}
            {filter ? " en esta sucursal" : " en total"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className={chip(!filter)}>
            Todas
          </Link>
          {sucursales?.map((s) => (
            <Link key={s.id} href={`/admin?sucursal=${s.id}`} className={chip(filter === s.id)}>
              {s.nombre}
            </Link>
          ))}
        </div>
      </div>

      <ExportPdf sucursales={sucursales ?? []} sucursalInicial={filter} />

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border-2 border-brand-red-dark bg-white px-4 py-3 text-sm font-semibold text-brand-red-dark">
          No se pudieron cargar los reportes: {error.message}
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl border-2 border-brand-ink bg-white">
        <table className="w-full min-w-[960px] text-left text-sm text-brand-ink">
          <thead className="bg-brand-yellow text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Quién reportó</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Pista</th>
              <th className="px-4 py-3">Día del reporte</th>
              <th className="px-4 py-3">Hora del reporte</th>
              <th className="px-4 py-3">Cuándo ocurrió</th>
              <th className="px-4 py-3">Problema</th>
              <th className="px-4 py-3">¿Se solucionó?</th>
              <th className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {reportes?.length === 0 && (
              <tr>
                <td colSpan={9}className="px-4 py-10 text-center font-medium text-neutral-700">
                  Todavía no hay reportes.
                </td>
              </tr>
            )}
            {reportes?.map((r) => {
              const created = new Date(r.created_at);
              const rating = RATINGS.find((x) => x.value === r.calificacion);
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 font-bold">{r.nombre}</td>
                  <td className="px-4 py-3">{r.sucursales?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-bold">{r.pista}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="capitalize">{dayFmt.format(created)}</span>, {dateFmt.format(created)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{timeFmt.format(created)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.dia_semana}
                    <br />
                    <span className="text-neutral-700">{r.horario}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3">{r.descripcion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Face type={r.calificacion as Rating} size={28} />
                      <span className="font-medium">{rating?.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteReportButton id={r.id} who={r.nombre} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminReportsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="font-semibold text-neutral-700">Cargando...</p>}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}
