interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
}

const goals: Goal[] = [
  { id: "1", title: "New MacBook", current: 1200, target: 2500, emoji: "💻" },
  { id: "2", title: "Vacation Fund", current: 3400, target: 5000, emoji: "✈️" },
  { id: "3", title: "Emergency Fund", current: 8200, target: 10000, emoji: "🛡️" },
  { id: "4", title: "New Car", current: 5000, target: 30000, emoji: "🚗" },
];

export function GoalCards({ limit }: { limit?: number }) {
  const items = limit ? goals.slice(0, limit) : goals;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((goal) => {
        const pct = Math.round((goal.current / goal.target) * 100);
        const remaining = goal.target - goal.current;

        return (
          <div key={goal.id} className="glass-card p-4 press-scale cursor-pointer hover:shadow-md transition-default">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{goal.emoji}</span>
                <p className="text-sm font-medium text-foreground">{goal.title}</p>
              </div>
              <span className="text-xs font-semibold text-primary">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                ${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                ${remaining.toLocaleString()} left
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
