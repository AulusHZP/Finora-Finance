import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SummaryCards } from "@/components/SummaryCards";
import { SpendingChart } from "@/components/SpendingChart";
import { TransactionList } from "@/components/TransactionList";
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
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Good morning, John 👋</p>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mt-1">$12,580.50</h1>
        <p className="text-xs text-muted-foreground mt-1">Available this month</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards />
      </div>

      {/* Spending Chart */}
      <div className="mb-6">
        <SpendingChart />
      </div>

      {/* Insight */}
      <div className="mb-6">
        <InsightCard />
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
          <Link to="/transactions" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <TransactionList limit={5} />
      </div>

      {/* Goals */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Goals</h2>
          <Link to="/goals" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:opacity-80 transition-default">
            See all <ChevronRight className="h-3.5 w-3.5" />
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
