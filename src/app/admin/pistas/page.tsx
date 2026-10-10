import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import DeleteReportButton from "@/components/DeleteReportButton";
import ExportPdf from "@/components/ExportPdf";
import { RATINGS, type Rating } from "@/lib/form-options";
import { requireAdmin } from "@/lib/supabase/require-admin";

const TZ = "America/Mexico_City";
const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: TZ });

const TONE: Record<Rating, "bad" | "warn" | "ok"> = { angry: "bad", neutral: "warn", happy: "ok" };
const weekAgo = () => Date.now() - 7 * 24 * 60 * 60 * 1000;

async function Lanes({ searchParams }: { searchParams: PageProps<"/admin/pistas">["searchParams"] }) {
  await connection();
  const { sucursal } = await searchParams;
  const filter = typeof sucursal === "string" ? sucursal : undefined;
  const { supabase } = await requireAdmin();

  const [{ data: sucursales }, { data: reportes, error }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre, num_pistas, activa").order("created_at", { ascending: true }),
    (() => {
      const q = supabase
        .from("reportes")
        .select("id, nombre, pista, dia_semana, horario, descripcion, calificacion, created_at, sucursal_id, sucursales(nombre)")
        .order("created_at", { ascending: false })
        .limit(500);
      return filter ? q.eq("sucursal_id", filter) : q;
    })(),
  ]);

  // Estado de las pistas: según los reportes de los últimos 7 días de la sucursal elegida (o la primera activa).
  const laneSucursal = sucursales?.find((s) => s.id === filter) ?? sucursales?.find((s) => s.activa) ?? sucursales?.[0];
  const since = weekAgo();
  const laneState = new Map<number, "bad" | "warn">();
  for (const r of reportes ?? []) {
    if (r.sucursal_id !== laneSucursal?.id || new Date(r.created_at).getTime() < since) continue;
    if (r.calificacion === "angry") laneState.set(r.pista, "bad");
    else if (r.calificacion === "neutral" && !laneState.has(r.pista)) laneState.set(r.pista, "warn");
  }

  const total = reportes?.length ?? 0;

  return (
    <>
    <div className="adm-page">
      <h1>Pistas</h1>
      <p className="sub">
        {total} {total === 1 ? "reporte" : "reportes"}
        {filter ? " en esta sucursal" : " en total"}. Reportes de fallas y estado de cada pista.
      </p>

      {error && (
        <p role="alert" className="banner">
          No se pudieron cargar los reportes: {error.message}
        </p>
      )}

      <div className="grid g-2">
        <div className="card">
          <h2>Estado ahora</h2>
          <p className="hint">
            {laneSucursal ? `${laneSucursal.nombre}, ${laneSucursal.num_pistas} pistas · últimos 7 días` : "Aún no hay sucursales"}
          </p>
          <div className="lanes">
            {laneSucursal &&
              Array.from({ length: laneSucursal.num_pistas }, (_, i) => i + 1).map((n) => {
                const s = laneState.get(n);
                return (
                  <div key={n} className={`lane ${s ?? ""}`}>
                    <span>Pista</span>
                    <b>{n}</b>
                    <span>{s === "bad" ? "Sin resolver" : s === "warn" ? "A medias" : "Sin reportes"}</span>
                  </div>
                );
              })}
          </div>
          <div className="legend" style={{ marginTop: 14 }}>
            <span>
              <i style={{ background: "var(--tile)", border: "1px solid var(--line)" }} />
              Sin reportes
            </span>
            <span>
              <i style={{ background: "var(--warn)" }} />A medias
            </span>
            <span>
              <i style={{ background: "var(--bad)" }} />
              Sin resolver
            </span>
          </div>
        </div>

        <div className="card">
          <div className="row between wrap">
            <h2>Reportes de pistas</h2>
            <div className="chips">
              <Link href="/admin/pistas" className="chip" aria-current={!filter}>
                Todas
              </Link>
              {sucursales?.map((s) => (
                <Link key={s.id} href={`/admin/pistas?sucursal=${s.id}`} className="chip" aria-current={filter === s.id}>
                  {s.nombre}
                </Link>
              ))}
            </div>
          </div>

          <div className="tw">
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Quién reportó</th>
                  <th>Sucursal</th>
                  <th>Pista</th>
                  <th>Día y hora del reporte</th>
                  <th>Cuándo ocurrió</th>
                  <th>Problema</th>
                  <th>¿Se solucionó?</th>
                  <th>
                    <span style={{ position: "absolute", left: -9999 }}>Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportes?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
                      Todavía no hay reportes.
                    </td>
                  </tr>
                )}
                {reportes?.map((r) => {
                  const created = new Date(r.created_at);
                  const rating = RATINGS.find((x) => x.value === r.calificacion);
                  return (
                    <tr key={r.id} style={{ verticalAlign: "top" }}>
                      <td>
                        <b>{r.nombre}</b>
                      </td>
                      <td>{r.sucursales?.nombre ?? "—"}</td>
                      <td className="mono">
                        <b>{r.pista}</b>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ textTransform: "capitalize" }}>{dayFmt.format(created)}</span>, {dateFmt.format(created)}
                        <br />
                        <span className="lbl">{timeFmt.format(created)}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {r.dia_semana}
                        <br />
                        <span className="lbl">{r.horario}</span>
                      </td>
                      <td style={{ minWidth: 200, maxWidth: 320 }}>{r.descripcion}</td>
                      <td>
                        <span className={`tag ${TONE[r.calificacion as Rating]}`}>
                          <span>{rating?.label}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <DeleteReportButton id={r.id} who={r.nombre} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div className="adm-page" style={{ flex: "none" }}>
      <ExportPdf sucursales={sucursales ?? []} sucursalInicial={filter} />
    </div>
    </>
  );
}

export default function AdminLanesPage({ searchParams }: PageProps<"/admin/pistas">) {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Lanes searchParams={searchParams} />
    </Suspense>
  );
}
