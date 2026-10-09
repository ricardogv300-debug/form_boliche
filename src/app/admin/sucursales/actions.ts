"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

export type SucursalState = { error?: string; ok?: boolean } | null;

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePistas(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
}

export async function createSucursal(_: SucursalState, formData: FormData): Promise<SucursalState> {
  const { supabase } = await requireAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const numPistas = parsePistas(formData.get("num_pistas"));
  const slug = slugify(nombre);

  if (nombre.length < 2 || nombre.length > 80 || !slug) return { error: "Escribe un nombre válido (2 a 80 letras)." };
  if (numPistas === null) return { error: "El número de pistas debe ser un entero entre 1 y 100." };

  const { error } = await supabase.from("sucursales").insert({ nombre, slug, num_pistas: numPistas });
  if (error) {
    return { error: error.code === "23505" ? "Ya existe una sucursal con ese nombre." : "No se pudo crear la sucursal." };
  }
  revalidatePath("/admin/sucursales");
  return { ok: true };
}

export async function updateSucursal(_: SucursalState, formData: FormData): Promise<SucursalState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const numPistas = parsePistas(formData.get("num_pistas"));
  const activa = formData.get("activa") === "on";

  if (nombre.length < 2 || nombre.length > 80) return { error: "Escribe un nombre válido (2 a 80 letras)." };
  if (numPistas === null) return { error: "El número de pistas debe ser un entero entre 1 y 100." };

  // El slug no cambia para no romper los enlaces ya compartidos.
  const { data, error } = await supabase
    .from("sucursales")
    .update({ nombre, num_pistas: numPistas, activa })
    .eq("id", id)
    .select("id");
  if (error) {
    return { error: error.code === "23505" ? "Ya existe una sucursal con ese nombre." : "No se pudo guardar." };
  }
  if (!data?.length) return { error: "No se encontró la sucursal." };

  revalidatePath("/admin/sucursales");
  return { ok: true };
}

export async function deleteSucursal(_: SucursalState, formData: FormData): Promise<SucursalState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data, error } = await supabase.from("sucursales").delete().eq("id", id).select("id");
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Tiene reportes registrados; desactívala en lugar de borrarla."
          : "No se pudo borrar la sucursal.",
    };
  }
  if (!data?.length) return { error: "No se encontró la sucursal." };

  revalidatePath("/admin/sucursales");
  return { ok: true };
}
