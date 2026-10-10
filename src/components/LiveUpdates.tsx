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
        .on("postgres_changes", { event: "*", schema: "public", table: "quejas_sugerencias" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "resenas_meseros" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "resenas_lugar" }, refresh)
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

  return (
    <span role="status" data-s={status} title="Los reportes nuevos aparecen solos, sin recargar la página" className="live">
      <i />
      {label}
    </span>
  );
}
