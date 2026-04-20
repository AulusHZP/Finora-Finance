import { formatCurrencyBRL } from "@/lib/currency";

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
}

export const allGoals: Goal[] = [
  { id: "1", title: "New MacBook", current: 1200, target: 2500, emoji: "💻" },
  { id: "2", title: "Vacation Fund", current: 3400, target: 5000, emoji: "✈️" },
  { id: "3", title: "Emergency Fund", current: 8200, target: 10000, emoji: "🛡️" },
  { id: "4", title: "New Car", current: 5000, target: 30000, emoji: "🚗" },
];

export function GoalCards({ limit }: { limit?: number }) {
  const items = limit ? allGoals.slice(0, limit) : allGoals;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((goal) => {
        const pct = Math.round((goal.current / goal.target) * 100);
        const remaining = goal.target - goal.current;

        return (
          <div key={goal.id} className="glass-card p-4 hover:shadow-md transition-default">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg flex-shrink-0">{goal.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatCurrencyBRL(goal.current)} de {formatCurrencyBRL(goal.target)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{formatCurrencyBRL(remaining)} faltam</p>
          </div>
        );
      })}
    </div>
  );
}
