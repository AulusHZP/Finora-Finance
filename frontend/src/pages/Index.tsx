import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCards } from "@/components/StatCards";
import { SpendingChart } from "@/components/SpendingChart";
import { TransactionTable } from "@/components/TransactionTable";
import { DashboardGoalsWidget } from "@/components/DashboardGoalsWidget";
import { DashboardInsights } from "@/components/DashboardInsights";
import { PaymentMethodBreakdown } from "@/components/PaymentMethodBreakdown";
import { FAB } from "@/components/FAB";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/currency";
import { dashboardAPI, type DashboardData } from "@/services/api";

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

  return (
    <AppLayout>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso financeiro deste mês.</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300"
        >
          + Nova Transação
        </button>
      </div>

      {loadError && <p className="text-xs text-destructive mb-4">{loadError}</p>}
      {loading && <p className="text-xs text-muted-foreground mb-4">Carregando dados reais do dashboard...</p>}

      <div className="space-y-6 lg:space-y-8 pb-12">
        {/* ROW 1: Highlight Cards */}
        <StatCards transactions={transactions} summary={dashboard?.summary} />

        {/* ROW 2: Chart & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          <div className="lg:col-span-8 bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm">
            <SpendingChart transactions={transactions} />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-5 lg:gap-6">
            <DashboardGoalsWidget goals={goals} />
          </div>
        </div>

        {/* ROW 3: Bottom Section Split (Table + Insights/Payments) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          
          {/* Table */}
          <div className="lg:col-span-8 bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm flex flex-col h-full max-h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
              <h2 className="text-base font-bold text-foreground">Últimas Transações</h2>
              <Link to="/transactions" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                Ver tudo <ChevronRight className="h-4 w-4" />
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

          {/* Right Column: Insights & Payments */}
          <div className="lg:col-span-4 space-y-5 lg:space-y-6">
            <DashboardInsights transactions={transactions} goals={goals} />
            <PaymentMethodBreakdown transactions={transactions} />
          </div>
        </div>
      </div>

      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Index;
