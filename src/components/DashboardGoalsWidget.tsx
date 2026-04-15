import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
}

const mockGoals: Goal[] = [
  { id: "1", title: "New MacBook", current: 1200, target: 2500, emoji: "💻" },
  { id: "2", title: "Vacation Fund", current: 3400, target: 5000, emoji: "✈️" },
  { id: "3", title: "Emergency Fund", current: 8200, target: 10000, emoji: "🛡️" },
];

export function DashboardGoalsWidget() {
  const displayGoals = mockGoals.slice(0, 3);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-foreground">Objetivos</h3>
        <Link to="/goals" className="text-xs font-medium text-primary hover:opacity-80 transition-default">
          Ver tudo →
        </Link>
      </div>

      <div className="space-y-2.5 mb-3.5">
        {displayGoals.map((goal) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.id} className="p-2.5 bg-muted/50 rounded-lg hover:bg-muted/80 transition-default cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{goal.emoji}</span>
                  <span className="text-xs font-medium text-foreground truncate">{goal.title}</span>
                </div>
                <span className="text-xs font-semibold text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/goals"
        className="w-full h-8 flex items-center justify-center gap-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-default"
      >
        <Plus className="h-3.5 w-3.5" />
        Criar Objetivo
      </Link>
    </div>
  );
}
