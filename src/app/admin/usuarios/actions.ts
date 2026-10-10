"use server";

import { revalidatePath } from "next/cache";
import { requireSuper } from "@/lib/supabase/require-admin";

export type UsuarioState = { error?: string; ok?: boolean } | null;

type Supabase = Awaited<ReturnType<typeof requireSuper>>["supabase"];

// Crear, cambiar contraseña y borrar usuarios necesita la llave de servicio, que vive solo en la función `admin-users`
// (ella misma confirma que quien llama es super administrador).
async function callAdminUsers(supabase: Supabase, body: Record<string, unknown>): Promise<string | null> {
  const { error } = await supabase.functions.invoke("admin-users", { body });
  if (!error) return null;
  const res = (error as { context?: unknown }).context;
  if (res instanceof Response) {
    try {
      const data = await res.json();
      if (typeof data?.error === "string") return data.error;
    } catch {}
  }
  return "No se pudo completar la acción. Intenta de nuevo.";
}

function ids(formData: FormData) {
  return formData.getAll("sucursal_id").map(String);
}

export async function createUsuario(_: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const { supabase } = await requireSuper();
  const email = String(formData.get("email") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const sucursal_ids = ids(formData);

  if (!email) return { error: "Escribe el correo del usuario." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!sucursal_ids.length) return { error: "Elige al menos una sucursal para este usuario." };

  const error = await callAdminUsers(supabase, { action: "create", email, nombre, password, sucursal_ids });
  if (error) return { error };
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function updateAcceso(_: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const { supabase } = await requireSuper();
  const userId = String(formData.get("user_id") ?? "");
  const sucursal_ids = ids(formData);
  if (!sucursal_ids.length) return { error: "Elige al menos una sucursal. Para quitarle todo el acceso, borra al usuario." };

  const { data: target } = await supabase.from("admins").select("rol").eq("user_id", userId).maybeSingle();
  if (!target) return { error: "No se encontró el usuario." };
  if (target.rol === "super") return { error: "El super administrador ya tiene acceso a todo." };

  const { error: delError } = await supabase.from("admin_sucursales").delete().eq("user_id", userId);
  if (delError) return { error: "No se pudo guardar el acceso." };
  const { error } = await supabase
    .from("admin_sucursales")
    .insert(sucursal_ids.map((sucursal_id) => ({ user_id: userId, sucursal_id })));
  if (error) return { error: "No se pudo guardar el acceso." };

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setPasswordUsuario(_: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const { supabase } = await requireSuper();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const error = await callAdminUsers(supabase, {
    action: "set_password",
    user_id: String(formData.get("user_id") ?? ""),
    password,
  });
  return error ? { error } : { ok: true };
}

export async function deleteUsuario(_: UsuarioState, formData: FormData): Promise<UsuarioState> {
  const { supabase } = await requireSuper();
  const error = await callAdminUsers(supabase, { action: "delete", user_id: String(formData.get("user_id") ?? "") });
  if (error) return { error };
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
