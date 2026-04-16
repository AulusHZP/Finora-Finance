import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

const FIXED_COST_REGEX = /(aluguel|moradia|energia|água|agua|internet|assinatura|condomínio|condominio|conta|seguro|plano)/i;

export function StatCards({ transactions }: { transactions: Transaction[] }) {
  let incomeTotal = 0;
  let expenseTotal = 0;
  let fixedCostsTotal = 0;

  transactions.forEach((tx) => {
    const amount = Math.abs(Number(tx.amount) || 0);
    const isExpense = tx.type === "expense";
    const isIncome = tx.type === "income";

    if (isIncome) {
      incomeTotal += amount;
    }

    if (isExpense) {
      expenseTotal += amount;

      const searchableText = `${tx.title} ${tx.category}`;
      const isTaggedFixed = Boolean(tx.isFixed);
      if (isTaggedFixed || FIXED_COST_REGEX.test(searchableText)) {
        fixedCostsTotal += amount;
      }
    }
  });

  const availableTotal = incomeTotal - expenseTotal;
  const fixedCostsRatio = expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0;
  const expenseOfIncomeRatio = incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0;

  const stats = [
    {
      label: "Receita",
      amount: incomeTotal,
      change: "",
      icon: TrendingUp,
      color: "text-success",
      amountColor: "text-success",
      bg: "bg-success-light",
      changeColor: "text-success"
    },
    {
      label: "Despesas",
      amount: expenseTotal,
      change: incomeTotal > 0 ? `${expenseOfIncomeRatio}% da receita` : "Sem receita",
      icon: TrendingDown,
      color: "text-destructive",
      amountColor: "text-destructive",
      bg: "bg-error-light",
      changeColor: "text-destructive"
    },
    {
      label: "Disponível",
      amount: availableTotal,
      change: "",
      icon: Wallet,
      color: "text-primary",
      amountColor: "text-foreground",
      bg: "bg-primary/10",
      changeColor: ""
    },
    {
      label: "Custos Fixos",
      amount: fixedCostsTotal,
      change: expenseTotal > 0 ? `${fixedCostsRatio}% das despesas` : "Sem despesas",
      icon: ArrowUpDown,
      color: "text-muted-foreground",
      amountColor: "text-foreground",
      bg: "bg-muted",
      changeColor: "text-muted-foreground"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="glass-card p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <div className={`h-7 w-7 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
          </div>
          <p className={`text-xl lg:text-2xl font-semibold tracking-tight ${s.amountColor}`}>{formatCurrencyBRL(s.amount)}</p>
          {s.change && (
            <p className={`text-[11px] mt-1 ${s.changeColor}`}>{s.change}</p>
          )}
        </div>
      ))}
    </div>
  );
}
