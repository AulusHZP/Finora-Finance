import type { Goal } from "@/hooks/useGoals";
import { Trash2, Edit2 } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";

interface GoalsListProps {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
}

export function GoalsList({
  goals,
  selectedGoalId,
  onSelectGoal,
  onDeleteGoal,
  onEditGoal,
}: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-muted-foreground text-sm">Nenhum objetivo ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
      {goals.map((goal) => {
        const pct = Math.round((goal.current / goal.target) * 100);
        const isSelected = selectedGoalId === goal.id;

        return (
          <div
            key={goal.id}
            onClick={() => onSelectGoal(goal.id)}
            className={`p-3 rounded-lg cursor-pointer transition-default press-scale ${
              isSelected ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted/80"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{goal.emoji}</span>
                  <p className="text-sm font-semibold text-foreground truncate">{goal.title}</p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatCurrencyBRL(goal.current)} / {formatCurrencyBRL(goal.target)}</span>
                  <span className="font-semibold text-primary">{pct}%</span>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditGoal(goal);
                  }}
                  className="h-7 w-7 rounded-md bg-muted/80 hover:bg-muted flex items-center justify-center press-scale text-muted-foreground hover:text-foreground transition-default"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGoal(goal.id);
                  }}
                  className="h-7 w-7 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center press-scale text-destructive transition-default"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
