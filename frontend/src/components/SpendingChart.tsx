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
  
  // Encontra o domingo da semana atual (0 = Domingo)
  const currentDayOfWeek = referenceDate.getUTCDay(); 
  const startOfWeek = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() - currentDayOfWeek));

  const days: Date[] = [];
  // Gera os 7 dias de domingo a sábado
  for (let i = 0; i < 7; i += 1) {
    days.push(new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + i)));
  }

  const expenseMap = new Map<string, { amount: number, transactions: Transaction[] }>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = parseTxDate(tx.date);
    const key = dayKey(date);
    
    const existing = expenseMap.get(key) || { amount: 0, transactions: [] };
    existing.amount += Math.abs(parseAmount(tx.amount));
    existing.transactions.push(tx);
    expenseMap.set(key, existing);
  });

  return days.map((day) => {
    const key = dayKey(day);
    const data = expenseMap.get(key) || { amount: 0, transactions: [] };
    return {
      name: day.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", ""),
      amount: data.amount,
      transactions: data.transactions,
      dateStr: day.toLocaleDateString("pt-BR", { timeZone: "UTC" })
    };
  });
};

const buildMonthlyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getLatestTransactionDate(transactions);
  const months: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1)));
  }

  const expenseMap = new Map<string, { amount: number, transactions: Transaction[] }>();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") {
      return;
    }

    const date = parseTxDate(tx.date);
    const key = monthKey(date);
    
    const existing = expenseMap.get(key) || { amount: 0, transactions: [] };
    existing.amount += Math.abs(parseAmount(tx.amount));
    existing.transactions.push(tx);
    expenseMap.set(key, existing);
  });

  return months.map((month) => {
    const key = monthKey(month);
    const data = expenseMap.get(key) || { amount: 0, transactions: [] };
    return {
      name: month.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
      amount: data.amount,
      transactions: data.transactions,
      dateStr: month.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    };
  });
};

export function SpendingChart({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [selectedDay, setSelectedDay] = useState<{ dateStr: string; amount: number; transactions: Transaction[]; name: string } | null>(null);

  const weeklyData = useMemo(() => buildWeeklyExpenseData(transactions), [transactions]);
  const monthlyData = useMemo(() => buildMonthlyExpenseData(transactions), [transactions]);
  const data = period === "weekly" ? weeklyData : monthlyData;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = Math.max(...data.map(d => d.amount));
  
  // Limpa a seleção quando o período muda
  useMemo(() => setSelectedDay(null), [period]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg min-w-[180px]">
          <p className="font-semibold text-foreground mb-1">{pData.dateStr}</p>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Total: {formatCurrencyBRL(pData.amount)}
          </p>
          <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">CLIQUE PARA DETALHES</p>
        </div>
      );
    }
    return null;
  };

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
              content={<CustomTooltip />}
            />
            <Bar 
              dataKey="amount" 
              radius={[6, 6, 6, 6]}
              maxBarSize={45}
              isAnimationActive={true}
              animationDuration={800}
              onClick={(data) => setSelectedDay(data as any)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    selectedDay?.name === entry.name 
                      ? "#2563eb"
                      : entry.amount === maxAmount && entry.amount > 0 
                        ? "#3b82f6" 
                        : "hsl(var(--primary) / 0.3)"
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedDay && (
        <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Gastos de {selectedDay.dateStr}
            </h3>
            <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-full">
              {formatCurrencyBRL(selectedDay.amount)}
            </span>
          </div>

          {selectedDay.transactions.length > 0 ? (
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
              {selectedDay.transactions.map((tx: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-muted/40 p-3 rounded-xl hover:bg-muted/60 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground tracking-tight">{tx.description || tx.category || "Sem descrição"}</span>
                    <span className="text-[11px] text-muted-foreground uppercase pt-0.5">{tx.category}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500/90 whitespace-nowrap">
                    - {formatCurrencyBRL(Math.abs(parseAmount(tx.amount)))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-muted/30 p-4 rounded-xl text-center">
               <p className="text-sm text-muted-foreground">Nenhum gasto registrado neste período.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
