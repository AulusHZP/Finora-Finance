import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Trash2, Lock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { PeriodSelector } from "@/components/PeriodSelector";
import { usePeriod, formatPeriodLong } from "@/hooks/usePeriod";
import { categoryAPI, transactionAPI, type Category, type Transaction } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

// ─── Icon picker options ──────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { id: "tag", emoji: "🏷️" },
  { id: "shopping-bag", emoji: "🛍️" },
  { id: "utensils", emoji: "🍽️" },
  { id: "car", emoji: "🚗" },
  { id: "home", emoji: "🏠" },
  { id: "heart", emoji: "❤️" },
  { id: "graduation-cap", emoji: "🎓" },
  { id: "gamepad-2", emoji: "🎮" },
  { id: "refresh-cw", emoji: "🔄" },
  { id: "trending-up", emoji: "📈" },
  { id: "plane", emoji: "✈️" },
  { id: "music", emoji: "🎵" },
] as const;

const COLOR_OPTIONS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
  "#6B7280", "#14B8A6", "#84CC16", "#A78BFA",
];

function iconEmoji(iconId: string): string {
  return ICON_OPTIONS.find((i) => i.id === iconId)?.emoji ?? "🏷️";
}

// ─── New Category Modal ───────────────────────────────────────────────────────

function NewCategoryModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("tag");
  const [color, setColor] = useState("#3B82F6");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(""); setIcon("tag"); setColor("#3B82F6"); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Informe o nome da categoria"); return; }
    setSaving(true);
    try {
      await categoryAPI.create({ name: name.trim(), icon, color });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar categoria");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Nova categoria</h2>
            <p className="text-xs text-muted-foreground">Personalize nome, ícone e cor.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pet, Viagens..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === item.id ? "ring-2 ring-blue-500 bg-blue-50" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* Preview */}
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-muted">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: color + "20" }}
          >
            {iconEmoji(icon)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name || "Minha categoria"}</p>
            <p className="text-xs" style={{ color }}>{color}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {saving ? "Criando..." : "Criar categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
);

export default function Categories() {
  const { year, month } = usePeriod();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, txs] = await Promise.all([
        categoryAPI.list(),
        transactionAPI.list({ year, month }),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // ── Aggregations ──────────────────────────────────────────────────────────────

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.category.isIncome) continue;
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
    }
    return map;
  }, [transactions]);

  const totalSpentMonth = useMemo(
    () => Array.from(spentByCategory.values()).reduce((a, b) => a + b, 0),
    [spentByCategory]
  );

  // Expense categories with spend, sorted desc
  const expenseCategories = categories.filter((c) => !c.isIncome);
  const ranking = useMemo(
    () =>
      expenseCategories
        .map((cat) => ({
          ...cat,
          spent: spentByCategory.get(cat.id) ?? 0,
        }))
        .filter((c) => c.spent > 0)
        .sort((a, b) => b.spent - a.spent),
    [expenseCategories, spentByCategory]
  );

  const topSpent = ranking[0]?.spent ?? 0;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir categoria "${name}"?`)) return;
    setDeleting(id);
    try {
      await categoryAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(null);
    }
  };

  const customCategories = expenseCategories.filter((c) => !c.isSystem);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground capitalize">{formatPeriodLong(year, month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova categoria
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total de Categorias</p>
          <p className="text-2xl font-bold text-foreground">{expenseCategories.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Gasto</p>
          <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(totalSpentMonth)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Maior Gasto</p>
          <p className="text-xl font-bold text-foreground">{ranking[0] ? formatCurrencyBRL(ranking[0].spent) : "—"}</p>
          {ranking[0] && <p className="text-xs text-muted-foreground mt-0.5">{ranking[0].name}</p>}
        </div>
      </div>

      {/* Spending ranking */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6">
        <p className="text-sm font-semibold text-foreground mb-1">Onde o dinheiro foi</p>
        <p className="text-xs text-muted-foreground mb-4">Ranking de categorias por gasto no mês</p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum gasto registrado neste mês</p>
        ) : (
          <div className="space-y-3">
            {ranking.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  {iconEmoji(cat.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatCurrencyBRL(cat.spent)}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${topSpent > 0 ? (cat.spent / topSpent) * 100 : 0}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category management list */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Todas as categorias</p>
          <p className="text-xs text-muted-foreground">
            {customCategories.length} personalizadas · {expenseCategories.filter((c) => c.isSystem).length} do sistema
          </p>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  {iconEmoji(cat.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {spentByCategory.get(cat.id)
                      ? formatCurrencyBRL(spentByCategory.get(cat.id)!)
                      : "Sem gastos este mês"}
                  </p>
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.isSystem ? (
                  <div
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground/40"
                    title="Categoria do sistema — não pode ser excluída"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={deleting === cat.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deleting === cat.id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NewCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </AppLayout>
  );
}
