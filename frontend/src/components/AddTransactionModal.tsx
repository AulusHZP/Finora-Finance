import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { transactionAPI, categoryAPI, type Category } from "@/services/api";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";
import { todayISO } from "@/hooks/usePeriod";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddTransactionModal({ open, onClose, onSaved }: AddTransactionModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isIncome, setIsIncome] = useState(false);
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      categoryAPI.list().then(setCategories).catch(() => {});
      // Reset form on open
      setIsIncome(false);
      setDescription("");
      setAmountStr("");
      setDate(todayISO());
      setCategoryId("");
      setError(null);
    }
  }, [open]);

  // Auto-select "Receitas" when toggling to income
  useEffect(() => {
    if (isIncome) {
      const receitas = categories.find((c) => c.isIncome);
      if (receitas) setCategoryId(receitas.id);
    } else {
      const first = categories.find((c) => !c.isIncome);
      if (first) setCategoryId(first.id);
    }
  }, [isIncome, categories]);

  const expenseCategories = categories.filter((c) => !c.isIncome);
  const incomeCategories = categories.filter((c) => c.isIncome);
  const displayCategories = isIncome ? incomeCategories : expenseCategories;

  const handleSave = async () => {
    if (!description.trim()) { setError("Informe a descrição"); return; }
    const amount = parseCurrencyInputBRL(amountStr);
    if (!amount || amount <= 0) { setError("Informe um valor válido"); return; }
    if (!categoryId) { setError("Selecione uma categoria"); return; }
    if (!date) { setError("Informe a data"); return; }

    try {
      setSaving(true);
      setError(null);
      await transactionAPI.create({ categoryId, description: description.trim(), amount, date });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">Nova transação</h2>
            <p className="text-xs text-muted-foreground">Registre um gasto ou uma receita do período.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl bg-muted p-1 mb-5 mt-4">
          <button
            onClick={() => setIsIncome(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              !isIncome ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Gasto
          </button>
          <button
            onClick={() => setIsIncome(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              isIncome ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Receita
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Supermercado, aluguel..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Categoria</label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Selecione...</option>
                {displayCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">⌄</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
