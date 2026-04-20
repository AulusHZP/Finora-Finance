import { Home, ArrowRightLeft, Target, Upload, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { getStoredUser } from "@/lib/auth";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/transactions", icon: ArrowRightLeft, label: "Transações" },
  { to: "/goals", icon: Target, label: "Objetivos" },
  { to: "/import", icon: Upload, label: "Importar CSV" },
];

export function DesktopSidebar() {
  const user = getStoredUser();
  const displayName = user?.name || "Usuario";
  const displayNameShort = displayName.split(" ")[0] || "Usuario";
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 shrink-0">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Finora" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg leading-none font-bold tracking-tight text-foreground">Finora</h1>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Controle Financeiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 px-3 mt-3 flex-1">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-muted-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/70 hover:text-foreground hover:border-border/70"
            activeClassName="bg-primary/12 text-primary border-primary/20 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]"
          >
            <span className="h-8 w-8 rounded-lg bg-muted/70 group-hover:bg-card flex items-center justify-center transition-colors">
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
            </span>
            <span className="tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-border/70 space-y-2.5">
        {/* Settings Link */}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/70 hover:text-foreground"
        >
          <span className="h-8 w-8 rounded-lg bg-muted/70 flex items-center justify-center">
            <Settings className="h-4 w-4 flex-shrink-0" />
          </span>
          <span>Configurações</span>
        </Link>

        {/* User Card */}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-muted border border-primary/25 hover:border-primary/40 transition-all duration-200"
        >
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm shadow-sm">
            {initials || "US"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-none font-bold tracking-tight text-foreground truncate">{displayNameShort}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Sua conta</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
