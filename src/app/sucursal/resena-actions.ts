"use server";

import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISITAS = ["familia", "amigos", "pareja", "trabajo", "cumpleanos", "otro"];
const RECOMIENDA = ["si", "tal_vez", "no"];

export type ResenaInput = {
  calificacion: number;
  ambiente: number;
  limpieza: number;
  atencion: number;
  comida: number;
  pistas: number;
  precio: number; // 0 = sin responder
  recomendaria: string;
  visita: string;
  comentario: string;
  nombre: string;
  // Parte opcional: queja o sugerencia
  tipo: string;
  mensaje: string;
  contacto: string;
  website?: string;
};

export type ResenaResult = { ok: true; quejaGuardada: boolean } | { ok: false; error: string };

const stars = (n: number) => Number.isInteger(n) && n >= 0 && n <= 5;

export async function submitResenaLugar(sucursalId: string, d: ResenaInput): Promise<ResenaResult> {
  // Campo trampa para bots: las personas no lo ven ni lo llenan.
  if (d.website) return { ok: true, quejaGuardada: false };

  const comentario = d.comentario.trim();
  const nombre = d.nombre.trim();
  const mensaje = d.mensaje.trim();
  const contacto = d.contacto.trim();
  const quiereQueja = mensaje.length > 0;

  const valid =
    UUID.test(sucursalId) &&
    Number.isInteger(d.calificacion) &&
    d.calificacion >= 1 &&
    d.calificacion <= 5 &&
    [d.ambiente, d.limpieza, d.atencion, d.comida, d.pistas, d.precio].every(stars) &&
    (d.recomendaria === "" || RECOMIENDA.includes(d.recomendaria)) &&
    (d.visita === "" || VISITAS.includes(d.visita)) &&
    comentario.length <= 1000 &&
    nombre.length <= 100 &&
    contacto.length <= 120 &&
    (!quiereQueja || ((d.tipo === "queja" || d.tipo === "sugerencia") && mensaje.length >= 5 && mensaje.length <= 1000));
  if (!valid) return { ok: false, error: "Revisa los datos e inténtalo de nuevo." };

  const supabase = await createClient();
  // El id se genera aquí para poder ligar la queja sin tener que leer la reseña de vuelta (el público no puede leerlas).
  const id = crypto.randomUUID();
  const opt = (n: number) => (n >= 1 ? n : null);
  const { error } = await supabase.from("resenas_lugar").insert({
    id,
    sucursal_id: sucursalId,
    calificacion: d.calificacion,
    ambiente: opt(d.ambiente),
    limpieza: opt(d.limpieza),
    atencion: opt(d.atencion),
    comida: opt(d.comida),
    pistas: opt(d.pistas),
    precio: opt(d.precio),
    recomendaria: d.recomendaria || null,
    visita: d.visita || null,
    comentario: comentario || null,
    nombre: nombre || null,
  });
  if (error) {
    console.error("Error al guardar reseña del lugar:", error.message);
    return { ok: false, error: "No pudimos guardar tu reseña. Inténtalo de nuevo en un momento." };
  }

  if (!quiereQueja) return { ok: true, quejaGuardada: false };

  const { error: errQueja } = await supabase.from("quejas_sugerencias").insert({
    tipo: d.tipo,
    sucursal_id: sucursalId,
    mensaje,
    nombre: nombre || null,
    contacto: contacto || null,
    resena_id: id,
  });
  if (errQueja) {
    console.error("Error al guardar queja junto con la reseña:", errQueja.message);
    return { ok: true, quejaGuardada: false };
  }
  return { ok: true, quejaGuardada: true };
}
