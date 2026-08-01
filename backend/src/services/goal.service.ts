/**
 * goal.service.ts
 *
 * Rebuilt for new schema:
 * - GoalContribution replaces the mutable `current` float field
 * - isCompleted is auto-set when sum(contributions) >= targetAmount
 * - amount stored as Decimal(12,2), no float
 */

import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateGoalInput = {
  name: string;
  icon: string;
  targetAmount: number;
  deadline?: string | null; // YYYY-MM-DD or null
};

type UpdateGoalInput = Partial<CreateGoalInput>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns total contributions for a goal and auto-completes if threshold reached. */
const syncGoalCompletion = async (goalId: string) => {
  const contributions = await prisma.goalContribution.findMany({
    where: { goalId },
    select: { amount: true },
  });

  const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { targetAmount: true, isCompleted: true },
  });

  if (!goal) return;

  const shouldBeCompleted = totalContributed >= Number(goal.targetAmount);

  if (shouldBeCompleted !== goal.isCompleted) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isCompleted: shouldBeCompleted },
    });
  }

  return totalContributed;
};

/** Fetches a goal and validates ownership. */
const getOwnedGoal = async (id: string, userId: string) => {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new HttpError(404, "Meta não encontrada");
  return goal;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getGoalsByUserId = async (userId: string) => {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: {
      contributions: { orderBy: { date: "desc" } },
    },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
  });

  return goals.map((goal) => {
    const currentAmount = goal.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const progressPct =
      Number(goal.targetAmount) > 0
        ? Math.min((currentAmount / Number(goal.targetAmount)) * 100, 100)
        : 0;

    return {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount,
      progressPct,
      remaining: Math.max(Number(goal.targetAmount) - currentAmount, 0),
      contributions: goal.contributions.map((c) => ({
        ...c,
        amount: Number(c.amount),
      })),
    };
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createGoal = async (userId: string, input: CreateGoalInput) => {
  if (input.targetAmount <= 0) {
    throw new HttpError(400, "O valor alvo deve ser maior que zero");
  }

  return prisma.goal.create({
    data: {
      userId,
      name: input.name.trim(),
      icon: input.icon,
      targetAmount: input.targetAmount,
      deadline: input.deadline ?? null,
      isCompleted: false,
    },
  });
};

export const updateGoal = async (id: string, userId: string, input: UpdateGoalInput) => {
  await getOwnedGoal(id, userId);

  if (input.targetAmount !== undefined && input.targetAmount <= 0) {
    throw new HttpError(400, "O valor alvo deve ser maior que zero");
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
    },
  });

  // Re-check completion status after target change
  await syncGoalCompletion(id);

  return updated;
};

export const deleteGoal = async (id: string, userId: string) => {
  await getOwnedGoal(id, userId);
  await prisma.goal.delete({ where: { id } });
  return { success: true };
};

// ─── GoalContributions ────────────────────────────────────────────────────────

export const addContribution = async (
  goalId: string,
  userId: string,
  input: { amount: number; date: string; note?: string }
) => {
  await getOwnedGoal(goalId, userId);

  if (input.amount <= 0) {
    throw new HttpError(400, "O valor do aporte deve ser maior que zero");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new HttpError(400, "Data inválida. Use o formato YYYY-MM-DD");
  }

  const contribution = await prisma.goalContribution.create({
    data: {
      goalId,
      amount: input.amount,
      date: input.date,
      note: input.note?.trim() ?? null,
    },
  });

  // Auto-complete goal if threshold reached
  await syncGoalCompletion(goalId);

  return { ...contribution, amount: Number(contribution.amount) };
};

export const deleteContribution = async (contributionId: string, userId: string) => {
  const contribution = await prisma.goalContribution.findFirst({
    where: { id: contributionId },
    include: { goal: { select: { userId: true } } },
  });

  if (!contribution) throw new HttpError(404, "Aporte não encontrado");
  if (contribution.goal.userId !== userId) throw new HttpError(403, "Sem permissão");

  await prisma.goalContribution.delete({ where: { id: contributionId } });

  // Re-check completion status after contribution removal
  await syncGoalCompletion(contribution.goalId);

  return { success: true };
};
