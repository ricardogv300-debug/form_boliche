"use client";

import { useTransition } from "react";
import { deleteReport } from "@/app/admin/actions";

export default function DeleteReportButton({ id, who }: { id: string; who: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(`¿Borrar el reporte de ${who}? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await deleteReport(id);
      if (result.error) alert(result.error);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Borrar el reporte de ${who}`}
      className="rounded-lg border-2 border-brand-ink bg-white px-2.5 py-1 text-xs font-bold text-brand-red-dark transition-colors hover:bg-brand-red hover:text-brand-cream disabled:opacity-50"
    >
      {pending ? "..." : "Borrar"}
    </button>
  );
}
