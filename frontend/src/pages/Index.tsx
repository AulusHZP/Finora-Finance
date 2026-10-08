import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { CategorySpendingChart } from "@/components/CategorySpendingChart";
import { ProgressBar } from "@/components/ProgressBar";
import { PeriodSelector } from "@/components/PeriodSelector";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { usePeriod } from "@/hooks/usePeriod";
import { dashboardAPI, type DashboardData, type CategoryBudgetSummary } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger" | "income";
}) {
  const iconColors = {
    default: "text-blue-500 bg-blue-50",
    warning: "text-amber-500 bg-amber-50",
    danger: "text-red-500 bg-red-50",
    income: "text-emerald-500 bg-emerald-50",
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColors[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function AlertCategoryCard({ cat, alertThreshold }: { cat: CategoryBudgetSummary; alertThreshold: number }) {
  const badgeClass =
    cat.status === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";
  const badgeLabel = cat.status === "danger" ? "Limite estourado" : "Perto do limite";

  return (
    <div
      className={`rounded-xl p-4 border ${
        cat.status === "danger" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: cat.categoryColor }}
          >
            {cat.categoryName[0]}
          </div>
          <span className="text-sm font-semibold text-foreground">{cat.categoryName}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeLabel}</span>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        {formatCurrencyBRL(cat.spent)} de {cat.limit !== null ? formatCurrencyBRL(cat.limit) : "—"}
      </div>

      <ProgressBar
        value={cat.usagePct ?? 0}
        status={cat.status}
        alertThreshold={alertThreshold}
        height={5}
      />
    </div>
  );
}

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { year, month, isCurrentMonth } = usePeriod();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await dashboardAPI.get(year, month));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // Re-load after adding a transaction
  const handleTransactionSaved = useCallback(() => load(), [load]);

  const today = new Date().getDate();

  return (
    <AppLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <PeriodSelector className="mt-1" />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova transação
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : data ? (
          <>
            <SummaryCard
              title="Total Gasto"
              value={formatCurrencyBRL(data.summary.totalSpent)}
              subtitle={data.summary.totalLimit ? `de ${formatCurrencyBRL(data.summary.totalLimit)}` : undefined}
              icon={TrendingDown}
              variant={data.summary.totalLimit && data.summary.totalSpent > data.summary.totalLimit ? "danger" : "default"}
            />
            <SummaryCard
              title="Limite Geral"
              value={data.summary.totalLimit ? formatCurrencyBRL(data.summary.totalLimit) : "Não definido"}
              icon={Wallet}
              variant="default"
            />
            <SummaryCard
              title="Disponível"
              value={data.summary.available !== null ? formatCurrencyBRL(data.summary.available) : "—"}
              subtitle={data.summary.available === null ? "Defina um limite geral" : undefined}
              icon={Wallet}
              variant={
                data.summary.available === null ? "default"
                : data.summary.available < 0 ? "danger"
                : data.summary.available < (data.summary.totalLimit ?? 0) * 0.2 ? "warning"
                : "default"
              }
            />
            <SummaryCard
              title="Receitas"
              value={formatCurrencyBRL(data.summary.totalIncome)}
              icon={TrendingUp}
              variant="income"
            />
          </>
        ) : null}
      </div>

      {/* ── General limit progress bar ── */}
      {!loading && data?.summary.totalLimit && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Consumo do limite geral</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyBRL(data.summary.totalSpent)} de {formatCurrencyBRL(data.summary.totalLimit)}
              </p>
            </div>
            {data.summary.totalLimit && data.summary.totalSpent / data.summary.totalLimit >= 0.8 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Perto do limite
              </span>
            )}
            {data.summary.totalLimit && data.summary.totalSpent >= data.summary.totalLimit && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Limite estourado
              </span>
            )}
          </div>
          <ProgressBar
            value={(data.summary.totalSpent / data.summary.totalLimit) * 100}
            height={8}
          />
        </div>
      )}

      {/* ── Alert categories ── */}
      {!loading && data && data.alertCategories.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">Categorias em alerta</p>
              <span className="text-xs text-muted-foreground">
                {data.alertCategories.length} categoria{data.alertCategories.length > 1 ? "s" : ""}
              </span>
            </div>
            <Link
              to="/limits"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Ver limites <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.alertCategories.map((cat) => (
              <AlertCategoryCard key={cat.categoryId} cat={cat} alertThreshold={80} />
            ))}
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Donut chart */}
        <div className="min-w-0 bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Gastos por categoria</p>
          <p className="text-xs text-muted-foreground mb-4">Total no mês</p>

          {loading ? (
            <Skeleton className="h-48" />
          ) : !data || data.donutData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum gasto registrado
            </div>
          ) : (
            <CategorySpendingChart key={`${year}-${month}`} data={data.donutData} />
          )}
        </div>

        {/* Line chart */}
        <div className="min-w-0 bg-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Evolução dos gastos</p>
          <p className="text-xs text-muted-foreground mb-4">Acumulado no mês, dia a dia</p>

          {loading ? (
            <Skeleton className="h-48" />
          ) : !data || data.lineData.every((d) => d.cumulative === 0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum gasto registrado
            </div>
          ) : (
            <ResponsiveContainer className="financial-chart" width="100%" height={260} minWidth={0}>
              <LineChart data={data.lineData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  ticks={[1, 7, 14, 21, new Date(year, month, 0).getDate()]}
                  minTickGap={20}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={66}
                  tickCount={5}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `R$ ${new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrencyBRL(v), "Acumulado"]}
                  labelFormatter={(l) => `Dia ${l}`}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "13px",
                    maxWidth: "220px",
                  }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  isAnimationActive={false}
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981" }}
                />
                {isCurrentMonth && <ReferenceLine x={today} stroke="#94a3b8" strokeDasharray="3 3" />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">Últimas transações</p>
          <Link
            to="/transactions"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data || data.recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma transação neste mês
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: tx.category.color }}
                >
                  {tx.category.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category.name} · {new Date(tx.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${
                    tx.category.isIncome ? "text-emerald-600" : "text-foreground"
                  }`}
                >
                  {tx.category.isIncome ? "+" : "–"}{formatCurrencyBRL(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleTransactionSaved}
      />
    </AppLayout>
  );
}
