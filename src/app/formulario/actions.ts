"use server";

import { DAYS, RATINGS, TIME_SLOTS, type ComplaintForm } from "@/lib/form-options";
import { createClient } from "@/lib/supabase/server";

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitReport(sucursalId: string, form: ComplaintForm): Promise<SubmitResult> {
  const name = form.name.trim();
  const description = form.description.trim();

  const valid =
    typeof sucursalId === "string" &&
    sucursalId.length > 0 &&
    name.length >= 2 &&
    name.length <= 100 &&
    description.length >= 5 &&
    description.length <= 600 &&
    form.lane !== null &&
    Number.isInteger(form.lane) &&
    form.lane >= 1 &&
    form.day !== null &&
    (DAYS as readonly string[]).includes(form.day) &&
    form.timeSlot !== null &&
    TIME_SLOTS.includes(form.timeSlot) &&
    form.rating !== null &&
    RATINGS.some((r) => r.value === form.rating);

  if (!valid) return { ok: false, error: "Revisa los datos del formulario e inténtalo de nuevo." };

  const supabase = await createClient();
  const { error } = await supabase.from("reportes").insert({
    sucursal_id: sucursalId,
    nombre: name,
    pista: form.lane!,
    dia_semana: form.day!,
    horario: form.timeSlot!,
    descripcion: description,
    calificacion: form.rating!,
  });

  if (error) {
    console.error("Error al guardar reporte:", error.message);
    return { ok: false, error: "No pudimos guardar tu reporte. Inténtalo de nuevo en un momento." };
  }
  return { ok: true };
}
