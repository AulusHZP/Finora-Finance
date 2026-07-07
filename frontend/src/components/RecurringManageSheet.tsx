import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Repeat, Play, Pause, Trash2, AlertTriangle } from "lucide-react";
import { recurringAPI, type RecurringTransaction } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

interface RecurringManageSheetProps {
  open: boolean;
  onClose: () => void;
}

const formatNextRun = (iso: string) => {
  const datePart = iso.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
};

export function RecurringManageSheet({ open, onClose }: RecurringManageSheetProps) {
  const [recurrences, setRecurrences] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setLoading(true);
    recurringAPI
      .list()
      .then(setRecurrences)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar recorrências"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleToggleActive = async (recurring: RecurringTransaction) => {
    try {
      setBusyId(recurring.id);
      setError("");
      const updated = await recurringAPI.setActive(recurring.id, !recurring.active);
      setRecurrences((prev) => prev.map((r) => (r.id === recurring.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar recorrência");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (recurring: RecurringTransaction) => {
    const confirmed = window.confirm(
      `Excluir a recorrência "${recurring.title}"? As transações já lançadas serão mantidas.`
    );
    if (!confirmed) return;

    try {
      setBusyId(recurring.id);
      setError("");
      await recurringAPI.remove(recurring.id);
      setRecurrences((prev) => prev.filter((r) => r.id !== recurring.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir recorrência");
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/20 z-[999] animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-card rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-lg lg:w-full lg:p-6 lg:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Repeat className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Transações Recorrentes</h2>
              <p className="text-xs text-muted-foreground">Lançadas automaticamente todo mês</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center press-scale hover:bg-muted/80 transition-default flex-shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-3">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : recurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma recorrência criada. Ao adicionar uma transação, ative "Repetir todo mês".
          </p>
        ) : (
          <div className="space-y-2">
            {recurrences.map((recurring) => (
              <div
                key={recurring.id}
                className={`flex items-center gap-3 p-3 rounded-xl bg-muted/50 ${recurring.active ? "" : "opacity-60"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{recurring.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {recurring.type === "income" ? "+" : "-"}
                    {formatCurrencyBRL(recurring.amount)} • todo dia {recurring.dayOfMonth} • {recurring.method}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {recurring.active
                      ? `Próximo lançamento: ${formatNextRun(recurring.nextRunDate)}`
                      : "Pausada"}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleActive(recurring)}
                  disabled={busyId === recurring.id}
                  title={recurring.active ? "Pausar" : "Retomar"}
                  className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center press-scale hover:bg-hover transition-default disabled:opacity-50 shrink-0"
                >
                  {recurring.active ? (
                    <Pause className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-success" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(recurring)}
                  disabled={busyId === recurring.id}
                  title="Excluir"
                  className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center press-scale hover:bg-destructive/20 transition-default disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
