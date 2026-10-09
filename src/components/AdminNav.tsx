"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Reportes" },
  { href: "/admin/graficas", label: "Gráficas" },
  { href: "/admin/sucursales", label: "Sucursales" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border-2 border-brand-ink px-4 py-2 text-sm font-bold text-brand-ink transition-colors ${
              active ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
