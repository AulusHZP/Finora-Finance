import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { TransactionTable } from "@/components/TransactionTable";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { transactionAPI, type Transaction } from "@/services/api";
import { parseCurrencyInputBRL } from "@/lib/currency";

const Transactions = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isFixed, setIsFixed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearingCsv, setClearingCsv] = useState(false);
  const [onlyCsvImported, setOnlyCsvImported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionAPI.getTransactions();
      setTransactionList(data);
    } catch (err) {
      console.error("Falha ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const handleTransactionsUpdated = () => {
      loadTransactions();
    };

    window.addEventListener("transactions-updated", handleTransactionsUpdated);
    return () => {
      window.removeEventListener("transactions-updated", handleTransactionsUpdated);
    };
  }, [loadTransactions]);

  const handleTransactionAdded = () => {
    loadTransactions();
  };

  useEffect(() => {
    if (!selectedTransaction) {
      return;
    }

    setTitle(selectedTransaction.title);
    setAmount(String(selectedTransaction.amount).replace(".", ","));
    setCategory(selectedTransaction.category);
    setMethod(selectedTransaction.method);
    setDate(new Date(selectedTransaction.date).toISOString().split("T")[0]);
    setType(selectedTransaction.type);
    setIsFixed(Boolean(selectedTransaction.isFixed));
    setError(null);
  }, [selectedTransaction]);

  const openDetails = (transaction: Transaction) => {
    setNotice(null);
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedTransaction(null);
    setError(null);
  };

  const handleClearImportedCsv = async () => {
    const confirmed = window.confirm("Deseja apagar todas as transações importadas via CSV?");
    if (!confirmed) {
      return;
    }

    try {
      setClearingCsv(true);
      setError(null);
      setNotice(null);

      const result = await transactionAPI.clearImportedTransactions();
      setNotice(`${result.deleted} transações importadas foram apagadas.`);
      if (detailsOpen) {
        closeDetails();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao limpar transações importadas");
    } finally {
      setClearingCsv(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedTransaction) {
      return;
    }

    const parsedAmount = parseCurrencyInputBRL(amount);
    if (!title.trim() || parsedAmount === null || parsedAmount <= 0 || !category.trim() || !method.trim() || !date) {
      setError("Preencha todos os campos corretamente.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await transactionAPI.updateTransaction(selectedTransaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        type,
        isFixed,
        category: category.trim(),
        method: method.trim(),
        date
      });

      closeDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar transação");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) {
      return;
    }

    const confirmed = window.confirm("Deseja apagar esta transação?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await transactionAPI.deleteTransaction(selectedTransaction.id);
      closeDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao apagar transação");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualize e gerencie toda a atividade</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <button
            onClick={() => setOnlyCsvImported((prev) => !prev)}
            className={`h-11 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-default ${
              onlyCsvImported
                ? "bg-card border border-border text-foreground"
                : "bg-muted text-muted-foreground hover:bg-hover"
            }`}
          >
            {onlyCsvImported ? "Mostrando: Somente CSV" : "Filtrar: Somente CSV"}
          </button>
          <button
            onClick={handleClearImportedCsv}
            disabled={clearingCsv}
            className="h-11 px-3 sm:px-4 bg-destructive/10 text-destructive rounded-lg text-xs sm:text-sm font-medium hover:bg-destructive/20 transition-default disabled:opacity-50"
          >
            {clearingCsv ? "Apagando CSV..." : "Apagar importadas CSV"}
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="col-span-2 h-11 flex items-center justify-center gap-2 px-3 sm:px-4 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-default sm:col-span-1"
          >
            + Nova Transação
          </button>
        </div>
      </div>
      {notice && <p className="text-xs text-success mb-3">{notice}</p>}
      {error && !detailsOpen && <p className="text-xs text-destructive mb-3">{error}</p>}
      <div className="glass-card p-5">
        <TransactionTable
          onViewDetails={openDetails}
          onlyCsvImported={onlyCsvImported}
          transactionsData={transactionList}
        />
      </div>
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onTransactionAdded={handleTransactionAdded} />

      {detailsOpen && selectedTransaction && (
        <>
          <div className="fixed inset-0 bg-foreground/30 z-50" onClick={closeDetails} />
          <div className="fixed z-50 bottom-0 left-0 right-0 bg-card rounded-t-2xl p-5 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-xl lg:w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Detalhes da Transação</h2>
              <button onClick={closeDetails} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType("expense")}
                  className={`h-9 rounded-lg text-sm font-medium transition-default ${type === "expense" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                >
                  Despesa
                </button>
                <button
                  onClick={() => setType("income")}
                  className={`h-9 rounded-lg text-sm font-medium transition-default ${type === "income" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}
                >
                  Receita
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="w-full h-10 px-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Método</label>
                  <input value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tag</label>
                <button
                  type="button"
                  onClick={() => setIsFixed((prev) => !prev)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-default ${isFixed ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
                >
                  Custo Fixo
                </button>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDeleteTransaction}
                  disabled={deleting || saving}
                  className="px-4 h-10 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-default disabled:opacity-50"
                >
                  {deleting ? "Apagando..." : "Apagar"}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving || deleting}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-default disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Transactions;
