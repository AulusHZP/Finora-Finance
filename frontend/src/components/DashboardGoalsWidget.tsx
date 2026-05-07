import { ChevronRight, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Goal } from "@/services/api";

export function DashboardGoalsWidget({ goals }: { goals: Goal[] }) {
  const displayGoals = goals.slice(0, 3);

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col h-full ring-1 ring-black/5 dark:ring-white/5 group-hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Objetivos</h2>
        <Link to="/goals" className="text-primary p-2 hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center">
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-5 mb-4 flex-1">
        {displayGoals.length === 0 && (
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não possui objetivos.</p>
          </div>
        )}
        {displayGoals.map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div key={goal.id}>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-base flex-shrink-0 bg-primary/10 text-primary h-10 w-10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrencyBRL(goal.current)} / {formatCurrencyBRL(goal.target)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">{pct}%</span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden mt-3">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
