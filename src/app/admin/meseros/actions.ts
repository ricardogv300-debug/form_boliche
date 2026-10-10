"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

export type MeseroState = { error?: string; ok?: boolean } | null;

const TURNOS = ["Matutino", "Vespertino", "Nocturno", "Mixto"];
const FOTO = /^[0-9a-f-]{36}\.jpg$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function refresh() {
  revalidatePath("/admin/meseros");
  revalidatePath("/admin");
}

// Crea o actualiza (si trae `id`) a un mesero. La foto ya viene subida desde el navegador: aquí solo se guarda su nombre.
export async function saveMesero(_: MeseroState, formData: FormData): Promise<MeseroState> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const sucursalId = text(formData, "sucursal_id");
  const nombre = text(formData, "nombre");
  const puesto = text(formData, "puesto") || "Mesero";
  const turno = text(formData, "turno");
  const telefono = text(formData, "telefono");
  const ingreso = text(formData, "fecha_ingreso");
  const foto = text(formData, "foto_path");
  const activo = formData.get("activo") === "on";

  if (!UUID.test(sucursalId)) return { error: "Elige la sucursal del mesero." };
  if (nombre.length < 2 || nombre.length > 80) return { error: "Escribe un nombre válido (2 a 80 letras)." };
  if (puesto.length < 2 || puesto.length > 40) return { error: "El puesto debe tener entre 2 y 40 letras." };
  if (turno && !TURNOS.includes(turno)) return { error: "Elige un turno válido." };
  if (telefono.length > 20) return { error: "El teléfono es demasiado largo." };
  if (ingreso && !/^\d{4}-\d{2}-\d{2}$/.test(ingreso)) return { error: "La fecha de ingreso no es válida." };
  if (foto && !FOTO.test(foto)) return { error: "La foto no es válida. Súbela de nuevo." };

  const row = {
    sucursal_id: sucursalId,
    nombre,
    puesto,
    turno: turno || null,
    telefono: telefono || null,
    fecha_ingreso: ingreso || null,
    foto_path: foto || null,
    activo,
  };

  if (!id) {
    const { error } = await supabase.from("meseros").insert(row);
    if (error) return { error: "No se pudo agregar al mesero." };
  } else {
    if (!UUID.test(id)) return { error: "No se encontró al mesero." };
    const { data: previo } = await supabase.from("meseros").select("foto_path").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("meseros").update(row).eq("id", id).select("id");
    if (error) return { error: "No se pudo guardar." };
    if (!data?.length) return { error: "No se encontró al mesero." };
    // Si cambió la foto, se borra la anterior para no dejar archivos sueltos.
    if (previo?.foto_path && previo.foto_path !== row.foto_path) {
      await supabase.storage.from("meseros").remove([previo.foto_path]);
    }
  }
  refresh();
  return { ok: true };
}

export async function setMeseroActivo(id: string, activo: boolean): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "No se encontró al mesero." };
  const { data, error } = await supabase.from("meseros").update({ activo }).eq("id", id).select("id");
  if (error) return { error: "No se pudo actualizar." };
  if (!data?.length) return { error: "No se encontró al mesero." };
  refresh();
  return {};
}

export async function deleteMesero(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (!UUID.test(id)) return { error: "No se encontró al mesero." };
  const { data: previo } = await supabase.from("meseros").select("foto_path").eq("id", id).maybeSingle();
  // Sus reseñas se borran en cascada (ON DELETE CASCADE).
  const { data, error } = await supabase.from("meseros").delete().eq("id", id).select("id");
  if (error) return { error: "No se pudo borrar al mesero." };
  if (!data?.length) return { error: "No se encontró al mesero." };
  if (previo?.foto_path) await supabase.storage.from("meseros").remove([previo.foto_path]);
  refresh();
  return {};
}
