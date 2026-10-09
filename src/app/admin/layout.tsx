import { Suspense } from "react";
import { connection } from "next/server";
import { logout } from "@/app/login/actions";
import AdminNav from "@/components/AdminNav";
import LiveUpdates from "@/components/LiveUpdates";
import { requireAdmin } from "@/lib/supabase/require-admin";

async function AdminUser() {
  await connection(); // la validación de sesión usa Date.now(): render en cada request
  const { user } = await requireAdmin();
  return <span className="hidden text-sm font-medium text-neutral-700 sm:inline">{user.email}</span>;
}

// El layout es estático; todo lo que lee la sesión va dentro de <Suspense>.
// Cada página del panel vuelve a verificar con requireAdmin().
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 justify-center px-4 py-8">
      <div className="w-full max-w-6xl rounded-[32px] border-2 border-brand-ink bg-brand-cream p-5 shadow-[8px_8px_0_0_#1a0d0d] sm:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brand-ink pb-4">
          <AdminNav />
          <div className="flex items-center gap-3">
            <LiveUpdates />
            <Suspense fallback={null}>
              <AdminUser />
            </Suspense>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border-2 border-brand-ink bg-white px-4 py-2 text-sm font-bold text-brand-ink hover:bg-brand-red hover:text-brand-cream"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <div className="pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
