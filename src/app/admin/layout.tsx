import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { RailLink } from "@/components/admin/AdminShell";
import LiveUpdates from "@/components/LiveUpdates";
import { requireAdmin } from "@/lib/supabase/require-admin";
import "./admin.css";

async function AdminUser() {
  await connection(); // la validación de sesión usa Date.now(): render en cada request
  const { user, isSuper } = await requireAdmin();
  const email = user.email ?? "";
  return (
    <div className="user">
      <div className="avatar">{(email[0] ?? "A").toUpperCase()}</div>
      <div>
        <b>{isSuper ? "Super administrador" : "Administrador"}</b>
        <span>{email}</span>
      </div>
    </div>
  );
}

// Secciones que solo ve el super administrador.
async function SuperNav() {
  await connection();
  const { isSuper } = await requireAdmin();
  if (!isSuper) return null;
  return (
    <>
      <RailLink href="/admin/sucursales" label="Sucursales" icon="store" />
      <RailLink href="/admin/usuarios" label="Usuarios" icon="users" />
    </>
  );
}

// El layout es estático; todo lo que lee la sesión va dentro de <Suspense>.
// Cada página del panel vuelve a verificar con requireAdmin().
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell
      status={<LiveUpdates />}
      nav={
        <Suspense fallback={null}>
          <SuperNav />
        </Suspense>
      }
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
