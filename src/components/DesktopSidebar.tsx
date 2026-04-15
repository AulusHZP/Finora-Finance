import { Home, ArrowRightLeft, Target, Upload, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/import", icon: Upload, label: "Import CSV" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0 shrink-0">
      <div className="p-6 pb-2">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Finora</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Personal Finance</p>
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
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">JD</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-[11px] text-muted-foreground">Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
