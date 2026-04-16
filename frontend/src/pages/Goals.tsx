import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CreateGoalDialog } from "@/components/CreateGoalDialog";
import { GoalsList } from "@/components/GoalsList";
import { GoalDetails } from "@/components/GoalDetails";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/hooks/useGoals";
import { Plus } from "lucide-react";

const Goals = () => {
  const { goals, createGoal, updateGoal, deleteGoal, addContribution } = useGoals();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals.length > 0 ? goals[0].id : null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null;

  const handleCreateGoal = async (goalData: Omit<Goal, "id" | "createdAt">) => {
    const newGoal = await createGoal(goalData);
    setSelectedGoalId(newGoal.id);
    setCreateDialogOpen(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setCreateDialogOpen(true);
  };

  const handleUpdateGoal = async (goalData: Omit<Goal, "id" | "createdAt">) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
      setEditingGoal(null);
      setCreateDialogOpen(false);
    }
  };

  const handleSaveGoal = async (goalData: Omit<Goal, "id" | "createdAt">) => {
    if (editingGoal) {
      await handleUpdateGoal(goalData);
    } else {
      await handleCreateGoal(goalData);
    }
  };

  const handleAddContribution = async (amount: number) => {
    if (selectedGoalId) {
      await addContribution(selectedGoalId, amount);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    if (selectedGoalId === id) {
      setSelectedGoalId(goals.find((g) => g.id !== id)?.id || null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Objetivos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe suas metas de economia</p>
          </div>
          <button
            onClick={() => {
              setEditingGoal(null);
              setCreateDialogOpen(true);
            }}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Criar Objetivo</span>
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Você ainda não tem objetivos</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-sm">
            Crie seu primeiro objetivo para começar a acompanhar sua jornada financeira
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              setCreateDialogOpen(true);
            }}
            className="h-10 px-6 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default"
          >
            Criar Seu Primeiro Objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Goals List (Left) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 h-full">
              <h3 className="text-sm font-semibold text-foreground mb-4">Seus Objetivos</h3>
              <GoalsList
                goals={goals}
                selectedGoalId={selectedGoalId}
                onSelectGoal={setSelectedGoalId}
                onDeleteGoal={handleDeleteGoal}
                onEditGoal={handleEditGoal}
              />
            </div>
          </div>

          {/* Goal Details (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border border-border h-full overflow-hidden">
              <GoalDetails goal={selectedGoal} onAddContribution={handleAddContribution} />
            </div>
          </div>
        </div>
      )}

      <CreateGoalDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal || undefined}
      />
    </AppLayout>
  );
};

export default Goals;
