import { Home, ArrowRightLeft, Target, Upload } from "lucide-react";
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
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0 shrink-0">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10">
            <img src="/logo.png" alt="Finora" className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">Finora</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Finanças</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 px-3 mt-4 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground text-sm transition-default hover:bg-hover"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-hover transition-default group"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-default">
            <span className="text-xs font-semibold text-primary">{initials || "US"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-default">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">Premium</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
