import { AlertCircle, TrendingUp, Lightbulb, Target, Receipt } from "lucide-react";
import type { Goal, Transaction } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

const parseTxDate = (dateStr: string) => {
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

const getLatestTransactionDate = (transactions: Transaction[]): Date => {
  if (transactions.length === 0) {
    return new Date();
  }

  return transactions.reduce((latest, tx) => {
    const txDate = parseTxDate(tx.date);
    return txDate > latest ? txDate : latest;
  }, parseTxDate(transactions[0].date));
};

export function DashboardInsights({ transactions, goals }: { transactions: Transaction[]; goals: Goal[] }) {
  const expenseTransactions = transactions.filter((tx) => tx.type === "expense");
  const latestExpenseDate = getLatestTransactionDate(expenseTransactions);
  const currentMonthKey = monthKey(latestExpenseDate);
  const prevMonthDate = new Date(Date.UTC(latestExpenseDate.getUTCFullYear(), latestExpenseDate.getUTCMonth() - 1, 1));
  const previousMonthKey = monthKey(prevMonthDate);

  const currentExpenses = expenseTransactions
    .filter((tx) => monthKey(parseTxDate(tx.date)) === currentMonthKey)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  const previousExpenses = expenseTransactions
    .filter((tx) => monthKey(parseTxDate(tx.date)) === previousMonthKey)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

  const expenseByCategory: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    if (monthKey(parseTxDate(tx.date)) !== currentMonthKey) {
      return;
    }
    expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + Math.abs(Number(tx.amount) || 0);
  });

  const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const highestExpense = expenseTransactions
    .map((tx) => ({ ...tx, absAmount: Math.abs(Number(tx.amount) || 0) }))
    .sort((a, b) => b.absAmount - a.absAmount)[0];
  const topGoal = goals
    .map((goal) => ({
      ...goal,
      progress: goal.target > 0 ? (goal.current / goal.target) * 100 : 0,
    }))
    .sort((a, b) => b.progress - a.progress)[0];

  const insights = [];

  if (topCategory) {
    insights.push({
      id: "top-category",
      icon: Lightbulb,
      title: "Maior Categoria de Gasto",
      message: `${topCategory[0]} lidera seus gastos no período (${formatCurrencyBRL(topCategory[1])}).`,
      color: "text-primary",
      bgColor: "bg-primary/5",
    });
  }

  if (highestExpense) {
    insights.push({
      id: "highest-expense",
      icon: Receipt,
      title: "Maior Gasto Registrado",
      message: `${highestExpense.title}: ${formatCurrencyBRL(highestExpense.absAmount)}.`,
      color: "text-muted-foreground",
      bgColor: "bg-muted/60",
    });
  }

  if (previousExpenses > 0) {
    const pct = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    const increase = pct > 0;
    insights.push({
      id: "expense-trend",
      icon: increase ? AlertCircle : TrendingUp,
      title: increase ? "Alerta de Gastos" : "Evolução de Gastos",
      message: increase
        ? `As despesas subiram ${pct.toFixed(1)}% em relação ao mês anterior.`
        : `As despesas caíram ${Math.abs(pct).toFixed(1)}% em relação ao mês anterior.`,
      color: increase ? "text-destructive" : "text-success",
      bgColor: increase ? "bg-destructive/5" : "bg-success-light/20",
    });
  }

  if (topGoal && topGoal.progress >= 40) {
    insights.push({
      id: "goal-progress",
      icon: Target,
      title: "Bom Progresso",
      message: `Você já atingiu ${Math.round(topGoal.progress)}% da meta ${topGoal.title}.`,
      color: "text-success",
      bgColor: "bg-success-light/20",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "starter",
      icon: TrendingUp,
      title: "Sem dados suficientes",
      message: "Adicione mais transações para receber insights personalizados do seu comportamento financeiro.",
      color: "text-primary",
      bgColor: "bg-primary/5",
    });
  }

  const displayInsights = insights.slice(0, 3);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Insights</h3>

      <div className="space-y-2.5">
        {displayInsights.map((insight) => {
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
