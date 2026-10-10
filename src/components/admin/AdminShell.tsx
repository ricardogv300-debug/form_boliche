"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import Icon, { type IconName } from "./Icon";

type Item = { href: string; label: string; icon: IconName };

const MAIN: Item[] = [
  { href: "/admin", label: "Resumen", icon: "grid" },
  { href: "/admin/pistas", label: "Pistas", icon: "pin" },
  { href: "/admin/resenas", label: "Reseñas", icon: "star" },
  { href: "/admin/meseros", label: "Meseros", icon: "user" },
  { href: "/admin/comida", label: "Comida", icon: "food" },
  { href: "/admin/quejas", label: "Quejas y sugerencias", icon: "chat" },
];

const EXTRA: Item[] = [
  { href: "/admin/graficas", label: "Gráficas", icon: "chart" },
  { href: "/admin/sucursales", label: "Sucursales", icon: "store" },
  { href: "/admin/qr", label: "Código QR", icon: "qr" },
];

const THEME_KEY = "adm-theme";
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

export default function AdminShell({ children, status, user }: { children: ReactNode; status: ReactNode; user: ReactNode }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);

  // Tema: sin elección guardada se sigue al sistema (lo resuelve el CSS); al elegir uno se recuerda en este navegador.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") root.current?.setAttribute("data-theme", saved);
    } catch {}
  }, []);

  // Al cambiar de sección, el contenido vuelve arriba (el que se desplaza es <main>, no la ventana).
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [pathname]);

  // Un solo botón alterna entre claro y oscuro. El nuevo tema "se expande" como un círculo desde el botón
  // (View Transitions); en navegadores sin esa función, o con movimiento reducido, hace un fundido de colores.
  const toggleTheme = (e: MouseEvent<HTMLButtonElement>) => {
    const el = root.current;
    if (!el) return;
    const current = el.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    const apply = () => {
      el.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
    };

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !document.startViewTransition) {
      el.classList.add("theming");
      apply();
      setTimeout(() => el.classList.remove("theming"), 600);
      return;
    }

    const box = e.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const html = document.documentElement;
    html.classList.add("adm-theming");
    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      html.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.65,0,.25,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
    transition.finished.finally(() => html.classList.remove("adm-theming"));
  };

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <MotionConfig reducedMotion="user">
      <div className="adm" ref={root}>
        <div className="shell">
          <div className="top">
            <Link href="/admin" className="brand">
              <Image src="/logo-ilusion-bowl.png" alt="" width={40} height={44} priority />
              <div>
                Ilusion Bowl
                <small>Panel de administración</small>
              </div>
            </Link>
            <nav className="nav" aria-label="Secciones">
              <div className="nav-in">
                {MAIN.map((i) => {
                  const on = isActive(i.href);
                  return (
                    <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}>
                      {on && <motion.span layoutId="nav-pill" className="pillbg" transition={SPRING} />}
                      <span className="lab">{i.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="tools">
              {status}
              {user}
            </div>
          </div>

          <div className="shell-body">
            <aside className="rail" aria-label="Accesos">
              <div className="grp">
                <button
                  type="button"
                  className="ibtn theme-btn"
                  aria-label="Cambiar entre tema claro y oscuro"
                  title="Cambiar tema"
                  onClick={toggleTheme}
                >
                  <span className="sun">
                    <Icon name="sun" />
                  </span>
                  <span className="moon">
                    <Icon name="moon" />
                  </span>
                </button>
              </div>
              <div className="mid">
                <div className="grp">
                  {[...MAIN, ...EXTRA].map((i) => {
                    const on = isActive(i.href);
                    return (
                      <Link key={i.href} href={i.href} className="ibtn" aria-label={i.label} title={i.label} aria-current={on ? "page" : undefined}>
                        {on && <motion.span layoutId="rail-pill" className="pillbg" transition={SPRING} />}
                        <span className="lab">
                          <Icon name={i.icon} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <form action={logout} className="grp">
                <button type="submit" className="ibtn" aria-label="Cerrar sesión" title="Cerrar sesión">
                  <Icon name="out" />
                </button>
              </form>
            </aside>

            <main className="main" ref={main}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
