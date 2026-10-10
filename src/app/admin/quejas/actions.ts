"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

export type QuejaResult = { error?: string; ok?: boolean };

const ESTADOS = ["nueva", "en_revision", "atendida", "descartada"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refresh() {
  revalidatePath("/admin/quejas");
  revalidatePath("/admin");
}

// Registro manual (por ejemplo, algo que un cliente dijo en persona o por teléfono).
export async function createQueja(formData: FormData): Promise<QuejaResult> {
  const { supabase } = await requireAdmin();
  const tipo = String(formData.get("tipo") ?? "");
  const sucursalId = String(formData.get("sucursal_id") ?? "");
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const prioridad = formData.get("prioridad") === "alta" ? "alta" : "normal";

  if (tipo !== "queja" && tipo !== "sugerencia") return { error: "Elige si es una queja o una sugerencia." };
  if (!UUID.test(sucursalId)) return { error: "Elige la sucursal." };
  if (mensaje.length < 5 || mensaje.length > 1000) return { error: "Escribe el mensaje (5 a 1000 letras)." };
  if (nombre.length > 100 || contacto.length > 120) return { error: "El nombre o el contacto es demasiado largo." };

  const { error } = await supabase
    .from("quejas_sugerencias")
    .insert({ tipo, sucursal_id: sucursalId, mensaje, nombre: nombre || null, contacto: contacto || null, prioridad });
  if (error) return { error: "No se pudo guardar." };
  refresh();
  return { ok: true };
}

// Mueve una queja o sugerencia a otra columna y deja el cambio en su historial.
export async function moveQueja(id: string, estado: string): Promise<QuejaResult> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id) || !ESTADOS.includes(estado)) return { error: "Movimiento no válido." };

  const { data, error } = await supabase
    .from("quejas_sugerencias")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: "No se pudo mover." };
  if (!data?.length) return { error: "No se encontró el registro." };

  await supabase.from("seguimientos").insert({ queja_id: id, tipo: "estado", estado_nuevo: estado });
  refresh();
  return { ok: true };
}

export async function setPrioridad(id: string, prioridad: "normal" | "alta"): Promise<QuejaResult> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "No se encontró el registro." };
  const { data, error } = await supabase
    .from("quejas_sugerencias")
    .update({ prioridad, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: "No se pudo actualizar." };
  if (!data?.length) return { error: "No se encontró el registro." };
  refresh();
  return { ok: true };
}

export async function addNota(id: string, nota: string): Promise<QuejaResult> {
  const { supabase } = await requireAdmin();
  const texto = nota.trim();
  if (!UUID.test(id)) return { error: "No se encontró el registro." };
  if (texto.length < 2 || texto.length > 1000) return { error: "Escribe la nota (2 a 1000 letras)." };

  const { error } = await supabase.from("seguimientos").insert({ queja_id: id, tipo: "nota", nota: texto });
  if (error) return { error: "No se pudo guardar la nota." };
  await supabase.from("quejas_sugerencias").update({ updated_at: new Date().toISOString() }).eq("id", id);
  refresh();
  return { ok: true };
}

export async function deleteQueja(id: string): Promise<QuejaResult> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "No se encontró el registro." };
  const { data, error } = await supabase.from("quejas_sugerencias").delete().eq("id", id).select("id");
  if (error) return { error: "No se pudo borrar." };
  if (!data?.length) return { error: "No se encontró el registro." };
  refresh();
  return { ok: true };
}
