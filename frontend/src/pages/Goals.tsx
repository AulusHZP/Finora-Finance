import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProgressBar } from "@/components/ProgressBar";
import { goalAPI, type Goal, type GoalContribution } from "@/services/api";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";
import { todayISO } from "@/hooks/usePeriod";

// ─── Icon picker ──────────────────────────────────────────────────────────────

const GOAL_ICONS = [
  { id: "shield", emoji: "🛡️" },
  { id: "plane", emoji: "✈️" },
  { id: "home", emoji: "🏠" },
  { id: "car", emoji: "🚗" },
  { id: "graduation-cap", emoji: "🎓" },
  { id: "gift", emoji: "🎁" },
  { id: "smartphone", emoji: "📱" },
  { id: "heart", emoji: "❤️" },
  { id: "star", emoji: "⭐" },
  { id: "trending-up", emoji: "📈" },
  { id: "laptop", emoji: "💻" },
  { id: "baby", emoji: "👶" },
] as const;

function iconEmoji(iconId: string): string {
  return GOAL_ICONS.find((i) => i.id === iconId)?.emoji ?? "🎯";
}

// ─── New Goal Modal ───────────────────────────────────────────────────────────

function NewGoalModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [targetStr, setTargetStr] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("shield");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(""); setTargetStr(""); setDeadline(""); setIcon("shield"); setError(null); }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Informe o nome da meta"); return; }
    const target = parseCurrencyInputBRL(targetStr);
    if (!target || target <= 0) { setError("Informe um valor alvo válido"); return; }

    setSaving(true);
    try {
      await goalAPI.create({ name: name.trim(), icon, targetAmount: target, deadline: deadline || null });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar meta");
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
            <h2 className="text-lg font-bold text-foreground">Nova meta</h2>
            <p className="text-xs text-muted-foreground">Defina um objetivo e acompanhe seus aportes.</p>
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
              placeholder="Reserva de emergência"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Valor alvo (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={targetStr}
                onChange={(e) => setTargetStr(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Prazo (opcional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === item.id
                      ? "bg-emerald-100 ring-2 ring-emerald-500"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? "Criando..." : "Criar meta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Contribution Modal ───────────────────────────────────────────────────

function AddContributionModal({
  goalId,
  goalName,
  open,
  onClose,
  onSaved,
}: {
  goalId: string;
  goalName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setAmountStr(""); setDate(todayISO()); setNote(""); setError(null); }
  }, [open]);

  const handleSave = async () => {
    const amount = parseCurrencyInputBRL(amountStr);
    if (!amount || amount <= 0) { setError("Informe um valor válido"); return; }
    if (!date) { setError("Informe a data"); return; }
    setSaving(true);
    try {
      await goalAPI.addContribution(goalId, { amount, date, note: note || undefined });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar aporte");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Registrar aporte</h2>
            <p className="text-xs text-muted-foreground">{goalName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Observação (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Poupança de julho"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving ? "Salvando..." : "Salvar aporte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({ goal, onUpdated }: { goal: Goal; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [contributionModal, setContributionModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return;
    setDeleting(true);
    try {
      await goalAPI.delete(goal.id);
      onUpdated();
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!confirm("Remover este aporte?")) return;
    await goalAPI.deleteContribution(id);
    onUpdated();
  };

  const statusColor = goal.isCompleted
    ? "border-emerald-200 bg-emerald-50/30"
    : "border-border bg-card";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${statusColor}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
          {iconEmoji(goal.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-foreground truncate">{goal.name}</p>
            {goal.isCompleted && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Concluída ✓
              </span>
            )}
          </div>
          {goal.deadline && (
            <p className="text-xs text-muted-foreground">
              Prazo: {new Date(goal.deadline + "T12:00:00").toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{formatCurrencyBRL(goal.currentAmount)} investido</span>
          <span className="font-semibold">{goal.progressPct.toFixed(0)}%</span>
        </div>
        <ProgressBar
          value={goal.progressPct}
          status={goal.isCompleted ? "safe" : null}
          height={8}
        />
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-muted-foreground">
            Restam {formatCurrencyBRL(goal.remaining)}
          </span>
          <span className="font-semibold text-foreground">
            Meta: {formatCurrencyBRL(goal.targetAmount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!goal.isCompleted && (
          <button
            onClick={() => setContributionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Aporte
          </button>
        )}
        {goal.contributions.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {goal.contributions.length} aporte{goal.contributions.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Contributions history */}
      {expanded && goal.contributions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {goal.contributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between group">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {formatCurrencyBRL(c.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDeleteContribution(c.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddContributionModal
        goalId={goal.id}
        goalName={goal.name}
        open={contributionModal}
        onClose={() => setContributionModal(false)}
        onSaved={onUpdated}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded-2xl ${className}`} />
);

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setGoals(await goalAPI.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);
  const totalInvested = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Metas</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova meta
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Investido</p>
          <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(totalInvested)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">Metas Ativas</p>
          <p className="text-2xl font-bold text-blue-600">{active.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Concluídas</p>
          <p className="text-2xl font-bold text-emerald-600">{completed.length}</p>
        </div>
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">🎯</p>
          <p className="text-base font-semibold text-foreground">Nenhuma meta ainda</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Crie sua primeira meta financeira e acompanhe seu progresso com aportes.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            Criar meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdated={load} />
          ))}
        </div>
      )}

      <NewGoalModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </AppLayout>
  );
}
