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
  onViewDetails,
  onRowClick,
  onlyCsvImported = false,
  transactionsData,
  categoryFilter,
}: {
  limit?: number;
  showSearch?: boolean;
  onViewDetails?: (transaction: Transaction) => void;
  onRowClick?: (transaction: Transaction) => void;
  onlyCsvImported?: boolean;
  transactionsData?: Transaction[];
  categoryFilter?: string;
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
  }, [transactionsData]);

  const filtered = useMemo(() => {
    const source = transactionsData || transactions;
    let items = [...source];
    if (onlyCsvImported) items = items.filter((t) => t.method === "Importação CSV");
    if (filterType !== "all") items = items.filter((t) => t.type === filterType);
    if (categoryFilter) items = items.filter((t) => t.category === categoryFilter);
    if (search) items = items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
    items.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === "date") return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortField === "amount") return mul * (Math.abs(a.amount) - Math.abs(b.amount));
      return mul * a.title.localeCompare(b.title);
    });
    return limit ? items.slice(0, limit) : items;
  }, [transactions, transactionsData, search, sortField, sortAsc, filterType, limit, onlyCsvImported, categoryFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const formatDate = (d: string) => {
    // Extract YYYY-MM-DD directly from the ISO string to avoid timezone shifts
    const datePart = d.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    // Use UTC date to prevent local timezone from shifting the day
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric", timeZone: "UTC" });
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

      <div className="flex flex-col gap-1">
        {filtered.map((tx) => {
          const Icon = iconMap[tx.category] || DollarSign;

          // Define dynamic colors based on type or category
          let colorClass = "bg-muted text-muted-foreground";
          if (tx.type === "income") {
            colorClass = "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
          } else if (tx.category === "Alimentação") {
            colorClass = "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400";
          } else if (tx.category === "Moradia" || tx.category === "Contas") {
            colorClass = "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
          } else if (tx.category === "Compras") {
            colorClass = "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400";
          }

          return (
            <div
              key={tx.id}
              className={`flex items-center p-3 rounded-2xl hover:bg-muted/50 transition-colors group ${onViewDetails || onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (onViewDetails) {
                  onViewDetails(tx);
                  return;
                }
                onRowClick?.(tx);
              }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shrink-0 transition-transform group-hover:scale-105 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-semibold text-foreground truncate mb-0.5">{tx.title}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground truncate">
                  <span className="bg-secondary px-2 py-0.5 rounded-md font-medium text-foreground/70">{categoryLabelMap[tx.category] || tx.category}</span>
                  <span>•</span>
                  <span>{methodLabelMap[tx.method] || tx.method}</span>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                  {tx.type === "income" ? "+" : "-"} {formatCurrency(Math.abs(tx.amount))}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada.</div>
        )}
      </div>
    </div>
  );
}
