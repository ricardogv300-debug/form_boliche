import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import LiveUpdates from "@/components/LiveUpdates";
import { requireAdmin } from "@/lib/supabase/require-admin";
import "./admin.css";

async function AdminUser() {
  await connection(); // la validación de sesión usa Date.now(): render en cada request
  const { user } = await requireAdmin();
  const email = user.email ?? "";
  return (
    <div className="user">
      <div className="avatar">{(email[0] ?? "A").toUpperCase()}</div>
      <div>
        <b>Administrador</b>
        <span>{email}</span>
      </div>
    </div>
  );
}

// El layout es estático; todo lo que lee la sesión va dentro de <Suspense>.
// Cada página del panel vuelve a verificar con requireAdmin().
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell
      status={<LiveUpdates />}
      user={
        <Suspense fallback={null}>
          <AdminUser />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  );
}
