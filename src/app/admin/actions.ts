"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function deleteReport(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("reportes").delete().eq("id", id).select("id");
  if (error) return { error: "No se pudo borrar el reporte." };
  if (!data?.length) return { error: "No se encontró el reporte." };

  revalidatePath("/admin");
  revalidatePath("/admin/pistas");
  revalidatePath("/admin/graficas");
  return {};
}
