import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  await connection();
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (admin) redirect("/admin");
  }

  return (
    <LoginForm notice={error === "no-admin" ? "Esta cuenta no tiene permisos de administrador." : undefined} />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="adm login">
      <div className="login-shell">
        <main className="login-main">
          <Suspense fallback={<p className="sub">Cargando...</p>}>
            <Login searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
