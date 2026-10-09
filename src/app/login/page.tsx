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
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="font-bold text-brand-cream">Cargando...</p>}>
        <Login searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
