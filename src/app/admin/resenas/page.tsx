import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import CountUp from "@/components/admin/CountUp";
import { Stars } from "@/components/admin/Icon";
import { iniciales } from "@/lib/fotos";
import { requireAdmin } from "@/lib/supabase/require-admin";

const RANGES = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
  { dias: 0, label: "Todo" },
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const stamp = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });

const AREAS = [
  { key: "ambiente", label: "Ambiente y música" },
  { key: "limpieza", label: "Limpieza" },
  { key: "atencion", label: "Atención del personal" },
  { key: "comida", label: "Comida y bebidas" },
  { key: "pistas", label: "Las pistas" },
  { key: "precio", label: "Precio" },
] as const;
const VISITAS: Record<string, string> = { familia: "En familia", amigos: "Con amigos", pareja: "En pareja", trabajo: "Evento de trabajo", cumpleanos: "Cumpleaños", otro: "Otro" };
const RECO: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  si: { label: "Nos recomienda", tone: "ok" },
  tal_vez: { label: "Tal vez nos recomiende", tone: "warn" },
  no: { label: "No nos recomienda", tone: "bad" },
};

const since = (dias: number) => (dias > 0 ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString() : null);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

async function Reviews({ searchParams }: { searchParams: PageProps<"/admin/resenas">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const dias = RANGES.find((r) => String(r.dias) === sp.dias)?.dias ?? 30;
  const selected = typeof sp.sucursal === "string" && UUID.test(sp.sucursal) ? sp.sucursal : null;

  const { supabase } = await requireAdmin();
  const cutoff = since(dias);
  const [{ data: sucursales }, { data: rows }, { data: linked }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("created_at", { ascending: true }),
    (() => {
      const q = supabase
        .from("resenas_lugar")
        .select("id, sucursal_id, calificacion, ambiente, limpieza, atencion, comida, pistas, precio, recomendaria, visita, comentario, nombre, created_at")
        .order("created_at", { ascending: false })
        .limit(3000);
      return cutoff ? q.gte("created_at", cutoff) : q;
    })(),
    supabase.from("quejas_sugerencias").select("resena_id, tipo").not("resena_id", "is", null).limit(3000),
  ]);

  const sucName = new Map((sucursales ?? []).map((s) => [s.id, s.nombre]));
  const all = rows ?? [];
  const list = selected ? all.filter((r) => r.sucursal_id === selected) : all;
  const msgOf = new Map((linked ?? []).map((l) => [l.resena_id as string, l.tipo]));

  const dist = [0, 0, 0, 0, 0];
  for (const r of list) dist[r.calificacion - 1] += 1;
  const avg = mean(list.map((r) => r.calificacion));
  const maxDist = Math.max(1, ...dist);

  const reco = { si: 0, tal_vez: 0, no: 0 };
  for (const r of list) if (r.recomendaria && r.recomendaria in reco) reco[r.recomendaria as keyof typeof reco] += 1;
  const recoTotal = reco.si + reco.tal_vez + reco.no;
  const recoPct = recoTotal ? Math.round((reco.si / recoTotal) * 100) : null;

  const areaStats = AREAS.map((a) => {
    const vals = list.map((r) => r[a.key]).filter((v): v is number => typeof v === "number");
    return { ...a, avg: mean(vals), n: vals.length };
  });

  const visitas = Object.entries(VISITAS)
    .map(([k, label]) => ({ label, n: list.filter((r) => r.visita === k).length }))
    .filter((v) => v.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxVisita = Math.max(1, ...visitas.map((v) => v.n));

  const perSucursal = (sucursales ?? []).map((s) => {
    const rs = all.filter((r) => r.sucursal_id === s.id);
    return { id: s.id, nombre: s.nombre, n: rs.length, avg: mean(rs.map((r) => r.calificacion)) };
  });

  const mensajes = list.filter((r) => msgOf.has(r.id)).length;
  const recientes = list.slice(0, 12);

  const href = (s: string | null, d: number) => {
    const p = new URLSearchParams();
    if (s) p.set("sucursal", s);
    if (d !== 30) p.set("dias", String(d));
    const q = p.toString();
    return `/admin/resenas${q ? `?${q}` : ""}`;
  };
  const selectedName = selected ? sucName.get(selected) : null;

  return (
    <div className="adm-page">
      <h1>Reseñas</h1>
      <p className="sub">
        {selectedName ? `Lo que opinan los clientes de ${selectedName}.` : "Lo que opinan los clientes de su visita completa."} Elige una sucursal para verla por separado.
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
          <span className="lbl">Calificación promedio</span>
          <div className="n">{list.length ? <CountUp value={avg} decimals={1} /> : "—"}</div>
          <small>{list.length ? "de 5 estrellas" : "Sin reseñas todavía"}</small>
        </div>
        <div className="card">
          <span className="lbl">Reseñas recibidas</span>
          <div className="big">
            <CountUp value={list.length} />
          </div>
          <small className="lbl">{dias ? `en los últimos ${dias} días` : "en total"}</small>
        </div>
        <div className="card">
          <span className="lbl">Nos recomendarían</span>
          <div className="big">{recoPct === null ? "—" : `${recoPct}%`}</div>
          <small className="lbl">{recoTotal ? `${reco.si} de ${recoTotal} respuestas` : "Sin respuestas todavía"}</small>
        </div>
        <Link href="/admin/quejas" className="card">
          <span className="lbl">Dejaron queja o sugerencia</span>
          <div className="big">
            <CountUp value={mensajes} />
          </div>
          <small className="lbl">{mensajes ? "Ver en Quejas y sugerencias →" : "junto con su reseña"}</small>
        </Link>
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
                  <i style={{ width: `${(dist[s - 1] / maxDist) * 100}%` }} />
                </div>
                <b className="mono">{dist[s - 1]}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Promedio por área</h2>
          <p className="hint">Solo cuentan quienes calificaron cada área</p>
          <div className="suc" style={{ marginTop: 12 }}>
            {areaStats.map((a) => (
              <div key={a.key}>
                <span>{a.label}</span>
                <div className="bar">
                  <i style={{ width: `${(a.avg / 5) * 100}%` }} />
                </div>
                <b className="mono">{a.n ? a.avg.toFixed(1) : "—"}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid g-half" style={{ flex: "none" }}>
        <div className="card">
          <h2>Comparar sucursales</h2>
          <p className="hint">Toca una para verla por separado</p>
          <div className="cmp">
            {perSucursal.map((s) => (
              <Link key={s.id} href={href(s.id, dias)} className={selected === s.id ? "on" : ""}>
                <span className="cname">{s.nombre}</span>
                <div className="bar">
                  <i style={{ width: `${(s.avg / 5) * 100}%` }} />
                </div>
                <b className="mono">{s.n ? s.avg.toFixed(1) : "—"}</b>
                <span className="meta">
                  {s.n} {s.n === 1 ? "reseña" : "reseñas"}
                </span>
              </Link>
            ))}
            {perSucursal.length === 0 && <span className="lbl">Aún no hay sucursales.</span>}
          </div>
        </div>
        <div className="card">
          <h2>¿Con quién nos visitan?</h2>
          <p className="hint">Tipo de visita que indicaron</p>
          <div className="suc" style={{ marginTop: 12 }}>
            {visitas.map((v) => (
              <div key={v.label}>
                <span>{v.label}</span>
                <div className="bar ink">
                  <i style={{ width: `${(v.n / maxVisita) * 100}%` }} />
                </div>
                <b className="mono">{v.n}</b>
              </div>
            ))}
            {visitas.length === 0 && <span className="lbl">Aparecerá cuando los clientes lo indiquen.</span>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Más recientes</h2>
        <div className="list">
          {recientes.map((r) => {
            const msg = msgOf.get(r.id);
            const reco2 = r.recomendaria ? RECO[r.recomendaria] : null;
            const chips = AREAS.filter((a) => typeof r[a.key] === "number");
            return (
              <div className="item" key={r.id}>
                <div className="row between wrap">
                  <div className="who">
                    <div className="avatar">{r.nombre ? iniciales(r.nombre) : "?"}</div>
                    <div>
                      <b>{r.nombre || "Anónimo"}</b>
                      <span className="meta">
                        {sucName.get(r.sucursal_id) ?? "—"} · {stamp.format(new Date(r.created_at))}
                        {r.visita ? ` · ${VISITAS[r.visita]}` : ""}
                      </span>
                    </div>
                  </div>
                  <Stars value={r.calificacion} />
                </div>
                {r.comentario && <p>{r.comentario}</p>}
                {(chips.length > 0 || reco2 || msg) && (
                  <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                    {chips.map((a) => (
                      <span key={a.key} className="pillnote" style={{ background: "var(--card)", fontSize: 12, padding: "4px 10px" }}>
                        {a.label}: <b>{r[a.key]}</b>
                      </span>
                    ))}
                    {reco2 && (
                      <span className={`tag ${reco2.tone}`}>
                        <span>{reco2.label}</span>
                      </span>
                    )}
                    {msg && (
                      <Link href="/admin/quejas" className={`badge ${msg === "queja" ? "q" : "s"}`}>
                        Dejó {msg === "queja" ? "una queja" : "una sugerencia"}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {recientes.length === 0 && <div className="empty">Las reseñas de tus clientes aparecerán aquí en cuanto lleguen.</div>}
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage({ searchParams }: PageProps<"/admin/resenas">) {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}
