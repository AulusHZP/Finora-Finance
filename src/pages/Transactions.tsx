import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TransactionList } from "@/components/TransactionList";
import { FAB } from "@/components/FAB";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";

const Transactions = () => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">All your recent activity</p>
      </div>
      <TransactionList />
      <FAB onClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppLayout>
  );
};

export default Transactions;
