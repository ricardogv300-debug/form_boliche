import { Suspense } from "react";
import { connection } from "next/server";
import QuejasBoard, { type Estado, type Queja } from "@/components/admin/quejas/QuejasBoard";
import { requireAdmin } from "@/lib/supabase/require-admin";

const TZ = "America/Mexico_City";
const stamp = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

const now = () => Date.now();
function ago(iso: string, at: number) {
  const min = Math.max(0, Math.round((at - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

async function Feedback() {
  await connection();
  const { supabase } = await requireAdmin();
  const [{ data: sucursales }, { data: rows }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("created_at", { ascending: true }),
    supabase
      .from("quejas_sugerencias")
      .select("id, tipo, sucursal_id, mensaje, nombre, contacto, prioridad, estado, created_at, sucursales(nombre)")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  const ids = (rows ?? []).map((r) => r.id);
  const { data: segs } = ids.length
    ? await supabase.from("seguimientos").select("id, queja_id, tipo, nota, estado_nuevo, created_at").in("queja_id", ids).order("created_at", { ascending: true })
    : { data: [] };

  const at = now();
  const items: Queja[] = (rows ?? []).map((r) => ({
    id: r.id,
    tipo: r.tipo as Queja["tipo"],
    sucursal_id: r.sucursal_id,
    sucursal: r.sucursales?.nombre ?? "—",
    mensaje: r.mensaje,
    nombre: r.nombre,
    contacto: r.contacto,
    prioridad: r.prioridad as Queja["prioridad"],
    estado: r.estado as Estado,
    fecha: stamp.format(new Date(r.created_at)),
    hace: ago(r.created_at, at),
    segs: (segs ?? [])
      .filter((s) => s.queja_id === r.id)
      .map((s) => ({
        id: s.id,
        tipo: s.tipo as "nota" | "estado",
        nota: s.nota,
        estado_nuevo: s.estado_nuevo as Estado | null,
        fecha: stamp.format(new Date(s.created_at)),
      })),
  }));

  return (
    <div className="adm-page">
      <QuejasBoard items={items} sucursales={sucursales ?? []} />
    </div>
  );
}

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<p className="lbl">Cargando...</p>}>
      <Feedback />
    </Suspense>
  );
}
