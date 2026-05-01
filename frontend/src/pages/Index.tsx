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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Resumo financeiro atual</p>
          <h1 
            className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mt-1 line-clamp-1"
            title={formatCurrencyBRL(availableTotal)}
          >
            {formatCurrencyBRL(availableTotal)}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Disponível acumulado</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default mt-4 sm:mt-0"
        >
          + Nova Transação
        </button>
      </div>

      {loadError && <p className="text-xs text-destructive mb-4">{loadError}</p>}
      {loading && <p className="text-xs text-muted-foreground mb-4">Carregando dados reais do dashboard...</p>}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-5 min-h-[calc(100vh-400px)]">
        {/* LEFT COLUMN - Main Content (70%) */}
        <div className="space-y-5">
          {/* Stat Cards */}
          <div>
            <StatCards transactions={transactions} summary={dashboard?.summary} />
          </div>

          {/* Large Chart */}
          <div className="bg-card rounded-lg border border-border p-5">
            <SpendingChart transactions={transactions} />
          </div>

          {/* Transactions Table */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <Link to="/transactions" className="text-sm font-semibold text-foreground hover:text-primary transition-default">
                Todas as Transações
              </Link>
              <Link to="/transactions" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
                Ver tudo <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden pr-2 [scrollbar-gutter:stable]">
              <TransactionTable
                limit={15}
                showSearch={false}
                transactionsData={transactions}
                onRowClick={() => navigate("/transactions")}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Supporting Content (30%) */}
        <div className="space-y-5">
          {/* Goals Widget */}
          <DashboardGoalsWidget goals={goals} />

          {/* Insights */}
          <DashboardInsights transactions={transactions} goals={goals} />

          {/* Payment Method Breakdown */}
          <PaymentMethodBreakdown transactions={transactions} />
        </div>
      </div>

      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Index;
