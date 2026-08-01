import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  Home,
  ArrowRightLeft,
  Target,
  ShieldCheck,
  Tag,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Início", end: true },
  { to: "/transactions", icon: ArrowRightLeft, label: "Transações", end: false },
  { to: "/goals", icon: Target, label: "Metas", end: false },
  { to: "/limits", icon: ShieldCheck, label: "Limites", end: false },
  { to: "/categories", icon: Tag, label: "Categorias", end: false },
] as const;

// ─── Hook: resolve which NAV_ITEMS index is active ───────────────────────────

function useActiveIndex() {
  const { pathname } = useLocation();
  return NAV_ITEMS.findIndex((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  );
}

// ─── Desktop sliding pill ─────────────────────────────────────────────────────

function SlidingPill({ navRef }: { navRef: React.RefObject<HTMLElement> }) {
  const activeIndex = useActiveIndex();
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const isFirstRender = useRef(true);

  const updatePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const items = nav.querySelectorAll<HTMLElement>("[data-navitem]");
    const el = items[activeIndex];
    if (!el) return;

    setPillStyle({
      opacity: 1,
      width: `${el.offsetWidth}px`,
      transform: `translateX(${el.offsetLeft}px)`,
      transition: isFirstRender.current
        ? "none"
        : "transform 300ms cubic-bezier(0.34,1.56,0.64,1), width 200ms ease",
    });

    isFirstRender.current = false;
  }, [activeIndex, navRef]);

  useEffect(() => { updatePill(); }, [updatePill]);

  useEffect(() => {
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  return (
    <span
      aria-hidden
      className="absolute inset-y-1 left-0 rounded-full bg-white/25 shadow-sm ring-1 ring-white/30"
      style={pillStyle}
    />
  );
}

// ─── Mobile slide-in drawer ───────────────────────────────────────────────────

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-all duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-64 flex flex-col gap-2 p-6",
          "bg-white/15 dark:bg-slate-900/60 backdrop-blur-2xl",
          "border-l border-white/20 shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="self-end p-2 rounded-full hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-300 mb-2"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo + app name */}
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="text-base font-bold text-slate-800 dark:text-white">Finora</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {NAV_ITEMS.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/15"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </RouterNavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FloatingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  return (
    <>
      {/* ── Desktop / Tablet floating bar (≥ sm) ─────────────────────────── */}
      <header className="fixed top-5 inset-x-0 z-50 hidden sm:flex justify-center px-5 pointer-events-none">
        <div className="flex items-center gap-2.5 w-full max-w-4xl pointer-events-auto">

          {/* Logo pill */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/10 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              F
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight select-none">
              Finora
            </span>
          </div>

          {/* Nav pill */}
          <nav
            ref={navRef}
            className="relative flex items-center gap-0.5 flex-1 px-2 py-2 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/10"
          >
            <SlidingPill navRef={navRef as React.RefObject<HTMLElement>} />

            {NAV_ITEMS.map((item) => (
              <RouterNavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-navitem="true"
                className={({ isActive }) =>
                  cn(
                    "relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-200 whitespace-nowrap select-none",
                    isActive
                      ? "text-slate-800 dark:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </RouterNavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Mobile top bar (< sm) ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 flex sm:hidden items-center justify-between px-5 h-14 bg-white/15 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
            Finora
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu de navegação"
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-300"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
