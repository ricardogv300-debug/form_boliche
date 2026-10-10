import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import CountUp from "@/components/admin/CountUp";
import Icon, { type IconName } from "@/components/admin/Icon";
import { ActivityChart } from "@/components/admin/Parts";
import { ActivityTable } from "@/components/admin/SampleViews";
import type { ActivityRow, ActivityState } from "@/lib/admin-sample";
import { RATINGS } from "@/lib/form-options";
import { requireAdmin } from "@/lib/supabase/require-admin";

const TZ = "America/Mexico_City";
const DAY = 24 * 60 * 60 * 1000;
const ratingLabel = (v: string) => RATINGS.find((r) => r.value === v)?.label ?? v;
const STATE_OF: Record<string, ActivityState> = { angry: "new", neutral: "wip", happy: "ok" };
const QUEJA_STATE: Record<string, ActivityState> = { nueva: "new", en_revision: "wip", atendida: "ok" };
const stampFmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const ymFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: TZ });
const monthFmt = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const toneOf = (stars: number): "ok" | "warn" | "bad" => (stars >= 4 ? "ok" : stars === 3 ? "warn" : "bad");
const short = (id: string) => String(id).slice(0, 6).toUpperCase();

// Todo lo que viene de la base de datos se calcula aquí, fuera del componente.
async function loadSummary() {
  const { supabase } = await requireAdmin();
  const [{ data: sucursales }, { data: reportes }, { data: resenas }, { data: resMeseros }, { data: quejas }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre, activa").order("created_at", { ascending: true }),
    supabase
      .from("reportes")
      .select("id, pista, descripcion, calificacion, created_at, sucursal_id, sucursales(nombre)")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("resenas_lugar")
      .select("id, sucursal_id, calificacion, limpieza, atencion, comida, precio, comentario, created_at, sucursales(nombre)")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("resenas_meseros")
      .select("id, calificacion, comentario, created_at, meseros(nombre, sucursales(nombre))")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("quejas_sugerencias")
      .select("id, tipo, mensaje, estado, prioridad, created_at, sucursales(nombre)")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const now = Date.now();
  const age = (iso: string) => now - new Date(iso).getTime();
  const rep = reportes ?? [];
  const res = resenas ?? [];
  const rm = resMeseros ?? [];
  const qs = quejas ?? [];

  const rep30 = rep.filter((r) => age(r.created_at) <= 30 * DAY);
  const abiertos = rep30.filter((r) => r.calificacion !== "happy").length;
  const nuevos = rep.filter((r) => age(r.created_at) <= 7 * DAY && r.calificacion !== "happy").length;
  const resueltos = rep30.filter((r) => r.calificacion === "happy").length;

  const res30 = res.filter((r) => age(r.created_at) <= 30 * DAY);
  const resPrev = res.filter((r) => age(r.created_at) > 30 * DAY && age(r.created_at) <= 60 * DAY);
  const avg30 = mean(res30.map((r) => r.calificacion));
  const avgPrev = mean(resPrev.map((r) => r.calificacion));

  const num = (xs: (number | null)[]) => xs.filter((v): v is number => typeof v === "number");
  const areas = {
    limpieza: mean(num(res30.map((r) => r.limpieza))),
    atencion: mean(num(res30.map((r) => r.atencion))),
    comida: mean(num(res30.map((r) => r.comida))),
    precio: mean(num(res30.map((r) => r.precio))),
  };

  const abiertas = (tipo: string) => qs.filter((q) => q.tipo === tipo && (q.estado === "nueva" || q.estado === "en_revision"));
  const quejasAbiertas = abiertas("queja");
  const sugNuevas = qs.filter((q) => q.tipo === "sugerencia" && q.estado === "nueva");

  // Últimos 8 meses, el actual al final.
  const [y0, m0] = ymFmt.format(new Date(now)).split("-").map(Number);
  const months = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(Date.UTC(y0, m0 - 1 - (7 - i), 15));
    return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, label: cap(monthFmt.format(d)) };
  });
  const perMonth = (list: { created_at: string }[]) => months.map((m) => list.filter((r) => ymFmt.format(new Date(r.created_at)) === m.key).length);

  const porSucursal = (sucursales ?? [])
    .filter((s) => s.activa)
    .map((s) => {
      const rs = res30.filter((r) => r.sucursal_id === s.id);
      return { nombre: s.nombre, avg: mean(rs.map((r) => r.calificacion)), n: rs.length };
    });

  // Actividad reciente: todo junto y ordenado por fecha.
  const feed: (ActivityRow & { t: number })[] = [
    ...rep.slice(0, 20).map((r) => ({
      t: new Date(r.created_at).getTime(),
      id: `REP-${short(r.id)}`,
      kind: "pista" as const,
      text: `Pista ${r.pista}: ${r.descripcion} (${ratingLabel(r.calificacion)})`,
      sucursal: r.sucursales?.nombre ?? "—",
      state: STATE_OF[r.calificacion] ?? ("new" as ActivityState),
      date: stampFmt.format(new Date(r.created_at)),
    })),
    ...res.slice(0, 20).map((r) => ({
      t: new Date(r.created_at).getTime(),
      id: `RES-${short(r.id)}`,
      kind: "resena" as const,
      text: r.comentario ?? "Reseña sin comentario",
      sucursal: r.sucursales?.nombre ?? "—",
      state: "ok" as ActivityState,
      badge: { tone: toneOf(r.calificacion), label: `${r.calificacion} ★` },
      date: stampFmt.format(new Date(r.created_at)),
    })),
    ...rm.slice(0, 20).map((r) => ({
      t: new Date(r.created_at).getTime(),
      id: `MES-${short(r.id)}`,
      kind: "mesero" as const,
      text: `${r.meseros?.nombre ?? "Mesero"}: ${r.comentario ?? "Reseña sin comentario"}`,
      sucursal: r.meseros?.sucursales?.nombre ?? "—",
      state: "ok" as ActivityState,
      badge: { tone: toneOf(r.calificacion), label: `${r.calificacion} ★` },
      date: stampFmt.format(new Date(r.created_at)),
    })),
    ...qs.slice(0, 20).map((q) => ({
      t: new Date(q.created_at).getTime(),
      id: `${q.tipo === "queja" ? "QJA" : "SUG"}-${short(q.id)}`,
      kind: q.tipo === "queja" ? ("queja" as const) : ("sugerencia" as const),
      text: q.mensaje,
      sucursal: q.sucursales?.nombre ?? "—",
      state: QUEJA_STATE[q.estado] ?? ("new" as ActivityState),
      ...(q.estado === "descartada" ? { badge: { tone: "warn" as const, label: "Descartada" } } : {}),
      date: stampFmt.format(new Date(q.created_at)),
    })),
  ]
    .sort((a, b) => b.t - a.t)
    .slice(0, 30);

  const hour = Number(new Intl.DateTimeFormat("es-MX", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date(now)));
  return {
    greeting: hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches",
    abiertos,
    nuevos,
    resueltos,
    total30: rep30.length,
    count30: res30.length,
    countPrev: resPrev.length,
    avg30,
    avgDelta: res30.length && resPrev.length ? avg30 - avgPrev : null,
    areas,
    quejasAbiertas: quejasAbiertas.length,
    quejasAltas: quejasAbiertas.filter((q) => q.prioridad === "alta").length,
    sugNuevas: sugNuevas.length,
    sugRevision: qs.filter((q) => q.tipo === "sugerencia" && q.estado === "en_revision").length,
    monthLabels: months.map((m) => m.label),
    pistasPorMes: perMonth(rep),
    resenasPorMes: perMonth(res),
    porSucursal,
    activity: feed.map((f) => {
      const { t, ...row } = f;
      void t;
      return row;
    }),
  };
}

