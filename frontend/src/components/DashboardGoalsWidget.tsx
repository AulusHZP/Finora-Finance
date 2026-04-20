import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Goal } from "@/services/api";

export function DashboardGoalsWidget({ goals }: { goals: Goal[] }) {
  const displayGoals = goals.slice(0, 3);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-foreground">Objetivos</h3>
        <Link to="/goals" className="text-xs font-medium text-primary hover:opacity-80 transition-default">
          Ver tudo →
        </Link>
      </div>

      <div className="space-y-2.5 mb-3.5">
        {displayGoals.length === 0 && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground">Você ainda não possui objetivos. Crie o primeiro para acompanhar seu progresso.</p>
          </div>
        )}
        {displayGoals.map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div key={goal.id} className="p-2.5 bg-muted/50 rounded-lg hover:bg-muted/80 transition-default cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{goal.emoji}</span>
                  <span className="text-xs font-medium text-foreground truncate">{goal.title}</span>
                </div>
                <span className="text-xs font-semibold text-primary flex-shrink-0">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                {formatCurrencyBRL(goal.current)} / {formatCurrencyBRL(goal.target)}
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
