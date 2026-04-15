import { useState, useCallback } from "react";

export interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
}

const initialGoals: Goal[] = [
  { id: "1", title: "New MacBook", current: 1200, target: 2500, emoji: "💻", priority: "high", createdAt: new Date().toISOString() },
  { id: "2", title: "Vacation Fund", current: 3400, target: 5000, emoji: "✈️", priority: "medium", createdAt: new Date().toISOString() },
  { id: "3", title: "Emergency Fund", current: 8200, target: 10000, emoji: "🛡️", priority: "high", createdAt: new Date().toISOString() },
  { id: "4", title: "New Car", current: 5000, target: 30000, emoji: "🚗", priority: "low", createdAt: new Date().toISOString() },
];

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const createGoal = useCallback((goal: Omit<Goal, "id" | "createdAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Omit<Goal, "id" | "createdAt">>) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const addContribution = useCallback((id: string, amount: number) => {
    updateGoal(id, { current: (goals.find((g) => g.id === id)?.current || 0) + amount });
  }, [goals, updateGoal]);

  return { goals, createGoal, updateGoal, deleteGoal, addContribution };
}
