import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, PiggyBank, Settings2, AlertTriangle } from "lucide-react";
import { budgetAPI, categorizeAPI, type BudgetStatus, type Category } from "@/services/api";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";

const progressColor = (ratio: number) => {
  if (ratio >= 100) return "bg-destructive";
  if (ratio >= 80) return "bg-amber-500";
  return "bg-blue-500";
};

const ratioTextColor = (ratio: number) => {
  if (ratio >= 100) return "text-destructive";
  if (ratio >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
};

function ManageBudgetsDialog({
  open,
  onClose,
  budgets
}: {
  open: boolean;
  onClose: () => void;
  budgets: BudgetStatus[];
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const initial: Record<string, string> = {};
    for (const budget of budgets) {
      initial[budget.categoryId] = String(budget.monthlyLimit).replace(".", ",");
    }
    setLimits(initial);
    setError("");

    categorizeAPI
      .getCategories()
      .then((data) => setCategories((data ?? []).filter((c) => c.type === "expense")))
      .catch(() => setError("Erro ao carregar categorias"));
  }, [open, budgets]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const budgetByCategoryId = new Map(budgets.map((b) => [b.categoryId, b]));

      for (const category of categories) {
        const raw = (limits[category.id] ?? "").trim();
        const existing = budgetByCategoryId.get(category.id);
        const parsed = raw ? parseCurrencyInputBRL(raw) : null;

        if (parsed !== null && parsed > 0) {
          if (!existing || existing.monthlyLimit !== parsed) {
            await budgetAPI.upsert(category.id, parsed);
          }
        } else if (existing) {
          await budgetAPI.remove(existing.id);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar orçamentos");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/20 z-[999] animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-card rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-md lg:w-full lg:p-6 lg:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Orçamentos mensais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Defina um limite por categoria. Deixe vazio para não acompanhar.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center press-scale hover:bg-muted/80 transition-default flex-shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3">
              <span className="text-sm text-foreground flex-1 truncate">
                {category.emoji} {category.name}
              </span>
              <div className="relative w-32">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limits[category.id] ?? ""}
                  onChange={(e) => setLimits((prev) => ({ ...prev, [category.id]: e.target.value }))}
                  placeholder="—"
                  className="w-full h-9 pl-8 pr-2 bg-muted rounded-lg text-sm text-foreground text-right placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
                />
              </div>
            </div>
          ))}
          {categories.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando categorias...</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-3">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || categories.length === 0}
          className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar orçamentos"}
        </button>
      </div>
    </>,
    document.body
  );
}

export function BudgetsCard({ budgets }: { budgets: BudgetStatus[] }) {
  const [manageOpen, setManageOpen] = useState(false);

  const monthLabel = useMemo(
    () => new Date().toLocaleDateString("pt-BR", { month: "long" }),
    []
  );

  return (
    <>
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/70 dark:border-white/10 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Orçamentos</h3>
              <p className="text-[11px] text-muted-foreground capitalize">{monthLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-hover transition-default"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Gerenciar
          </button>
        </div>

        {budgets.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">
            Nenhum orçamento definido. Defina limites por categoria para acompanhar seus gastos do mês.
          </p>
        ) : (
          <div className="space-y-3.5">
            {budgets.map((budget) => {
              const ratio = budget.monthlyLimit > 0 ? Math.round((budget.spent / budget.monthlyLimit) * 100) : 0;
              const over = ratio >= 100;

              return (
                <div key={budget.id}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground truncate pr-2">
                      {budget.emoji} {budget.categoryName}
                    </span>
                    <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${ratioTextColor(ratio)}`}>
                      {formatCurrencyBRL(budget.spent)} / {formatCurrencyBRL(budget.monthlyLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(ratio)}`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                  {ratio >= 80 && (
                    <p className={`text-[11px] mt-1 font-medium ${over ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                      {over
                        ? `Limite estourado em ${formatCurrencyBRL(budget.spent - budget.monthlyLimit)}`
                        : `${ratio}% do limite usado`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ManageBudgetsDialog open={manageOpen} onClose={() => setManageOpen(false)} budgets={budgets} />
    </>
  );
}
