import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TransactionTable } from "@/components/TransactionTable";
import { FAB } from "@/components/FAB";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";

const Transactions = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage all activity</p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default"
        >
          + Add Transaction
        </button>
      </div>
      <div className="glass-card p-5">
        <TransactionTable />
      </div>
      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Transactions;
