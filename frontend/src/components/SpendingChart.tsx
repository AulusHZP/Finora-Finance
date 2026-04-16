import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const normalizeType = (type: unknown): "income" | "expense" => {
  const normalized = String(type || "").trim().toLowerCase();

  if (["income", "receita", "entrada", "credit", "credito", "crédito"].includes(normalized)) {
    return "income";
  }

  if (["expense", "despesa", "saida", "saída", "debit", "debito", "débito"].includes(normalized)) {
    return "expense";
  }

  // Keep compatibility with legacy values: anything not explicit income is treated as expense.
  return "expense";
};

const parseAmount = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsedByLocale = parseCurrencyInputBRL(value);
    if (parsedByLocale !== null) {
      return parsedByLocale;
    }

    const normalized = Number(value.replace(/,/g, "."));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  return 0;
};

const getLatestTransactionDate = (transactions: Transaction[]): Date => {
  if (transactions.length === 0) {
    return new Date();
  }

  return transactions.reduce((latest, tx) => {
    const txDate = new Date(tx.date);
    return txDate > latest ? txDate : latest;
  }, new Date(transactions[0].date));
};

const buildWeeklyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getLatestTransactionDate(transactions);
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    days.push(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() - i));
  }

  const expenseMap = new Map<string, number>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = new Date(tx.date);
    const key = dayKey(date);
    expenseMap.set(key, (expenseMap.get(key) || 0) + Math.abs(parseAmount(tx.amount)));
  });

  return days.map((day) => {
    const key = dayKey(day);
    return {
      name: day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      amount: expenseMap.get(key) || 0,
    };
  });
};

const buildMonthlyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getLatestTransactionDate(transactions);
  const months: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1));
  }

  const expenseMap = new Map<string, number>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = new Date(tx.date);
    const key = monthKey(date);
    expenseMap.set(key, (expenseMap.get(key) || 0) + Math.abs(parseAmount(tx.amount)));
  });

  return months.map((month) => {
    const key = monthKey(month);
    return {
      name: month.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      amount: expenseMap.get(key) || 0,
    };
  });
};

export function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const weeklyData = useMemo(() => buildWeeklyExpenseData(transactions), [transactions]);
  const monthlyData = useMemo(() => buildMonthlyExpenseData(transactions), [transactions]);
  const data = period === "weekly" ? weeklyData : monthlyData;
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Resumo de Gastos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {`${formatCurrencyBRL(total)} ${period === "weekly" ? "esta semana" : "este mês"}`}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-default ${
              period === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-default ${
              period === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Mês
          </button>
        </div>
      </div>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} dx={-8} tickFormatter={(v) => formatCurrencyBRL(Number(v))} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [formatCurrencyBRL(value), "Gasto"]}
            />
            <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
