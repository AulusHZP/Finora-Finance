import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

export const getGoalById = async (id: string) => {
  return prisma.goal.findUnique({
    where: { id },
  });
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

export const deleteGoal = async (id: string) => {
  return prisma.goal.delete({
    where: { id },
  });
};
