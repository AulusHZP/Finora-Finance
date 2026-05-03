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
      title: "Maior Categoria",
      message: `${topCategory[0]} lidera seus gastos (${formatCurrencyBRL(topCategory[1])}).`,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      cardColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
    });
  }

  if (highestExpense) {
    insights.push({
      id: "highest-expense",
      icon: Receipt,
      title: "Maior Gasto",
      message: `${highestExpense.title}: ${formatCurrencyBRL(highestExpense.absAmount)}.`,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      cardColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
    });
  }

  if (previousExpenses > 0) {
    const pct = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    const increase = pct > 0;
    insights.push({
      id: "expense-trend",
      icon: increase ? AlertCircle : TrendingUp,
      title: increase ? "Cuidado com os Gastos" : "Gastos Reduzidos",
      message: increase
        ? `Despesas subiram ${pct.toFixed(1)}% este mês.`
        : `Despesas caíram ${Math.abs(pct).toFixed(1)}% este mês. Ritmo excelente!`,
      color: increase ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bgColor: increase ? "bg-rose-100 dark:bg-rose-900/50" : "bg-emerald-100 dark:bg-emerald-900/50",
      cardColor: increase ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
    });
  }

  if (topGoal && topGoal.progress >= 40) {
    insights.push({
      id: "goal-progress",
      icon: Target,
      title: "Bom Progresso",
      message: `Você já atingiu ${Math.round(topGoal.progress)}% da meta ${topGoal.title}.`,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
      cardColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "starter",
      icon: TrendingUp,
      title: "Sem dados suficientes",
      message: "Adicione mais transações para receber insights.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/50",
      cardColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
    });
  }

  const displayInsights = insights.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 h-full justify-between">
      {displayInsights.map((insight) => {
        const IconComponent = insight.icon;
        return (
          <div key={insight.id} className={`border rounded-3xl p-5 flex gap-4 items-start shadow-sm transition-all hover:shadow-md ${insight.cardColor}`}>
            <div className={`${insight.bgColor} p-2.5 rounded-2xl shrink-0 ${insight.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{insight.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{insight.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
