import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Goal } from "@/services/api";

export function DashboardGoalsWidget({ goals }: { goals: Goal[] }) {
  const displayGoals = goals.slice(0, 3);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
        <h3 className="text-base font-bold text-foreground">Acompanhamento de Objetivos</h3>
        <Link to="/goals" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">
          Ver tudo →
        </Link>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        {displayGoals.length === 0 && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não possui objetivos.</p>
          </div>
        )}
        {displayGoals.map((goal) => {
          const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div key={goal.id} className="group p-3.5 bg-background border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300 hover:shadow-sm cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base flex-shrink-0 bg-muted h-8 w-8 rounded-full flex items-center justify-center">{goal.emoji}</span>
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{goal.title}</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">{pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] font-medium text-muted-foreground mt-2 flex justify-between">
                <span>{formatCurrencyBRL(goal.current)}</span>
                <span className="opacity-60">de {formatCurrencyBRL(goal.target)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/goals"
        className="w-full h-10 mt-auto flex items-center justify-center gap-2 bg-muted hover:bg-primary/10 text-foreground hover:text-primary rounded-xl text-sm font-semibold transition-all duration-300"
      >
        <Plus className="h-3.5 w-3.5" />
        Criar Objetivo
      </Link>
    </div>
  );
}
