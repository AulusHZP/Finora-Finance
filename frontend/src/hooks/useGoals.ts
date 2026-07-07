import { useState, useCallback, useEffect } from "react";
import { goalAPI, type CreateGoalPayload, type Goal } from "@/services/api";

export type { Goal, CreateGoalPayload };

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

  const createGoal = useCallback(async (goal: CreateGoalPayload) => {
    try {
      const newGoal = await goalAPI.createGoal(goal);
      setGoals((prev) => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar objetivo";
      setError(message);
      throw err;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<CreateGoalPayload>) => {
    try {
      const updatedGoal = await goalAPI.updateGoal(id, updates);
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? updatedGoal : goal))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar objetivo";
      setError(message);
      throw err;
    }
  }, []);

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

  // The server applies the increment atomically, so concurrent contributions
  // (two tabs/devices) can't overwrite each other.
  const addContribution = useCallback(async (id: string, amount: number) => {
    try {
      const updatedGoal = await goalAPI.contribute(id, amount);
      setGoals((prev) =>
        prev.map((goal) => (goal.id === id ? updatedGoal : goal))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao adicionar contribuição";
      setError(message);
      throw err;
    }
  }, []);

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
