"use client";

import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
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
  { href: "/admin/quejas", label: "Quejas y sugerencias", icon: "chat" },
];

const EXTRA: Item[] = [
  { href: "/admin/graficas", label: "Gráficas", icon: "chart" },
  { href: "/admin/qr", label: "Código QR", icon: "qr" },
];

const RailOpen = createContext(false);

// Enlace de la barra lateral con el relevo animado del fondo activo. También lo usan las secciones que solo ve el super administrador.
export function RailLink({ href, label, icon }: Item) {
  const pathname = usePathname();
  const open = useContext(RailOpen);
  const on = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <Link href={href} className="ibtn" aria-label={label} title={open ? undefined : label} aria-current={on ? "page" : undefined}>
      {on && <motion.span layoutId="rail-pill" className="pillbg" transition={SPRING} />}
      <span className="ico lab">
        <Icon name={icon} />
      </span>
      <span className="txt lab">{label}</span>
    </Link>
  );
}

const THEME_KEY = "adm-theme";
const RAIL_KEY = "adm-rail-open";
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

const railListeners = new Set<() => void>();
const subscribeRail = (cb: () => void) => {
  railListeners.add(cb);
  return () => void railListeners.delete(cb);
};
const readRail = () => {
  try {
    return localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
};

export default function AdminShell({ children, status, user, nav }: { children: ReactNode; status: ReactNode; user: ReactNode; nav: ReactNode }) {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  // La barra lateral arranca compacta (solo iconos); el botón de arriba la despliega con nombres y se recuerda la elección.
  const open = useSyncExternalStore(subscribeRail, readRail, () => false);
  const toggleRail = () => {
    try {
      localStorage.setItem(RAIL_KEY, open ? "0" : "1");
    } catch {}
    railListeners.forEach((l) => l());
  };

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

  return (
    <MotionConfig reducedMotion="user">
      <RailOpen.Provider value={open}>
      <div className="adm" ref={root}>
        <div className="shell">
          <div className="shell-body">
            <aside className="rail" data-open={open} aria-label="Navegación">
              <Link href="/admin" className="rail-brand" title={open ? undefined : "Ilusion Bowl"}>
                <span className="ico">
                  <Image src="/logo-ilusion-bowl.png" alt="" width={30} height={33} priority />
                </span>
                <span className="txt">
                  <b>Ilusion Bowl</b>
                  <small>Panel de administración</small>
                </span>
              </Link>

              <button
                type="button"
                className="ibtn toggle"
                aria-expanded={open}
                aria-label={open ? "Contraer menú" : "Expandir menú"}
                title={open ? undefined : "Expandir menú"}
                onClick={toggleRail}
              >
                <span className="ico">
                  <Icon name={open ? "left" : "menu"} />
                </span>
                <span className="txt">Contraer menú</span>
              </button>

              <div className="mid">
                {[...MAIN, ...EXTRA].map((i) => (
                  <RailLink key={i.href} {...i} />
                ))}
                {nav}
              </div>

              <div className="rail-foot">
                {status}
                {user}
                <button
                  type="button"
                  className="ibtn theme-btn"
                  aria-label="Cambiar entre tema claro y oscuro"
                  title={open ? undefined : "Cambiar tema"}
                  onClick={toggleTheme}
                >
                  <span className="ico">
                    <span className="sun">
                      <Icon name="sun" />
                    </span>
                    <span className="moon">
                      <Icon name="moon" />
                    </span>
                  </span>
                  <span className="txt">Cambiar tema</span>
                </button>
                <form action={logout}>
                  <button type="submit" className="ibtn" aria-label="Cerrar sesión" title={open ? undefined : "Cerrar sesión"}>
                    <span className="ico">
                      <Icon name="out" />
                    </span>
                    <span className="txt">Cerrar sesión</span>
                  </button>
                </form>
              </div>
              <div className="rail-credit" title="Servicio brindado por NioCat">
                <span className="ico">
                  <Image src="/logo-niocat.png" alt="" width={24} height={23} />
                </span>
                <span className="txt">
                  <small>Servicio brindado por</small>
                  <b>NioCat</b>
                </span>
              </div>
            </aside>

            <main className="main" ref={main}>
              {children}
            </main>
          </div>
        </div>
      </div>
      </RailOpen.Provider>
    </MotionConfig>
  );
}
