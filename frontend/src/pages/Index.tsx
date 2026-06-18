import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCards } from "@/components/StatCards";
import { SpendingChart, type CategoryDataItem } from "@/components/SpendingChart";
import { TransactionTable } from "@/components/TransactionTable";
import { DashboardGoalsWidget } from "@/components/DashboardGoalsWidget";
import { DashboardInsights } from "@/components/DashboardInsights";
import { PaymentMethodBreakdown } from "@/components/PaymentMethodBreakdown";
import { FAB } from "@/components/FAB";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/currency";
import { dashboardAPI, type DashboardData, type Transaction } from "@/services/api";

const DashboardSkeleton = () => (
  <div className="space-y-6 lg:space-y-8 pb-12 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-1 md:col-span-6 lg:col-span-5 h-[140px] bg-muted rounded-2xl" />
      <div className="col-span-1 md:col-span-6 lg:col-span-4 flex flex-col gap-4 lg:gap-5">
        <div className="flex-1 min-h-[80px] bg-muted rounded-2xl" />
        <div className="flex-1 min-h-[80px] bg-muted rounded-2xl" />
      </div>
      <div className="col-span-1 md:col-span-12 lg:col-span-3 h-[140px] bg-muted rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
      <div className="lg:col-span-8 h-[300px] bg-muted rounded-3xl" />
      <div className="lg:col-span-4 h-[300px] bg-muted rounded-3xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      <div className="lg:col-span-8 h-[400px] bg-muted rounded-3xl" />
      <div className="lg:col-span-4 flex flex-col gap-5 lg:gap-6">
        <div className="h-[250px] bg-muted rounded-3xl" />
        <div className="h-[150px] bg-muted rounded-3xl" />
      </div>
    </div>
  </div>
);

// Paleta de azuis para colorir categorias automaticamente
const CATEGORY_PALETTE = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#1e3a8a",
  "#1e40af",
];

const normalizeTransactionType = (type: unknown): "income" | "expense" => {
  const v = String(type || "").trim().toLowerCase();
  if (["income", "receita", "entrada", "credit", "credito", "crédito"].includes(v))
    return "income";
  return "expense";
};

const buildCategoryData = (transactions: Transaction[]): CategoryDataItem[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const map = new Map<string, number>();

  transactions.forEach((tx) => {
    if (normalizeTransactionType(tx.type) !== "expense") return;

    // Filtra apenas o mês corrente
    const datePart = tx.date.split("T")[0];
    const [year, month] = datePart.split("-").map(Number);
    if (year !== currentYear || month - 1 !== currentMonth) return;

    const category = tx.category || "Outros";
    const amount =
      typeof tx.amount === "number"
        ? Math.abs(tx.amount)
        : Math.abs(Number(tx.amount) || 0);

    map.set(category, (map.get(category) ?? 0) + amount);
  });

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }));
};

const Index = () => {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const dashboardResponse = await dashboardAPI.getDashboard();
      setDashboard(dashboardResponse);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Falha ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handleTransactionsUpdated = () => {
      loadDashboardData();
    };

    const handleWindowFocus = () => {
      loadDashboardData();
    };

    window.addEventListener("transactions-updated", handleTransactionsUpdated);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("transactions-updated", handleTransactionsUpdated);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadDashboardData]);

  const transactions = dashboard?.transactions ?? [];
  const goals = dashboard?.goals ?? [];
  const availableTotal = dashboard?.summary.availableBalance ?? 0;
  const categoryData = useMemo(() => buildCategoryData(transactions), [transactions]);

  return (
    <AppLayout>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso financeiro dos últimos 30 dias.</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300"
        >
          + Nova Transação
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-destructive/10 rounded-lg">
          <p className="text-xs text-destructive flex-1">{loadError}</p>
          <button
            onClick={loadDashboardData}
            className="text-xs font-medium text-destructive underline hover:no-underline shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 lg:space-y-8 pb-12">
          {/* ROW 1: Highlight Cards */}
          <StatCards transactions={transactions} summary={dashboard?.summary} />

          {/* ROW 2: Chart & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
            <div className="lg:col-span-8">
              <SpendingChart transactions={transactions} categoryData={categoryData} />
            </div>
            <div className="lg:col-span-4">
              <DashboardGoalsWidget goals={goals} />
            </div>
          </div>

          {/* ROW 3: Bottom Section Split (Table + Insights/Payments) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* Table */}
            <div className="lg:col-span-8 sticky top-6">
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/70 dark:border-white/10 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col max-h-[650px] transition-all duration-300">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h2 className="text-lg font-semibold text-foreground">Últimas Transações</h2>
                  <Link to="/transactions" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    Ver todas <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 [scrollbar-gutter:stable] -mr-2">
                  <TransactionTable
                    limit={10}
                    showSearch={false}
                    transactionsData={transactions}
                    onRowClick={() => navigate("/transactions")}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Insights & Payments */}
            <div className="lg:col-span-4 flex flex-col gap-5 lg:gap-6">
              <DashboardInsights transactions={transactions} goals={goals} />
              <PaymentMethodBreakdown transactions={transactions} />
            </div>
          </div>
        </div>
      )}

      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Index;
