import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Stars } from "@/components/admin/Icon";
import MeserosPanel, { type MeseroView } from "@/components/admin/meseros/MeserosPanel";
import { fotoUrl, iniciales } from "@/lib/fotos";
import { requireAdmin } from "@/lib/supabase/require-admin";

const RANGES = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
  { dias: 0, label: "Todo" },
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });

const since = (dias: number) => (dias > 0 ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString() : null);
const avgOf = (dist: number[]) => {
  const n = dist.reduce((a, b) => a + b, 0);
  return n ? dist.reduce((a, c, i) => a + c * (i + 1), 0) / n : 0;
};

async function Waiters({ searchParams }: { searchParams: PageProps<"/admin/meseros">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const dias = RANGES.find((r) => String(r.dias) === sp.dias)?.dias ?? 30;
  const selected = typeof sp.sucursal === "string" && UUID.test(sp.sucursal) ? sp.sucursal : null;

  const { supabase } = await requireAdmin();
  const cutoff = since(dias);
  const [{ data: sucursales }, { data: meseros }, resenasRes] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("created_at", { ascending: true }),
    supabase
      .from("meseros")
      .select("id, sucursal_id, nombre, puesto, turno, telefono, fecha_ingreso, foto_path, activo")
      .order("nombre", { ascending: true }),
    (() => {
      const q = supabase
        .from("resenas_meseros")
        .select("id, mesero_id, calificacion, comentario, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      return cutoff ? q.gte("created_at", cutoff) : q;
    })(),
  ]);

  const sucName = new Map((sucursales ?? []).map((s) => [s.id, s.nombre]));
  const resenas = resenasRes.data ?? [];

  const distOf = new Map<string, number[]>();
  for (const r of resenas) {
    const d = distOf.get(r.mesero_id) ?? [0, 0, 0, 0, 0];
    d[r.calificacion - 1] += 1;
    distOf.set(r.mesero_id, d);
  }

  const all = (meseros ?? []).map((m) => {
    const dist = distOf.get(m.id) ?? [0, 0, 0, 0, 0];
    return { ...m, dist, count: dist.reduce((a, b) => a + b, 0), avg: avgOf(dist) };
  });
  const inScope = selected ? all.filter((m) => m.sucursal_id === selected) : all;

  // El mejor valorado: más promedio y, a igualdad, más reseñas.
  const ranked = inScope.filter((m) => m.count > 0).sort((a, b) => b.avg - a.avg || b.count - a.count);
  const bestId = ranked[0]?.id;

  const views: MeseroView[] = inScope
    .map((m) => ({
      id: m.id,
      sucursal_id: m.sucursal_id,
      sucursal: sucName.get(m.sucursal_id) ?? "—",
      nombre: m.nombre,
      puesto: m.puesto,
      turno: m.turno,
      telefono: m.telefono,
      fecha_ingreso: m.fecha_ingreso,
      foto_path: m.foto_path,
      foto_url: fotoUrl(m.foto_path),
      activo: m.activo,
      avg: m.avg,
      count: m.count,
      dist: m.dist,
      best: m.id === bestId,
    }))
    .sort((a, b) => Number(b.activo) - Number(a.activo) || b.avg - a.avg || a.nombre.localeCompare(b.nombre));

  const totalDist = [0, 0, 0, 0, 0];
  for (const m of inScope) m.dist.forEach((n, i) => (totalDist[i] += n));
  const totalCount = totalDist.reduce((a, b) => a + b, 0);
  const totalAvg = avgOf(totalDist);
  const maxDist = Math.max(1, ...totalDist);

  const perSucursal = (sucursales ?? []).map((s) => {
    const ms = all.filter((m) => m.sucursal_id === s.id);
    const d = [0, 0, 0, 0, 0];
    ms.forEach((m) => m.dist.forEach((n, i) => (d[i] += n)));
    return { id: s.id, nombre: s.nombre, meseros: ms.filter((m) => m.activo).length, count: d.reduce((a, b) => a + b, 0), avg: avgOf(d) };
  });

  const scopeIds = new Set(inScope.map((m) => m.id));
  const nameOf = new Map(all.map((m) => [m.id, m]));
  const comentarios = resenas.filter((r) => r.comentario && scopeIds.has(r.mesero_id)).slice(0, 8);

  const href = (s: string | null, d: number) => {
    const p = new URLSearchParams();
    if (s) p.set("sucursal", s);
    if (d !== 30) p.set("dias", String(d));
    const q = p.toString();
    return `/admin/meseros${q ? `?${q}` : ""}`;
  };
  const selectedName = selected ? sucName.get(selected) : null;

  return (
    <div className="adm-page">
      <h1>Meseros</h1>
      <p className="sub">
        {selectedName ? `Equipo y reseñas de ${selectedName}.` : "Equipo y reseñas de todas tus sucursales."} Elige una sucursal para ver solo sus meseros.
      </p>

      <div className="filters">
        <div className="chips">
          <Link href={href(null, dias)} className="chip" aria-current={!selected}>
            Todas las sucursales
          </Link>
          {sucursales?.map((s) => (
            <Link key={s.id} href={href(s.id, dias)} className="chip" aria-current={selected === s.id}>
              {s.nombre}
            </Link>
          ))}
        </div>
        <div className="chips">
          {RANGES.map((r) => (
            <Link key={r.dias} href={href(selected, r.dias)} className="chip" aria-current={r.dias === dias}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid g-stat4" style={{ flex: "none" }}>
        <div className="card kpi hot">
          <span className="lbl">Meseros activos</span>
          <div className="n">{inScope.filter((m) => m.activo).length}</div>
          <small>{selectedName ?? "en todas las sucursales"}</small>
        </div>
        <div className="card">
          <span className="lbl">Reseñas recibidas</span>
          <div className="big">{totalCount}</div>
          <small className="lbl">{dias ? `en los últimos ${dias} días` : "en total"}</small>
        </div>
        <div className="card">
          <span className="lbl">Calificación promedio</span>
          <div className="big">{totalCount ? totalAvg.toFixed(1) : "—"}</div>
          {totalCount > 0 ? <Stars value={totalAvg} /> : <small className="lbl">Sin reseñas todavía</small>}
        </div>
        <div className="card">
          <span className="lbl">Mejor valorado</span>
          <div className="row" style={{ marginTop: 8 }}>
            {ranked[0] ? (
              <>
                {ranked[0].foto_path ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto ya reducida desde el navegador
                  <img src={fotoUrl(ranked[0].foto_path)!} alt="" className="photo" style={{ width: 44, height: 44 }} />
                ) : (
                  <span className="photo ph" style={{ width: 44, height: 44, fontSize: 16 }}>
                    {iniciales(ranked[0].nombre)}
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <b className="mname">{ranked[0].nombre}</b>
                  <div className="meta">
                    {ranked[0].avg.toFixed(1)} · {ranked[0].count} {ranked[0].count === 1 ? "reseña" : "reseñas"}
                  </div>
                </div>
              </>
            ) : (
              <small className="lbl">Aparecerá cuando lleguen reseñas</small>
            )}
          </div>
        </div>
      </div>

      <div className="grid g-half" style={{ flex: "none" }}>
        <div className="card">
          <h2>Reseñas por estrellas</h2>
          <p className="hint">{selectedName ?? "Todas las sucursales"}</p>
          <div className="dist">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s}>
                <span>{s}★</span>
                <div className="bar">
                  <i style={{ width: `${(totalDist[s - 1] / maxDist) * 100}%` }} />
                </div>
                <b className="mono">{totalDist[s - 1]}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Comparar sucursales</h2>
          <p className="hint">Toca una para ver solo sus meseros</p>
          <div className="cmp">
            {perSucursal.map((s) => (
              <Link key={s.id} href={href(s.id, dias)} className={selected === s.id ? "on" : ""}>
                <span className="cname">{s.nombre}</span>
                <div className="bar">
                  <i style={{ width: `${(s.avg / 5) * 100}%` }} />
                </div>
                <b className="mono">{s.count ? s.avg.toFixed(1) : "—"}</b>
                <span className="meta">
                  {s.meseros} {s.meseros === 1 ? "mesero" : "meseros"} · {s.count} {s.count === 1 ? "reseña" : "reseñas"}
                </span>
              </Link>
            ))}
            {perSucursal.length === 0 && <span className="lbl">Aún no hay sucursales.</span>}
          </div>
        </div>
      </div>

      <MeserosPanel meseros={views} sucursales={sucursales ?? []} selected={selected} />

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Comentarios recientes</h2>
        <div className="list">
          {comentarios.map((r) => {
            const m = nameOf.get(r.mesero_id);
            return (
              <div className="item" key={r.id}>
                <div className="row between wrap">
                  <div className="who">
                    <div className="avatar">{iniciales(m?.nombre ?? "?")}</div>
                    <div>
                      <b>Sobre {m?.nombre ?? "—"}</b>
                      <span className="meta">
                        {sucName.get(m?.sucursal_id ?? "") ?? "—"} · {dateFmt.format(new Date(r.created_at))}
                      </span>
                    </div>
                  </div>
                  <Stars value={r.calificacion} />
                </div>
                <p>{r.comentario}</p>
              </div>
            );
          })}
          {comentarios.length === 0 && <div className="empty">Los comentarios de los clientes sobre tus meseros aparecerán aquí.</div>}
        </div>
      </div>
    </div>
  );
}

export default function AdminWaitersPage({ searchParams }: PageProps<"/admin/meseros">) {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Waiters searchParams={searchParams} />
    </Suspense>
  );
}
