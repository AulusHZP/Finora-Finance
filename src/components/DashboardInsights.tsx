import { AlertCircle, TrendingUp, Lightbulb, Target } from "lucide-react";

const insights = [
  {
    id: 1,
    type: "warning",
    icon: AlertCircle,
    title: "Alerta de Gastos",
    message: "Seus gastos com alimentação estão 23% acima do mês passado.",
    color: "text-destructive",
    bgColor: "bg-destructive/5",
  },
  {
    id: 2,
    type: "positive",
    icon: TrendingUp,
    title: "Bom Progresso",
    message: "Você já atingiu 45% de sua meta de viagem! 🎉",
    color: "text-success",
    bgColor: "bg-success-light/20",
  },
  {
    id: 3,
    type: "suggestion",
    icon: Lightbulb,
    title: "Dica",
    message: "Prepare suas refeições em casa e economize ~$120/mês.",
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
];

export function DashboardInsights() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Insights</h3>

      <div className="space-y-2.5">
        {insights.map((insight) => {
          const IconComponent = insight.icon;
          return (
            <div key={insight.id} className={`p-3 rounded-lg ${insight.bgColor} border border-border/50`}>
              <div className="flex items-start gap-2.5">
                <IconComponent className={`h-4 w-4 ${insight.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground mb-0.5">{insight.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
