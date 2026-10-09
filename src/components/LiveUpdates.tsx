"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "connecting" | "live" | "offline";

// Escucha los cambios de `reportes` y vuelve a pedir los datos de la página actual (tabla o gráficas).
export default function LiveUpdates() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const refresh = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300); // junta ráfagas de eventos
    };

    // Realtime necesita el token del usuario antes de suscribirse para que RLS deje pasar los eventos.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel("reportes-en-vivo")
        .on("postgres_changes", { event: "*", schema: "public", table: "reportes" }, refresh)
        .subscribe((s) => {
          if (cancelled) return;
          if (s === "SUBSCRIBED") setStatus("live");
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus("offline");
        });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const label = { connecting: "Conectando...", live: "En vivo", offline: "Sin conexión en vivo" }[status];
  const dot = { connecting: "bg-brand-yellow", live: "bg-green-600", offline: "bg-brand-red" }[status];

  return (
    <span
      role="status"
      title="Los reportes nuevos aparecen solos, sin recargar la página"
      className="inline-flex items-center gap-2 rounded-full border-2 border-brand-ink bg-white px-3 py-1.5 text-sm font-bold text-brand-ink"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot} ${status === "live" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
