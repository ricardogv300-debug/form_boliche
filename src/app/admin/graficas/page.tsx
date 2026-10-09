import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { BarList, ChartCard, ColumnChart, RatingBar, StatTile, type Datum } from "@/components/Charts";
import { TIME_SLOTS, type Rating } from "@/lib/form-options";
import { requireAdmin } from "@/lib/supabase/require-admin";

type Stats = {
  total: number;
  por_calificacion: Partial<Record<Rating, number>>;
  por_sucursal: { nombre: string; total: number }[];
  por_dia: { dia: string; total: number }[];
  por_horario: { horario: string; total: number }[];
  por_pista: { pista: number; total: number }[];
  por_fecha: { fecha: string; total: number }[];
};

const RANGES = [7, 30, 90] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function Charts({ searchParams }: { searchParams: PageProps<"/admin/graficas">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const dias = RANGES.find((r) => String(r) === sp.dias) ?? 30;
  const sucursal = typeof sp.sucursal === "string" && UUID.test(sp.sucursal) ? sp.sucursal : undefined;

  const { supabase } = await requireAdmin();
  const [{ data: sucursales }, { data, error }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("created_at", { ascending: true }),
    supabase.rpc("estadisticas_reportes", { p_sucursal: sucursal, p_dias: dias }),
  ]);
  const stats = data as Stats | null;

  const href = (d: number, s?: string) => `/admin/graficas?dias=${d}${s ? `&sucursal=${s}` : ""}`;
  const chip = (active: boolean) =>
    `rounded-full border-2 border-brand-ink px-3 py-1.5 text-sm font-bold ${
      active ? "bg-brand-ink text-brand-cream" : "bg-white text-brand-ink hover:bg-brand-yellow"
    }`;

  const filters = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Link key={r} href={href(r, sucursal)} className={chip(r === dias)}>
            Últimos {r} días
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={href(dias)} className={chip(!sucursal)}>
          Todas las sucursales
        </Link>
        {sucursales?.map((s) => (
          <Link key={s.id} href={href(dias, s.id)} className={chip(sucursal === s.id)}>
            {s.nombre}
          </Link>
        ))}
      </div>
    </div>
  );

  const header = (
    <div>
      <h1 className="text-3xl font-black tracking-tight text-brand-ink">Gráficas</h1>
      <p className="mt-1 text-neutral-700">Resumen de los reportes de los últimos {dias} días.</p>
    </div>
  );

  if (error || !stats) {
    return (
      <section className="space-y-5">
        {header}
        {filters}
        <p role="alert" className="rounded-2xl border-2 border-brand-red-dark bg-white px-4 py-3 text-sm font-semibold text-brand-red-dark">
          No se pudieron cargar las gráficas{error ? `: ${error.message}` : "."}
        </p>
      </section>
    );
  }

  const calif = {
    angry: stats.por_calificacion.angry ?? 0,
    neutral: stats.por_calificacion.neutral ?? 0,
    happy: stats.por_calificacion.happy ?? 0,
  };
  const resolved = stats.total ? Math.round((calif.happy / stats.total) * 100) : 0;

  const porDia: Datum[] = stats.por_dia.map((d) => ({ label: d.dia, short: d.dia.slice(0, 3), value: d.total }));
  const porSucursal: Datum[] = stats.por_sucursal.map((s) => ({ label: s.nombre, value: s.total }));
  const horarios = new Map(stats.por_horario.map((h) => [h.horario, h.total]));
  const porHorario: Datum[] = TIME_SLOTS.map((t) => ({ label: t, value: horarios.get(t) ?? 0 }));
  const porPista: Datum[] = stats.por_pista.map((p) => ({ label: `Pista ${p.pista}`, short: String(p.pista), value: p.total }));
  const porFecha: Datum[] = stats.por_fecha.map((f) => ({ label: dayMonth.format(parseDate(f.fecha)), value: f.total }));

  const topPista = porPista.reduce<Datum | null>((best, p) => (p.value > (best?.value ?? 0) ? p : best), null);
  const califRows: Datum[] = [
    { label: "No se solucionó", value: calif.angry },
    { label: "Más o menos", value: calif.neutral },
    { label: "Sí, se solucionó", value: calif.happy },
  ];

  return (
    <section className="space-y-5">
      {header}
      {filters}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile hero label="Reportes" value={String(stats.total)} detail={`en los últimos ${dias} días`} />
        <StatTile
          label="Problemas solucionados"
          value={stats.total ? `${resolved}%` : "—"}
          detail={stats.total ? `${calif.happy} de ${stats.total} reportes` : "Sin reportes todavía"}
        />
        <StatTile
          label="Pista con más reportes"
          value={topPista ? topPista.label : "—"}
          detail={topPista ? `${topPista.value} ${topPista.value === 1 ? "reporte" : "reportes"}` : "Sin reportes todavía"}
        />
      </div>

      {stats.total === 0 ? (
        <p className="rounded-2xl border-2 border-brand-ink bg-white px-4 py-10 text-center font-medium text-neutral-700">
          No hay reportes en este periodo. Prueba con un rango más amplio u otra sucursal.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Reportes por día" subtitle="Día de la semana en que ocurrió el problema" rows={porDia}>
            <ColumnChart data={porDia} />
          </ChartCard>
          <ChartCard title="¿Se solucionó el problema?" subtitle="Calificación que dejó cada persona" rows={califRows}>
            <RatingBar counts={calif} />
          </ChartCard>
          <ChartCard title="Reportes por sucursal" rows={porSucursal}>
            <BarList data={porSucursal} />
          </ChartCard>
          <ChartCard title="Reportes por horario" subtitle="Franja en que ocurrió el problema" rows={porHorario}>
            <BarList data={porHorario} labelWidth="w-44" />
          </ChartCard>
          <ChartCard
            className="lg:col-span-2"
            title="Reportes por pista"
            subtitle={sucursal ? "Pistas de la sucursal seleccionada" : "Suma de todas las sucursales"}
            rows={porPista}
          >
            <ColumnChart data={porPista} labelEvery={porPista.length > 16 ? 2 : 1} />
          </ChartCard>
          <ChartCard className="lg:col-span-2" title="Reportes por día del calendario" subtitle="Fecha en que se envió el reporte" rows={porFecha}>
            <ColumnChart data={porFecha} labelEvery={dias === 7 ? 1 : dias === 30 ? 5 : 10} />
          </ChartCard>
        </div>
      )}
    </section>
  );
}

export default function AdminChartsPage({ searchParams }: PageProps<"/admin/graficas">) {
  return (
    <Suspense fallback={<p className="font-semibold text-neutral-700">Cargando...</p>}>
      <Charts searchParams={searchParams} />
    </Suspense>
  );
}
