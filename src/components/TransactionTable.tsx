import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, Car, Utensils, Briefcase, Zap, Heart, Gamepad2, DollarSign, ArrowUpDown, Search } from "lucide-react";
import { transactionAPI, Transaction } from "@/services/api";

const iconMap: Record<string, any> = {
  Compras: ShoppingBag,
  Transporte: Car,
  Alimentação: Utensils,
  Salário: Briefcase,
  Contas: Zap,
  Saúde: Heart,
  Entretenimento: Gamepad2,
  Freelance: DollarSign,
};

const categoryLabelMap: Record<string, string> = {
  Compras: "Compras",
  Transporte: "Transporte",
  Alimentação: "Alimentação",
  Salário: "Salário",
  Contas: "Contas",
  Saúde: "Saúde",
  Entretenimento: "Entretenimento",
  Freelance: "Freelance",
};

const methodLabelMap: Record<string, string> = {
  Crédito: "Crédito",
  Débito: "Débito",
  Transferência: "Transferência",
  Pix: "Pix",
  Dinheiro: "Dinheiro",
};

type SortField = "date" | "amount" | "title";

export function TransactionTable({
  limit,
  showSearch = true,
  refreshTrigger,
  onViewDetails,
  onRowClick,
  onlyCsvImported = false,
  transactionsData,
}: {
  limit?: number;
  showSearch?: boolean;
  refreshTrigger?: number;
  onViewDetails?: (transaction: Transaction) => void;
  onRowClick?: (transaction: Transaction) => void;
  onlyCsvImported?: boolean;
  transactionsData?: Transaction[];
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    if (transactionsData) {
      return;
    }

    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await transactionAPI.getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [refreshTrigger, transactionsData]);

  const filtered = useMemo(() => {
    const source = transactionsData ?? transactions;
    let items = [...source];
    if (onlyCsvImported) items = items.filter((t) => t.method === "Importação CSV");
    if (filterType !== "all") items = items.filter((t) => t.type === filterType);
    if (search) items = items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
    items.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === "date") return mul * new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortField === "amount") return mul * (Math.abs(a.amount) - Math.abs(b.amount));
      return mul * a.title.localeCompare(b.title);
    });
    return limit ? items.slice(0, limit) : items;
  }, [transactions, transactionsData, search, sortField, sortAsc, filterType, limit, onlyCsvImported]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);

  if (!transactionsData && loading && transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Carregando transações...</p>;
  }

  return (
    <div>
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar transações..."
              className="w-full h-9 pl-9 pr-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5 self-start">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-default ${
                  filterType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t === "all" ? "Todos" : t === "income" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sm:hidden space-y-2">
        {filtered.map((tx) => {
          const Icon = iconMap[tx.category] || DollarSign;
          return (
            <div
              key={tx.id}
              className={`rounded-xl border border-border/70 bg-card p-3 ${onViewDetails || onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (onViewDetails) {
                  onViewDetails(tx);
                  return;
                }
                onRowClick?.(tx);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.type === "income" ? "bg-success-light" : "bg-muted"
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${tx.type === "income" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-[11px] text-muted-foreground">{methodLabelMap[tx.method] || tx.method}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-tag text-tag-foreground">{categoryLabelMap[tx.category] || tx.category}</span>
                      {tx.isFixed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">Custo Fixo</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                  {onViewDetails && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewDetails(tx);
                      }}
                      className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-muted text-foreground hover:bg-hover transition-default"
                    >
                      Detalhes
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Transação</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 hidden sm:table-cell">Categoria</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 hidden md:table-cell">Método</th>
              <th
                className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 cursor-pointer hover:text-foreground transition-default hidden sm:table-cell"
                onClick={() => toggleSort("date")}
              >
                <span className="inline-flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th
                className="text-right text-xs font-medium text-muted-foreground pb-2 cursor-pointer hover:text-foreground transition-default hidden sm:table-cell"
                onClick={() => toggleSort("amount")}
              >
                <span className="inline-flex items-center gap-1 justify-end">Valor <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              {onViewDetails && <th className="text-right text-xs font-medium text-muted-foreground pb-2 pl-4">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => {
              const Icon = iconMap[tx.category] || DollarSign;
              return (
                <tr
                  key={tx.id}
                  className={`border-b border-border/50 hover:bg-hover transition-default ${onViewDetails || onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (onViewDetails) {
                      onViewDetails(tx);
                      return;
                    }
                    onRowClick?.(tx);
                  }}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === "income" ? "bg-success-light" : "bg-muted"
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${tx.type === "income" ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate block">{tx.title}</span>
                        <div className="sm:hidden flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
                          <span className={`text-xs font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                            {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-tag text-tag-foreground">{categoryLabelMap[tx.category] || tx.category}</span>
                      {tx.isFixed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">Custo Fixo</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{methodLabelMap[tx.method] || tx.method}</span>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                  </td>
                  <td className="py-3 text-right hidden sm:table-cell">
                    <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </td>
                  {onViewDetails && (
                    <td className="py-3 text-right pl-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewDetails(tx);
                        }}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted text-foreground hover:bg-hover transition-default"
                      >
                        Detalhes
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
      )}
    </div>
  );
}
