"use server";

import { createClient } from "@/lib/supabase/server";

export type PublicResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitResenaMesero(meseroId: string, calificacion: number, comentario: string): Promise<PublicResult> {
  const texto = comentario.trim();
  const valid =
    typeof meseroId === "string" &&
    UUID.test(meseroId) &&
    Number.isInteger(calificacion) &&
    calificacion >= 1 &&
    calificacion <= 5 &&
    texto.length <= 600;
  if (!valid) return { ok: false, error: "Revisa los datos e inténtalo de nuevo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("resenas_meseros")
    .insert({ mesero_id: meseroId, calificacion, comentario: texto || null });
  if (error) {
    console.error("Error al guardar reseña:", error.message);
    return { ok: false, error: "No pudimos guardar tu reseña. Inténtalo de nuevo en un momento." };
  }
  return { ok: true };
}

export async function submitQueja(
  sucursalId: string,
  data: { tipo: string; mensaje: string; nombre: string; contacto: string; website?: string },
): Promise<PublicResult> {
  // Campo trampa para bots: las personas no lo ven ni lo llenan.
  if (data.website) return { ok: true };

  const mensaje = data.mensaje.trim();
  const nombre = data.nombre.trim();
  const contacto = data.contacto.trim();
  const valid =
    UUID.test(sucursalId) &&
    (data.tipo === "queja" || data.tipo === "sugerencia") &&
    mensaje.length >= 5 &&
    mensaje.length <= 1000 &&
    nombre.length <= 100 &&
    contacto.length <= 120;
  if (!valid) return { ok: false, error: "Revisa los datos e inténtalo de nuevo." };

  const supabase = await createClient();
  const { error } = await supabase.from("quejas_sugerencias").insert({
    tipo: data.tipo,
    sucursal_id: sucursalId,
    mensaje,
    nombre: nombre || null,
    contacto: contacto || null,
  });
  if (error) {
    console.error("Error al guardar queja o sugerencia:", error.message);
    return { ok: false, error: "No pudimos guardar tu mensaje. Inténtalo de nuevo en un momento." };
  }
  return { ok: true };
}
