import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { PeriodSelector } from "@/components/PeriodSelector";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { usePeriod, formatPeriodLong } from "@/hooks/usePeriod";
import { transactionAPI, categoryAPI, type Transaction, type Category } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
);

export default function Transactions() {
  const { year, month } = usePeriod();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [txs, cats] = await Promise.all([
        transactionAPI.list({ year, month }),
        categoryAPI.list(),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = useCallback(() => load(), [load]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    setDeleting(id);
    try {
      await transactionAPI.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Erro ao excluir transação");
    } finally {
      setDeleting(null);
    }
  }, []);

  // ── Filter chips — categories that have transactions this month ──────────────
  const activeCategories = useMemo(() => {
    const ids = new Set(transactions.map((t) => t.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [transactions, categories]);

  // ── Filtered transactions ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeCategoryId !== "all" && tx.categoryId !== activeCategoryId) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, activeCategoryId, search]);

  // ── Horizontal bar chart data (expense categories only, sorted) ───────────────
  const rankingData = useMemo(() => {
    const byCategory = new Map<string, { name: string; color: string; amount: number }>();
    for (const tx of transactions) {
      if (tx.category.isIncome) continue;
      const prev = byCategory.get(tx.categoryId);
      if (prev) {
        prev.amount += tx.amount;
      } else {
        byCategory.set(tx.categoryId, {
          name: tx.category.name,
          color: tx.category.color,
          amount: tx.amount,
        });
      }
    }
    return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });

  const periodLabel = formatPeriodLong(year, month);

  return (
    <AppLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transações</h1>
          <p className="text-sm text-muted-foreground capitalize">{periodLabel}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova transação
        </button>
      </div>

      <div className="flex items-center justify-end mb-4">
        <PeriodSelector />
      </div>

      {/* ── Horizontal bar chart ── */}
      {!loading && rankingData.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
          <p className="text-sm font-semibold text-foreground mb-1">Onde você mais gasta</p>
          <p className="text-xs text-muted-foreground mb-4">Ranking de categorias no período</p>
          <ResponsiveContainer width="100%" height={rankingData.length * 36 + 20}>
            <BarChart
              data={rankingData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 60, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `R$ ${(v / 1000).toFixed(1)} mil` : formatCurrencyBRL(v)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={58}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrencyBRL(v), "Total"]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18}>
                {rankingData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Search + filters ── */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filtered.length} resultado(s)
          </span>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoryId("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategoryId === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? "all" : cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategoryId === cat.id
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              style={activeCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction list ── */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm">Nenhuma transação encontrada</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-blue-600 underline"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
              >
                {/* Category icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: tx.category.color }}
                >
                  {tx.category.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <span style={{ color: tx.category.color }}>{tx.category.name}</span>
                    {" · "}{formatDate(tx.date)}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${
                    tx.category.isIncome ? "text-emerald-600" : "text-foreground"
                  }`}
                >
                  {tx.category.isIncome ? "+" : "–"}{formatCurrencyBRL(tx.amount)}
                </span>

                {/* Delete button — appears on hover */}
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deleting === tx.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  {deleting === tx.id ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </AppLayout>
  );
}
