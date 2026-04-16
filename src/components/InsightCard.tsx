import { Lightbulb } from "lucide-react";

export function InsightCard() {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Spending Insight</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Seus gastos com alimentação estão 23% acima do mês passado. Considere preparar refeições em casa para economizar cerca de R$ 120/mês.
        </p>
      </div>
    </div>
  );
}
