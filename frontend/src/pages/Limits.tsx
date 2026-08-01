import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { PeriodSelector } from "@/components/PeriodSelector";
import { usePeriod, formatPeriodLong } from "@/hooks/usePeriod";
import { limitsAPI, categoryAPI, type LimitsData, type Category } from "@/services/api";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
);

// ─── Inline editable limit input ─────────────────────────────────────────────

function LimitInput({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (newVal: number | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [str, setStr] = useState(value !== null ? String(value) : "");
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    const parsed = parseCurrencyInputBRL(str);
    const newVal = parsed && parsed > 0 ? parsed : null;
    setSaving(true);
    try {
      await onSave(newVal);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        inputMode="decimal"
        value={str}
        autoFocus
        onChange={(e) => setStr(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className="w-24 px-2 py-1 border border-ring rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring bg-background"
      />
    );
  }

  return (
    <button
      onClick={() => { setStr(value !== null ? String(value) : ""); setEditing(true); }}
      className="w-24 px-2 py-1 border border-border rounded-lg text-sm text-right hover:border-ring transition-colors bg-background"
      disabled={saving}
    >
      {saving ? "..." : value !== null ? String(value) : "0"}
    </button>
  );
}

// ─── Category budget card ─────────────────────────────────────────────────────

function CategoryBudgetCard({
  cat,
  alertThreshold,
  year,
  month,
  onUpdated,
}: {
  cat: LimitsData["categories"][number];
  alertThreshold: number;
  year: number;
  month: number;
  onUpdated: () => void;
}) {
  const hasLimit = cat.limit !== null;
  const borderClass =
    cat.status === "danger"
      ? "border-red-200 bg-red-50/30"
      : cat.status === "warning"
      ? "border-amber-200 bg-amber-50/30"
      : "border-border bg-card";

  const badgeClass =
    cat.status === "danger"
      ? "bg-red-100 text-red-700"
      : cat.status === "warning"
      ? "bg-amber-100 text-amber-700"
      : "";

  const badgeLabel =
    cat.status === "danger" ? "Limite estourado"
    : cat.status === "warning" ? "Perto do limite"
    : "";

  const handleLimitSave = async (newVal: number | null) => {
    await limitsAPI.upsertCategoryLimit(year, month, cat.categoryId, newVal);
    onUpdated();
  };

  return (
    <div className={`rounded-2xl p-4 border ${borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: cat.categoryColor }}
          >
            {cat.categoryName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{cat.categoryName}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrencyBRL(cat.spent)}
              {hasLimit ? ` de ${formatCurrencyBRL(cat.limit!)}` : " sem limite"}
            </p>
          </div>
        </div>
        {badgeLabel && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
      </div>

      {/* Progress */}
      {hasLimit ? (
        <>
          <ProgressBar
            value={cat.usagePct ?? 0}
            status={cat.status}
            alertThreshold={alertThreshold}
            height={6}
            className="mb-2"
          />
          <p className={`text-xs ${cat.status === "danger" ? "text-red-600" : cat.status === "warning" ? "text-amber-600" : "text-muted-foreground"}`}>
            {cat.status === "danger"
              ? `R$ ${(cat.spent - cat.limit!).toFixed(2).replace(".", ",")} acima do limite`
              : `Restam ${formatCurrencyBRL(cat.remaining ?? 0)} · ${(cat.usagePct ?? 0).toFixed(0)}% usado`}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">Defina um limite para acompanhar</p>
      )}

      {/* Limit input */}
      <div className="flex justify-end mt-3">
        <LimitInput
          value={cat.limit}
          onSave={handleLimitSave}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Limits() {
  const { year, month } = usePeriod();
  const [data, setData] = useState<LimitsData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLimitStr, setTotalLimitStr] = useState("");
  const [savingTotalLimit, setSavingTotalLimit] = useState(false);
  const [sliderValue, setSliderValue] = useState(80);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [limitsData, cats] = await Promise.all([
        limitsAPI.get(year, month),
        categoryAPI.list(),
      ]);
      setData(limitsData);
      setCategories(cats);
      setTotalLimitStr(limitsData.totalLimit !== null ? String(limitsData.totalLimit) : "");
      setSliderValue(limitsData.alertThreshold);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleSaveTotalLimit = async () => {
    const parsed = parseCurrencyInputBRL(totalLimitStr);
    const newVal = parsed && parsed > 0 ? parsed : null;
    setSavingTotalLimit(true);
    try {
      await limitsAPI.updateBudget(year, month, { totalLimit: newVal });
      await load();
    } finally {
      setSavingTotalLimit(false);
    }
  };

  const handleSaveThreshold = async (val: number) => {
    setSavingThreshold(true);
    try {
      await limitsAPI.updateBudget(year, month, { alertThreshold: val });
      setData((prev) => prev ? { ...prev, alertThreshold: val } : prev);
    } finally {
      setSavingThreshold(false);
    }
  };

  // All expense categories should appear in the grid
  const expenseCategories = categories.filter((c) => !c.isIncome);

  // Merge with existing CategoryBudget data
  const categoryRows = expenseCategories.map((cat) => {
    const existing = data?.categories.find((cb) => cb.categoryId === cat.id);
    return existing ?? {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      spent: 0,
      limit: null,
      usagePct: null,
      status: null as null,
      remaining: null,
    };
  });

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Limites</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Orçamento de {formatPeriodLong(year, month)}
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Limite Geral</p>
              <p className="text-2xl font-bold text-foreground">
                {data?.totalLimit ? formatCurrencyBRL(data.totalLimit) : "—"}
              </p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">Em Atenção</p>
              <p className="text-2xl font-bold text-amber-600">{data?.inWarningCount ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Acima de {data?.alertThreshold ?? 80}% do limite</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">Estourados</p>
              <p className="text-2xl font-bold text-red-600">{data?.overLimitCount ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Categorias acima de 100%</p>
            </div>
          </>
        )}
      </div>

      {/* Settings cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* General limit editor */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1">Limite geral do mês</p>
          <p className="text-xs text-muted-foreground mb-4">Teto total de gastos</p>

          <label className="block text-xs font-semibold text-foreground mb-1.5">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={totalLimitStr}
            onChange={(e) => setTotalLimitStr(e.target.value)}
            onBlur={handleSaveTotalLimit}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveTotalLimit(); }}
            placeholder="ex: 6500"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {data && data.totalLimit && (
            <>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrencyBRL(data.totalSpent)} de {formatCurrencyBRL(data.totalLimit)}
              </p>
              <ProgressBar
                value={data.totalUsagePct ?? 0}
                status={data.totalStatus}
                alertThreshold={data.alertThreshold}
                height={6}
                className="mt-2"
              />
            </>
          )}
        </div>

        {/* Alert threshold slider */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1">Alerta de atenção</p>
          <p className="text-xs text-muted-foreground mb-4">Percentual do limite em que o aviso dispara</p>

          <p className="text-3xl font-bold text-foreground mb-4">{sliderValue}%</p>

          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            onMouseUp={() => handleSaveThreshold(sliderValue)}
            onTouchEnd={() => handleSaveThreshold(sliderValue)}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>50%</span>
            <span>95%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ao registrar uma transação que cruze esse percentual, você recebe um alerta na tela.
          </p>
        </div>
      </div>

      {/* Category budgets grid */}
      <div className="mb-2">
        <p className="text-base font-semibold text-foreground mb-1">Limites por categoria</p>
        <p className="text-xs text-muted-foreground mb-4">Progresso do mês por categoria</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryRows.map((cat) => (
            <CategoryBudgetCard
              key={cat.categoryId}
              cat={cat}
              alertThreshold={data?.alertThreshold ?? 80}
              year={year}
              month={month}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
