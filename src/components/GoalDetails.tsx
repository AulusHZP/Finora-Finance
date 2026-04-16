import { useState } from "react";
import type { Goal } from "@/hooks/useGoals";
import { ChevronRight } from "lucide-react";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";

interface GoalDetailsProps {
  goal: Goal | null;
  onAddContribution: (amount: number) => void;
}

export function GoalDetails({ goal, onAddContribution }: GoalDetailsProps) {
  const [contributionAmount, setContributionAmount] = useState("");
  const parsedContribution = parseCurrencyInputBRL(contributionAmount);

  if (!goal) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-muted-foreground text-sm">Selecione um objetivo para ver detalhes</p>
        </div>
      </div>
    );
  }

  const pct = Math.round((goal.current / goal.target) * 100);
  const remaining = goal.target - goal.current;
  const priorityColor = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-primary/10 text-primary",
    low: "bg-success-light text-success",
  };

  const handleAddContribution = () => {
    if (parsedContribution !== null && parsedContribution > 0) {
      onAddContribution(parsedContribution);
      setContributionAmount("");
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <span className="text-4xl">{goal.emoji}</span>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{goal.title}</h2>
          {goal.priority && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColor[goal.priority]}`}>
                {goal.priority === "high" ? "Prioridade Alta" : goal.priority === "medium" ? "Prioridade Média" : "Prioridade Baixa"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Progress */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Progresso</span>
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-muted">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Economizado</p>
            <p className="font-bold text-foreground">{formatCurrencyBRL(goal.current)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Meta</p>
            <p className="font-bold text-foreground">{formatCurrencyBRL(goal.target)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Faltam</p>
            <p className="font-bold text-destructive">{formatCurrencyBRL(remaining)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {goal.targetDate && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Data Alvo</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(goal.targetDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
        )}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Economizado</p>
          <p className="text-sm font-semibold text-foreground">{pct}%</p>
        </div>
      </div>

      {/* Add Contribution */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/10">
        <p className="text-sm font-semibold text-foreground mb-3">Adicionar Contribuição</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm pointer-events-none">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="Insira o valor"
              className="w-full h-10 pl-11 pr-3 bg-card rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </div>
          <button
            onClick={handleAddContribution}
            disabled={parsedContribution === null || parsedContribution <= 0}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default disabled:opacity-50 flex items-center gap-1"
          >
            <span>Adicionar</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      {remaining <= 0 && (
        <div className="bg-success-light/20 border border-success/30 rounded-lg p-3 text-center">
          <p className="text-sm font-semibold text-success">🎉 Objetivo Concluído!</p>
        </div>
      )}
    </div>
  );
}
