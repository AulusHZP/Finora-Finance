import { useMemo } from "react";
import { AlertCircle, TrendingUp, TrendingDown, Target, Wallet, AlertTriangle, Info, CheckCircle } from "lucide-react";
import type { Goal, Transaction } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

const parseTxDate = (dateStr: string) => {
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

const getLatestTransactionDate = (transactions: Transaction[]): Date => {
  if (transactions.length === 0) return new Date();
  return transactions.reduce((latest, tx) => {
    const txDate = parseTxDate(tx.date);
    return txDate > latest ? txDate : latest;
  }, parseTxDate(transactions[0].date));
};

const FIXED_COST_REGEX = /(aluguel|moradia|energia|água|agua|internet|assinatura|condomínio|condominio|conta|seguro|plano)/i;

export function DashboardInsights({ transactions, goals }: { transactions: Transaction[]; goals: Goal[] }) {
  const insights = useMemo(() => {
    const generated = [];
    const latestDate = getLatestTransactionDate(transactions);
    const currentMonthKey = monthKey(latestDate);
    const prevMonthDate = new Date(Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth() - 1, 1));
    const previousMonthKey = monthKey(prevMonthDate);

    let currentIncome = 0;
    let currentExpense = 0;
    let currentFixedCost = 0;
    
    let previousExpense = 0;

    const currentExpenseByCategory: Record<string, number> = {};
    const previousExpenseByCategory: Record<string, number> = {};

    transactions.forEach((tx) => {
      const date = parseTxDate(tx.date);
      const mKey = monthKey(date);
      const amount = Math.abs(Number(tx.amount) || 0);
      const isExpense = tx.type === "expense";
      
      if (mKey === currentMonthKey) {
        if (!isExpense) {
          currentIncome += amount;
        } else {
          currentExpense += amount;
          currentExpenseByCategory[tx.category] = (currentExpenseByCategory[tx.category] || 0) + amount;
          const searchableText = `${tx.title} ${tx.category}`;
          if (tx.isFixed || FIXED_COST_REGEX.test(searchableText)) {
            currentFixedCost += amount;
          }
        }
      } else if (mKey === previousMonthKey) {
        if (isExpense) {
          previousExpense += amount;
          previousExpenseByCategory[tx.category] = (previousExpenseByCategory[tx.category] || 0) + amount;
        }
      }
    });

    // 1. Custos Fixos Insight
    if (currentIncome > 0 && currentFixedCost > 0) {
      const fixedRatio = (currentFixedCost / currentIncome) * 100;
      if (fixedRatio > 50) {
        generated.push({
          id: "fixed-cost-high",
          icon: AlertTriangle,
          title: "Atenção aos Custos Fixos",
          message: `Seus custos fixos comprometem ${Math.round(fixedRatio)}% da receita (acima do ideal de 50%).`,
          color: "text-rose-600 dark:text-rose-400",
          bgColor: "bg-rose-100 dark:bg-rose-900/50",
          cardColor: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50",
        });
      } else {
        generated.push({
          id: "fixed-cost-ok",
          icon: CheckCircle,
          title: "Custos Fixos Controlados",
          message: `Seus custos fixos estão em ${Math.round(fixedRatio)}% da receita (dentro do ideal de 50%).`,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
          cardColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
        });
      }
    }

    // 2. Metas (Projeção de conclusão)
    const availableToSave = currentIncome - currentExpense;
    const topGoal = goals
      .filter((g) => g.current < g.target)
      .sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];

    if (topGoal && availableToSave > 0) {
      const remaining = topGoal.target - topGoal.current;
      const monthsToAchieve = Math.ceil(remaining / availableToSave);
      
      generated.push({
        id: "goal-projection",
        icon: Target,
        title: "Projeção de Meta",
        message: `No ritmo atual, sua meta "${topGoal.title}" será atingida em ${monthsToAchieve} ${monthsToAchieve === 1 ? 'mês' : 'meses'}.`,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/50",
        cardColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
      });
    }

    // 3. Comparativo de Categoria
    let worstCategory = "";
    let worstIncreaseRatio = 0;
    
    Object.keys(currentExpenseByCategory).forEach(cat => {
      const curr = currentExpenseByCategory[cat];
      const prev = previousExpenseByCategory[cat] || 0;
      if (prev > 0) {
        const increaseRatio = (curr - prev) / prev;
        if (increaseRatio > worstIncreaseRatio && curr > 100) { // pelo menos 100 reais para ser relevante
          worstIncreaseRatio = increaseRatio;
          worstCategory = cat;
        }
      }
    });

    if (worstCategory && worstIncreaseRatio > 0.1) { // mais de 10% de aumento
      generated.push({
        id: "category-increase",
        icon: TrendingUp,
        title: "Aumento de Gasto",
        message: `Você gastou ${Math.round(worstIncreaseRatio * 100)}% a mais em ${worstCategory} que no mês passado.`,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/50",
        cardColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
      });
    }

    // 4. Saldo Disponível Restante Saudável
    if (availableToSave > 0 && generated.length < 3) {
      generated.push({
        id: "available-balance",
        icon: Wallet,
        title: "Saldo Livre",
        message: `Você ainda tem ${formatCurrencyBRL(availableToSave)} disponíveis sem comprometer o orçamento.`,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/50",
        cardColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
      });
    }

    // Fallback if no insights
    if (generated.length === 0) {
      generated.push({
        id: "starter",
        icon: Info,
        title: "Sem dados suficientes",
        message: "Continue adicionando transações para receber insights automáticos.",
        color: "text-slate-600 dark:text-slate-400",
        bgColor: "bg-slate-100 dark:bg-slate-900/50",
        cardColor: "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900/50",
      });
    }

    return generated.slice(0, 3);
  }, [transactions, goals]);

  return (
    <div className="flex flex-col gap-4">
      {insights.map((insight) => {
        const IconComponent = insight.icon;
        return (
          <div key={insight.id} className={`border rounded-2xl p-4 lg:p-5 flex gap-4 items-start shadow-sm transition-all hover:shadow-md ${insight.cardColor}`}>
            <div className={`${insight.bgColor} p-2.5 rounded-xl shrink-0 ${insight.color}`}>
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
