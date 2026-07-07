import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

export type BudgetStatus = {
  id: string;
  categoryId: string;
  categoryName: string;
  emoji: string;
  monthlyLimit: number;
  spent: number;
};

export const upsertBudget = async (userId: string, categoryId: string, monthlyLimit: number) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category) {
    throw new HttpError(404, "Category not found");
  }

  return prisma.budget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    create: { userId, categoryId, monthlyLimit },
    update: { monthlyLimit },
    include: { category: true }
  });
};

export const deleteBudget = async (userId: string, budgetId: string) => {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });

  if (!budget) {
    throw new HttpError(404, "Budget not found");
  }

  await prisma.budget.delete({ where: { id: budgetId } });
};

type TransactionForBudget = {
  amount: number;
  type: string;
  date: Date;
  category: { id: string; parentId: string | null } | null;
};

/**
 * Computes each budget's spending for the current calendar month. A budget on
 * a parent category also counts expenses recorded in its subcategories.
 */
export const buildBudgetStatuses = (
  budgets: Array<{ id: string; categoryId: string; monthlyLimit: number; category: { name: string; emoji: string } }>,
  transactions: TransactionForBudget[],
  reference: Date = new Date()
): BudgetStatus[] => {
  if (budgets.length === 0) return [];

  const monthStart = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));

  const spentByCategoryId = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.category) continue;
    if (tx.date < monthStart || tx.date >= nextMonthStart) continue;

    const amount = Math.abs(Number(tx.amount) || 0);
    spentByCategoryId.set(tx.category.id, (spentByCategoryId.get(tx.category.id) ?? 0) + amount);
    if (tx.category.parentId) {
      spentByCategoryId.set(
        tx.category.parentId,
        (spentByCategoryId.get(tx.category.parentId) ?? 0) + amount
      );
    }
  }

  return budgets.map((budget) => ({
    id: budget.id,
    categoryId: budget.categoryId,
    categoryName: budget.category.name,
    emoji: budget.category.emoji,
    monthlyLimit: budget.monthlyLimit,
    spent: spentByCategoryId.get(budget.categoryId) ?? 0
  }));
};

export const getBudgetsByUserId = async (userId: string) => {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "asc" }
  });
};
