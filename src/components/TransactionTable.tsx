import { useState, useMemo } from "react";
import { ShoppingBag, Car, Utensils, Briefcase, Zap, Heart, Gamepad2, DollarSign, ArrowUpDown, Search } from "lucide-react";

const iconMap: Record<string, any> = {
  Shopping: ShoppingBag, Transport: Car, Food: Utensils, Salary: Briefcase,
  Bills: Zap, Health: Heart, Entertainment: Gamepad2, Freelance: DollarSign,
};

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  method: string;
}

export const allTransactions: Transaction[] = [
  { id: "1", title: "Grocery Store", category: "Food", amount: -82.50, type: "expense", date: "2024-04-15", method: "Credit" },
  { id: "2", title: "Salary Deposit", category: "Salary", amount: 4500.00, type: "income", date: "2024-04-15", method: "Transfer" },
  { id: "3", title: "Electric Bill", category: "Bills", amount: -145.00, type: "expense", date: "2024-04-14", method: "Debit" },
  { id: "4", title: "Uber Ride", category: "Transport", amount: -24.30, type: "expense", date: "2024-04-14", method: "Credit" },
  { id: "5", title: "Freelance Project", category: "Freelance", amount: 1200.00, type: "income", date: "2024-04-12", method: "Transfer" },
  { id: "6", title: "Nike Store", category: "Shopping", amount: -189.99, type: "expense", date: "2024-04-11", method: "Credit" },
  { id: "7", title: "Gym Membership", category: "Health", amount: -49.99, type: "expense", date: "2024-04-10", method: "Debit" },
  { id: "8", title: "Netflix", category: "Entertainment", amount: -15.99, type: "expense", date: "2024-04-10", method: "Credit" },
  { id: "9", title: "Coffee Shop", category: "Food", amount: -6.50, type: "expense", date: "2024-04-09", method: "Pix" },
  { id: "10", title: "Side Project", category: "Freelance", amount: 750.00, type: "income", date: "2024-04-08", method: "Transfer" },
];

type SortField = "date" | "amount" | "title";

export function TransactionTable({ limit, showSearch = true }: { limit?: number; showSearch?: boolean }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const filtered = useMemo(() => {
    let items = [...allTransactions];
    if (filterType !== "all") items = items.filter((t) => t.type === filterType);
    if (search) items = items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
    items.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === "date") return mul * a.date.localeCompare(b.date);
      if (sortField === "amount") return mul * (Math.abs(a.amount) - Math.abs(b.amount));
      return mul * a.title.localeCompare(b.title);
    });
    return limit ? items.slice(0, limit) : items;
  }, [search, sortField, sortAsc, filterType, limit]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
              placeholder="Search transactions..."
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
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Transação</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 hidden sm:table-cell">Categoria</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 hidden md:table-cell">Método</th>
              <th
                className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 cursor-pointer hover:text-foreground transition-default"
                onClick={() => toggleSort("date")}
              >
                <span className="inline-flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th
                className="text-right text-xs font-medium text-muted-foreground pb-2 cursor-pointer hover:text-foreground transition-default"
                onClick={() => toggleSort("amount")}
              >
                <span className="inline-flex items-center gap-1 justify-end">Valor <ArrowUpDown className="h-3 w-3" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => {
              const Icon = iconMap[tx.category] || DollarSign;
              return (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-hover transition-default cursor-pointer">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === "income" ? "bg-success-light" : "bg-muted"
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${tx.type === "income" ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{tx.title}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-tag text-tag-foreground">{tx.category}</span>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{tx.method}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                      {tx.type === "income" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
      )}
    </div>
  );
}
