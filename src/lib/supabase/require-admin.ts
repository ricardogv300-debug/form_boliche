import { redirect } from "next/navigation";
import { createClient } from "./server";

// Verifica sesión y que el usuario esté en la tabla `admins`. Úsalo en layouts y server actions del panel.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/login?error=no-admin");

  return { supabase, user };
}
