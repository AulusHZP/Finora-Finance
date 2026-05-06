import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import { useMemo, useState, useCallback } from "react";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryDataItem {
  /** Nome da categoria */
  name: string;
  /** Valor total gasto nesta categoria */
  value: number;
  /** Cor em formato CSS (hex, hsl, etc.) */
  color: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseTxDate = (dateStr: string) => {
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const dayKey = (date: Date) =>
  `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

const normalizeType = (type: unknown): "income" | "expense" => {
  const normalized = String(type || "").trim().toLowerCase();
  if (
    ["income", "receita", "entrada", "credit", "credito", "crédito"].includes(
      normalized
    )
  )
    return "income";
  return "expense";
};

const parseAmount = (value: unknown): number => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsedByLocale = parseCurrencyInputBRL(value);
    if (parsedByLocale !== null) return parsedByLocale;
    const normalized = Number(value.replace(/,/g, "."));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
};

const getCurrentReferenceDate = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// ─── Chart data builders ──────────────────────────────────────────────────────

const buildWeeklyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getCurrentReferenceDate();
  const currentDayOfWeek = referenceDate.getUTCDay();
  const startOfWeek = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate() - currentDayOfWeek
    )
  );

  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    days.push(
      new Date(
        Date.UTC(
          startOfWeek.getUTCFullYear(),
          startOfWeek.getUTCMonth(),
          startOfWeek.getUTCDate() + i
        )
      )
    );
  }

  const expenseMap = new Map<
    string,
    { amount: number; transactions: Transaction[] }
  >();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") return;
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
      name: day
        .toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
        .replace(".", ""),
      amount: data.amount,
      transactions: data.transactions,
      dateStr: day.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
    };
  });
};

const buildMonthlyExpenseData = (transactions: Transaction[]) => {
  const referenceDate = getCurrentReferenceDate();
  const months: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(
      new Date(
        Date.UTC(
          referenceDate.getUTCFullYear(),
          referenceDate.getUTCMonth() - i,
          1
        )
      )
    );
  }

  const expenseMap = new Map<
    string,
    { amount: number; transactions: Transaction[] }
  >();
  transactions.forEach((tx) => {
    if (normalizeType(tx.type) !== "expense") return;
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
      name: month
        .toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })
        .replace(".", ""),
      amount: data.amount,
      transactions: data.transactions,
      dateStr: month.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
};

// ─── Paleta de azuis para categorias (fallback quando cor não vem na prop) ────

const BLUE_PALETTE = [
  "#1d4ed8", // blue-700
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#bfdbfe", // blue-200
  "#1e3a8a", // blue-900
  "#1e40af", // blue-800
];

// ─── Donut chart center label ─────────────────────────────────────────────────

const DonutCenterLabel = ({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) => (
  <>
    <text
      x={cx}
      y={cy - 10}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-muted-foreground"
      style={{ fontSize: 11, fontWeight: 500 }}
    >
      Total gasto
    </text>
    <text
      x={cx}
      y={cy + 10}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: 15, fontWeight: 700, fill: "hsl(var(--foreground))" }}
    >
      {formatCurrencyBRL(total)}
    </text>
  </>
);

// ─── Active shape for donut hover ─────────────────────────────────────────────

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.95}
      />
    </g>
  );
};

// ─── Donut Chart Tab ──────────────────────────────────────────────────────────

interface DonutChartProps {
  categoryData: CategoryDataItem[];
}

function DonutChart({ categoryData }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const dataWithColors = useMemo(
    () =>
      categoryData.map((item, i) => ({
        ...item,
        color: item.color || BLUE_PALETTE[i % BLUE_PALETTE.length],
      })),
    [categoryData]
  );

  const total = useMemo(
    () => dataWithColors.reduce((sum, item) => sum + item.value, 0),
    [dataWithColors]
  );

  const onMouseEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onMouseLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  if (dataWithColors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 opacity-30"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
        <p className="text-sm">Nenhuma despesa no período</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              isAnimationActive
              animationDuration={700}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CategoryDataItem & {
                    color: string;
                  };
                  const pct =
                    total > 0
                      ? ((item.value / total) * 100).toFixed(1)
                      : "0";
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-lg min-w-[170px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: item.color }}
                        />
                        <p className="font-semibold text-foreground text-sm">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrencyBRL(item.value)}
                        <span className="ml-2 text-xs text-primary font-medium">
                          ({pct}%)
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Center total label via SVG */}
            <text x={0} y={0}>
              {/* rendered below with a custom approach */}
            </text>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — overlaid absolutely */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-muted-foreground font-medium">
            Total gasto
          </span>
          <span className="text-base font-bold text-foreground mt-0.5">
            {formatCurrencyBRL(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
        {dataWithColors.map((item, i) => {
          const pct =
            total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-3 py-1.5 px-3 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-sm text-foreground font-medium truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                  {pct}%
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrencyBRL(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewTab = "evolution" | "categories";

interface SpendingChartProps {
  transactions: Transaction[];
  /** Dados de categorias pré-processados pelo componente pai */
  categoryData?: CategoryDataItem[];
}

export function SpendingChart({
  transactions,
  categoryData = [],
}: SpendingChartProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [activeTab, setActiveTab] = useState<ViewTab>("evolution");
  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    amount: number;
    transactions: Transaction[];
    name: string;
  } | null>(null);

  const weeklyData = useMemo(
    () => buildWeeklyExpenseData(transactions),
    [transactions]
  );
  const monthlyData = useMemo(
    () => buildMonthlyExpenseData(transactions),
    [transactions]
  );
  const data = period === "weekly" ? weeklyData : monthlyData;
  const maxAmount = Math.max(...data.map((d) => d.amount));

  // Limpa a seleção quando o período ou a aba muda
  useMemo(() => setSelectedDay(null), [period, activeTab]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg min-w-[180px]">
          <p className="font-semibold text-foreground mb-1">{pData.dateStr}</p>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Total: {formatCurrencyBRL(pData.amount)}
          </p>
          <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">
            CLIQUE PARA DETALHES
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col h-full ring-1 ring-black/5 dark:ring-white/5 group transition-all hover:shadow-md">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Resumo de Gastos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTab === "evolution"
              ? `Evolução do seu saldo — ${period === "weekly" ? "esta semana" : "últimos 6 meses"}`
              : "Gastos por categoria no período"}
          </p>
        </div>

        {/* View tab toggle */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab("evolution")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "evolution"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Evolução
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "categories"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Categorias
          </button>
        </div>
      </div>

      {/* ── Period selector (only on Evolution tab) ── */}
      {activeTab === "evolution" && (
        <div className="flex gap-1 bg-muted rounded-xl p-1 self-start mb-5">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "weekly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "monthly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mês
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {activeTab === "evolution" ? (
        <>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground))"
                  opacity={0.15}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 6, 6]}
                  maxBarSize={45}
                  isAnimationActive
                  animationDuration={800}
                  onClick={(d) => setSelectedDay(d as any)}
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

          {/* Selected day details */}
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
                    <div
                      key={i}
                      className="flex justify-between items-center bg-muted/40 p-3 rounded-xl hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground tracking-tight">
                          {tx.title || tx.category || "Sem título"}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase pt-0.5">
                          {tx.category}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-red-500/90 whitespace-nowrap">
                        - {formatCurrencyBRL(Math.abs(parseAmount(tx.amount)))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum gasto registrado neste período.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Categories tab */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <DonutChart categoryData={categoryData} />
        </div>
      )}
    </div>
  );
}
