import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

export const createGoal = async (data: {
  userId: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate?: Date;
  priority?: string;
}) => {
  return prisma.goal.create({
    data,
  });
};

export const getGoalsByUserId = async (userId: string) => {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

/** Fetches a goal, enforcing that it exists and belongs to the given user. */
export const getOwnedGoalById = async (id: string, userId: string) => {
  const goal = await prisma.goal.findUnique({
    where: { id },
  });

  if (!goal) {
    throw new HttpError(404, "Goal not found");
  }

  if (goal.userId !== userId) {
    throw new HttpError(403, "Forbidden");
  }

  return goal;
};

export const updateGoal = async (
  id: string,
  data: {
    title?: string;
    current?: number;
    target?: number;
    emoji?: string;
    targetDate?: Date | null;
    priority?: string | null;
  }
) => {
  return prisma.goal.update({
    where: { id },
    data,
  });
};

/**
 * Adds a contribution atomically. Using increment (instead of read-modify-write
 * on the client) prevents lost updates when two contributions race.
 */
export const contributeToGoal = async (id: string, userId: string, amount: number) => {
  await getOwnedGoalById(id, userId);

  return prisma.goal.update({
    where: { id },
    data: { current: { increment: amount } },
  });
};

export const deleteGoal = async (id: string) => {
  return prisma.goal.delete({
    where: { id },
  });
};
