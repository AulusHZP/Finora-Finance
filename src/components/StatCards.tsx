import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";

const stats = [
  { label: "Income", amount: "$8,450.00", change: "+12.5%", icon: TrendingUp, color: "text-success", bg: "bg-success-light", changeColor: "text-success" },
  { label: "Expenses", amount: "$3,280.50", change: "+4.2%", icon: TrendingDown, color: "text-destructive", bg: "bg-error-light", changeColor: "text-destructive" },
  { label: "Remaining", amount: "$5,169.50", change: "", icon: Wallet, color: "text-primary", bg: "bg-primary/10", changeColor: "" },
  { label: "Fixed Costs", amount: "$1,840.00", change: "56% of expenses", icon: ArrowUpDown, color: "text-muted-foreground", bg: "bg-muted", changeColor: "text-muted-foreground" },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="glass-card p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <div className={`h-7 w-7 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">{s.amount}</p>
          {s.change && (
            <p className={`text-[11px] mt-1 ${s.changeColor}`}>{s.change}</p>
          )}
        </div>
      ))}
    </div>
  );
}
