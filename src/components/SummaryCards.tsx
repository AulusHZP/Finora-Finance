import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

const cards = [
  { label: "Income", amount: "$8,450.00", icon: TrendingUp, color: "text-success", bg: "bg-success-light" },
  { label: "Expenses", amount: "$3,280.50", icon: TrendingDown, color: "text-destructive", bg: "bg-error-light" },
  { label: "Remaining", amount: "$5,169.50", icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
];

export function SummaryCards() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {cards.map((card) => (
        <div key={card.label} className="glass-card p-4 min-w-[160px] flex-1">
          <div className={`h-8 w-8 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{card.label}</p>
          <p className="text-lg font-semibold text-foreground">{card.amount}</p>
        </div>
      ))}
    </div>
  );
}
