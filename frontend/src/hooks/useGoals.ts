import { useState, useCallback, useEffect } from "react";
import { goalAPI, type CreateGoalPayload } from "@/services/api";

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
  userId?: string;
  updatedAt?: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalAPI.getGoals();
      setGoals(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar objetivos";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const createGoal = useCallback(
    async (goal: Omit<Goal, "id" | "createdAt" | "userId" | "updatedAt">) => {
      try {
        const newGoal = await goalAPI.createGoal({
          title: goal.title,
          current: goal.current,
          target: goal.target,
          emoji: goal.emoji,
          targetDate: goal.targetDate,
          priority: goal.priority,
        });
        setGoals((prev) => [newGoal, ...prev]);
        return newGoal;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar objetivo";
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateGoal = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Goal, "id" | "createdAt" | "userId" | "updatedAt">>
    ) => {
      try {
        const updatedGoal = await goalAPI.updateGoal(id, updates as Partial<CreateGoalPayload>);
        setGoals((prev) =>
          prev.map((goal) => (goal.id === id ? updatedGoal : goal))
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar objetivo";
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await goalAPI.deleteGoal(id);
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao deletar objetivo";
      setError(message);
      throw err;
    }
  }, []);

  const addContribution = useCallback(
    async (id: string, amount: number) => {
      const goal = goals.find((g) => g.id === id);
      if (goal) {
        await updateGoal(id, { current: goal.current + amount });
      }
    },
    [goals, updateGoal]
  );

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    loading,
    error,
  };
}
