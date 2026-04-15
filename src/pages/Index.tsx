import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCards } from "@/components/StatCards";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingBreakdown } from "@/components/SpendingBreakdown";
import { TransactionTable } from "@/components/TransactionTable";
import { GoalCards } from "@/components/GoalCards";
import { InsightCard } from "@/components/InsightCard";
import { FAB } from "@/components/FAB";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 lg:mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Good morning, John 👋</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mt-1">$12,580.50</h1>
          <p className="text-xs text-muted-foreground mt-1">Available this month</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default mt-4 sm:mt-0"
        >
          + New Transaction
        </button>
      </div>

      {/* Stat Cards */}
      <div className="mb-6">
        <StatCards />
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          <SpendingChart />
        </div>
        <div className="lg:col-span-2">
          <SpendingBreakdown />
        </div>
      </div>

      {/* Insight */}
      <div className="mb-6">
        <InsightCard />
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <TransactionTable limit={5} showSearch={false} />
      </div>

      {/* Goals */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Goals</h3>
          <Link to="/goals" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <GoalCards limit={2} />
      </div>

      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Index;
