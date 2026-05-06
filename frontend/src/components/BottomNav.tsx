import { Home, ArrowRightLeft, Target, Upload } from "lucide-react";
import { NavLink } from "@/components/NavLink";

// Only 4 core items — Settings is accessible via the FloatingNav profile chip
const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/transactions", icon: ArrowRightLeft, label: "Transações" },
  { to: "/goals", icon: Target, label: "Objetivos" },
  { to: "/import", icon: Upload, label: "Importar" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      {/* Glass pill bar */}
      <div className="mx-3 mb-3 flex items-center justify-around px-2 h-14 rounded-2xl bg-white/20 dark:bg-slate-900/50 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-500 dark:text-slate-400 transition-all duration-200"
            activeClassName="text-blue-600 dark:text-blue-400"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
