import { redirect } from "next/navigation";
import { createClient } from "./server";

export type AdminRol = "super" | "sucursal";

// Verifica sesión y que el usuario esté en la tabla `admins`. Úsalo en layouts y server actions del panel.
// Lo que cada admin ve por sucursal lo decide la base de datos (RLS); `rol` sirve para mostrar u ocultar secciones.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, rol, nombre")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/login?error=no-admin");

  const rol: AdminRol = admin.rol === "super" ? "super" : "sucursal";
  return { supabase, user, rol, isSuper: rol === "super", nombre: admin.nombre };
}

// Para secciones que solo usa el super administrador (usuarios, sucursales).
export async function requireSuper() {
  const ctx = await requireAdmin();
  if (!ctx.isSuper) redirect("/admin");
  return ctx;
}
