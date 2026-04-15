import { useState } from "react";
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
import { Link } from "react-router-dom";

const Index = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppLayout>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">Bom dia, João 👋</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mt-1">$12,580.50</h1>
          <p className="text-xs text-muted-foreground mt-1">Disponível este mês</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default mt-4 sm:mt-0"
        >
          + Nova Transação
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-5 min-h-[calc(100vh-400px)]">
        {/* LEFT COLUMN - Main Content (70%) */}
        <div className="space-y-5">
          {/* Stat Cards */}
          <div>
            <StatCards />
          </div>

          {/* Large Chart */}
          <div className="bg-card rounded-lg border border-border p-5">
            <SpendingChart />
          </div>

          {/* Transactions Table */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Todas as Transações</h3>
              <Link to="/transactions" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
                Ver tudo <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <TransactionTable limit={15} showSearch={false} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Supporting Content (30%) */}
        <div className="space-y-5">
          {/* Goals Widget */}
          <DashboardGoalsWidget />

          {/* Insights */}
          <DashboardInsights />

          {/* Payment Method Breakdown */}
          <PaymentMethodBreakdown />
        </div>
      </div>

      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Index;
