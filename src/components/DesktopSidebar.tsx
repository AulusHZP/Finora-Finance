import { Home, ArrowRightLeft, Target, CreditCard } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/transactions", icon: ArrowRightLeft, label: "Transactions" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/cards", icon: CreditCard, label: "Cards" },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 p-6">
      <div className="mb-10">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Finora</h1>
        <p className="text-xs text-muted-foreground mt-1">Personal Finance</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-default hover:bg-hover"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">JD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
