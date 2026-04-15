import { useState } from "react";
import { X } from "lucide-react";
import { Goal } from "@/hooks/useGoals";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, "id" | "createdAt">) => void;
  editingGoal?: Goal;
}

const emojis = ["💻", "✈️", "🛡️", "🚗", "🏠", "💍", "📚", "🎮", "🎵", "⚽", "🎬", "💰"];

export function CreateGoalDialog({ open, onClose, onSave, editingGoal }: CreateGoalDialogProps) {
  const [title, setTitle] = useState(editingGoal?.title || "");
  const [target, setTarget] = useState(editingGoal?.target?.toString() || "");
  const [current, setCurrent] = useState(editingGoal?.current?.toString() || "");
  const [emoji, setEmoji] = useState(editingGoal?.emoji || "💰");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(editingGoal?.priority || "medium");
  const [targetDate, setTargetDate] = useState(editingGoal?.targetDate || "");

  const handleSave = () => {
    if (!title.trim() || !target) {
      return;
    }

    onSave({
      title: title.trim(),
      target: parseFloat(target),
      current: current ? parseFloat(current) : 0,
      emoji,
      priority,
      targetDate: targetDate || undefined,
    });

    // Reset form
    setTitle("");
    setTarget("");
    setCurrent("");
    setEmoji("💰");
    setPriority("medium");
    setTargetDate("");
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 animate-slide-up lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-lg lg:w-full lg:pb-6 lg:shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">{editingGoal ? "Editar Objetivo" : "Criar Novo Objetivo"}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-muted flex items-center justify-center press-scale"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Goal Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do Objetivo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novo MacBook"
              className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
              autoFocus
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor Meta *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                $
              </span>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 bg-muted rounded-lg text-foreground text-base font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
              />
            </div>
          </div>

          {/* Current Saved Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor Economizado Atualmente</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                $
              </span>
              <input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 bg-muted rounded-lg text-foreground text-base font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Alvo</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prioridade</label>
            <div className="flex gap-1.5">
              {(["low", "medium", "high"] as const).map((p) => {
                const labels: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-default press-scale ${
                      priority === p
                        ? p === "high"
                          ? "bg-destructive/10 text-destructive"
                          : p === "medium"
                            ? "bg-primary/10 text-primary"
                            : "bg-success-light text-success"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 bg-muted text-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !target}
              className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default disabled:opacity-50"
            >
              {editingGoal ? "Atualizar Objetivo" : "Criar Objetivo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