async function Summary() {
  await connection();
  const d = await loadSummary();
  const pct = d.total30 ? Math.round((d.resueltos / d.total30) * 100) : 0;
  const fmtArea = (v: number) => (v > 0 ? v.toFixed(1) : "—");
  const resDeltaPct = d.countPrev > 0 ? Math.round(((d.count30 - d.countPrev) / d.countPrev) * 100) : null;

  const kpis: { label: string; n: number; icon: IconName; delta: string; down?: boolean; hot?: boolean; href: string; foot: string }[] = [
    { label: "Reportes de pistas abiertos", n: d.abiertos, icon: "pin", delta: `${d.nuevos} esta semana`, down: d.nuevos > 0, hot: true, href: "/admin/pistas", foot: "últimos 30 días" },
    {
      label: "Reseñas del mes",
      n: d.count30,
      icon: "star",
      delta: resDeltaPct === null ? "nuevas" : `${resDeltaPct > 0 ? "+" : ""}${resDeltaPct}%`,
      down: resDeltaPct !== null && resDeltaPct < 0,
      href: "/admin/resenas",
      foot: "últimos 30 días",
    },
    { label: "Quejas por atender", n: d.quejasAbiertas, icon: "chat", delta: d.quejasAltas ? `${d.quejasAltas} prioridad alta` : "sin urgentes", down: d.quejasAltas > 0, href: "/admin/quejas", foot: "abiertas" },
    { label: "Sugerencias nuevas", n: d.sugNuevas, icon: "bulb", delta: `${d.sugRevision} en revisión`, href: "/admin/quejas", foot: "sin revisar" },
  ];

  return (
    <div className="adm-page">
      <h1>{d.greeting}</h1>
      <p className="sub">Mira cómo va la experiencia en tus sucursales: pistas, servicio, comida y lo que dicen tus clientes.</p>

      <div className="grid g-sum">
        <div className="card a">
          <div className="row between wrap">
            <span className="lbl">Calificación general</span>
            <span className="pillnote">Todas las sucursales</span>
          </div>
          <div className="big">{d.count30 ? <><CountUp value={d.avg30} decimals={1} /> / 5</> : "— / 5"}</div>
          <div className="row">
            {d.avgDelta !== null ? (
              <>
                <span className={`delta ${d.avgDelta < 0 ? "down" : ""}`}>
                  <Icon name={d.avgDelta < 0 ? "down" : "up"} />
                  {Math.abs(d.avgDelta).toFixed(1)}
                </span>
                <span className="lbl">frente al mes pasado</span>
              </>
            ) : (
              <span className="lbl">{d.count30 ? "últimos 30 días" : "Aún no hay reseñas este mes"}</span>
            )}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <Link href="/admin/resenas" className="btn dark" style={{ flex: 1 }}>
              <Icon name="star" />
              Ver reseñas
            </Link>
            <Link href="/admin/quejas" className="btn" style={{ flex: 1 }}>
              <Icon name="chat" />
              Quejas
            </Link>
          </div>
          <div className="areas">
            <h3>Promedio por área</h3>
            <div className="mini">
              {[
                ["Limpieza", fmtArea(d.areas.limpieza)],
                ["Atención", fmtArea(d.areas.atencion)],
                ["Comida", fmtArea(d.areas.comida)],
                ["Precio", fmtArea(d.areas.precio)],
              ].map(([a, v]) => (
                <div key={a}>
                  <b>{v}</b>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="kpis b">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className={`kpi ${k.hot ? "hot" : ""}`}>
              <div className="top2">
                <span className="lbl">{k.label}</span>
                <span className="ico">
                  <Icon name={k.icon} />
                </span>
              </div>
              <div className="n">
                <CountUp value={k.n} />
              </div>
              <div className="row">
                <span className={`delta ${k.down ? "down" : ""}`}>
                  <Icon name={k.down ? "down" : "up"} />
                  {k.delta}
                </span>
                <small>{k.foot}</small>
              </div>
            </Link>
          ))}
        </div>

        <div className="card c">
          <h2>Actividad del año</h2>
          <p className="hint">Reportes de pistas y reseñas recibidas por mes</p>
          <div className="chart">
            <div className="legend">
              <span>
                <i style={{ background: "var(--accent)" }} />
                Reportes de pistas
              </span>
              <span>
                <i style={{ background: "var(--bar-ink)" }} />
                Reseñas
              </span>
            </div>
            <ActivityChart months={d.monthLabels} pistas={d.pistasPorMes} resenas={d.resenasPorMes} />
          </div>
        </div>

        <div className="card d">
          <h2>Por sucursal</h2>
          <p className="hint">Calificación promedio, últimos 30 días</p>
          <div className="suc">
            {d.porSucursal.map((s) => (
              <div key={s.nombre}>
                <span>{s.nombre}</span>
                <div className="bar">
                  <i style={{ width: `${(s.avg / 5) * 100}%` }} />
                </div>
                <b className="mono">{s.n ? s.avg.toFixed(1) : "—"}</b>
              </div>
            ))}
            {d.porSucursal.length === 0 && <span className="lbl">Aún no hay sucursales activas.</span>}
          </div>
          <div className="divider" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>
            <div className="row between">
              <span className="lbl" style={{ fontSize: 13 }}>
                Pistas resueltas (30 días)
              </span>
              <b className="mono">{d.total30 ? `${pct}%` : "—"}</b>
            </div>
            <div className="prog" style={{ marginTop: 8 }}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="foot-meta">
              <span>
                <b>
                  <CountUp value={d.resueltos} />
                </b>{" "}
                resueltas
              </span>
              <span>de {d.total30} reportes</span>
            </div>
          </div>
        </div>

        <div className="card e">
          <ActivityTable data={d.activity} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSummaryPage() {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Summary />
    </Suspense>
  );
}
