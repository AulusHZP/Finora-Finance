import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

// Parse a transaction date string (ISO) into its UTC calendar parts to avoid timezone shift
const parseTxDate = (dateStr: string) => {
  // Dates are stored as ISO strings (e.g. "2026-05-01T12:00:00.000Z")
  // We extract YYYY-MM-DD and use UTC to avoid local timezone shifting the day
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const dayKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
const monthKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

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
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  return transactions.reduce((latest, tx) => {
    const txDate = parseTxDate(tx.date);
    return txDate > latest ? txDate : latest;
  }, parseTxDate(transactions[0].date));
};

const buildWeeklyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getLatestTransactionDate(transactions);
  const days: Date[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    days.push(new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() - i)));
  }

  const expenseMap = new Map<string, number>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = parseTxDate(tx.date);
    const key = dayKey(date);
    expenseMap.set(key, (expenseMap.get(key) || 0) + Math.abs(parseAmount(tx.amount)));
  });

  return days.map((day) => {
    const key = dayKey(day);
    return {
      name: day.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", ""),
      amount: expenseMap.get(key) || 0,
    };
  });
};

const buildMonthlyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getLatestTransactionDate(transactions);
  const months: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1)));
  }

  const expenseMap = new Map<string, number>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = parseTxDate(tx.date);
    const key = monthKey(date);
    expenseMap.set(key, (expenseMap.get(key) || 0) + Math.abs(parseAmount(tx.amount)));
  });

  return months.map((month) => {
    const key = monthKey(month);
    return {
      name: month.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
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
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col h-full ring-1 ring-black/5 dark:ring-white/5 group transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Resumo de Gastos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Evolução do seu saldo - {period === "weekly" ? "esta semana" : "este mês"}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mês
          </button>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
              formatter={(value: number) => [formatCurrencyBRL(value), "Gasto"]}
            />
            <Bar 
              dataKey="amount" 
              radius={[6, 6, 6, 6]}
              maxBarSize={45}
              isAnimationActive={true}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.amount === maxAmount && entry.amount > 0 ? "#3b82f6" : "hsl(var(--primary) / 0.3)"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
