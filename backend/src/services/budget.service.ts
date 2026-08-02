/**
 * budget.service.ts
 *
 * Manages MonthlyBudget (total limit + alert threshold) and
 * CategoryBudget (per-category limits, nullable = no limit defined).
 */

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { buildCategoryBudgetSummaries, type CategoryBudgetSummary } from "./alert.service";
import { getSpentByCategoryForMonth } from "./transaction.service";

// ─── MonthlyBudget ────────────────────────────────────────────────────────────

export const getOrCreateMonthlyBudget = async (
  userId: string,
  year: number,
  month: number
) => {
  return prisma.monthlyBudget.upsert({
    where: { userId_year_month: { userId, year, month } },
    create: { userId, year, month, totalLimit: null, alertThreshold: 80 },
    update: {},
    include: { categoryBudgets: { include: { category: true } } },
  });
};

export const updateMonthlyBudget = async (
  userId: string,
  year: number,
  month: number,
  data: { totalLimit?: number | null; alertThreshold?: number }
) => {
  const budget = await getOrCreateMonthlyBudget(userId, year, month);

  if (data.alertThreshold !== undefined) {
    if (data.alertThreshold < 1 || data.alertThreshold > 99) {
      throw new HttpError(400, "alertThreshold deve ser entre 1 e 99");
    }
  }

  return prisma.monthlyBudget.update({
    where: { id: budget.id },
    data: {
      ...(data.totalLimit !== undefined ? { totalLimit: data.totalLimit } : {}),
      ...(data.alertThreshold !== undefined ? { alertThreshold: data.alertThreshold } : {}),
    },
  });
};

// ─── CategoryBudget ───────────────────────────────────────────────────────────

/**
 * Upserts a CategoryBudget limit.
 * Pass limitAmount=null to remove the limit ("Defina um limite").
 */
export const upsertCategoryBudget = async (
  userId: string,
  year: number,
  month: number,
  categoryId: string,
  limitAmount: number | null
) => {
  // Validate that category belongs to user
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new HttpError(404, "Categoria não encontrada");
  if (cat.isIncome) throw new HttpError(400, "Não é possível definir limite para a categoria Receitas");

  // Validate limitAmount: must be positive or null
  if (limitAmount !== null && limitAmount <= 0) {
    throw new HttpError(400, "O limite deve ser maior que zero, ou nulo para remover");
  }

  const budget = await getOrCreateMonthlyBudget(userId, year, month);

  return prisma.categoryBudget.upsert({
    where: {
      monthlyBudgetId_categoryId: {
        monthlyBudgetId: budget.id,
        categoryId,
      },
    },
    create: {
      monthlyBudgetId: budget.id,
      categoryId,
      limitAmount: limitAmount,
    },
    update: { limitAmount: limitAmount },
    include: { category: true },
  });
};

// ─── Full Limits Page Data ────────────────────────────────────────────────────

export type LimitsPageData = {
  year: number;
  month: number;
  totalLimit: number | null;
  alertThreshold: number;
  totalSpent: number;
  totalUsagePct: number | null;
  totalStatus: "safe" | "warning" | "danger" | null;
  inWarningCount: number;
  overLimitCount: number;
  categories: CategoryBudgetSummary[];
};

export const getLimitsData = async (
  userId: string,
  year: number,
  month: number
): Promise<LimitsPageData> => {
  const budget = await getOrCreateMonthlyBudget(userId, year, month);
  const spentMap = await getSpentByCategoryForMonth(userId, year, month);

  const totalLimit = budget.totalLimit !== null ? Number(budget.totalLimit) : null;
  const totalSpent = Array.from(spentMap.values()).reduce((a, b) => a + b, 0);
  const totalUsagePct = totalLimit !== null && totalLimit > 0
    ? (totalSpent / totalLimit) * 100
    : null;

  const totalStatus =
    totalLimit === null ? null
    : totalSpent >= totalLimit ? "danger"
    : totalUsagePct !== null && totalUsagePct >= budget.alertThreshold ? "warning"
    : "safe";

  const summaries = buildCategoryBudgetSummaries(
    budget.categoryBudgets,
    spentMap,
    budget.alertThreshold
  );

  return {
    year,
    month,
    totalLimit,
    alertThreshold: budget.alertThreshold,
    totalSpent,
    totalUsagePct,
    totalStatus,
    inWarningCount: summaries.filter((s) => s.status === "warning").length,
    overLimitCount: summaries.filter((s) => s.status === "danger").length,
    categories: summaries,
  };
};
