/**
 * alertService.ts
 *
 * Calculates category budget statuses.
 * CRITICAL: All guard clauses must be explicit — never divide by null or zero.
 */

import { Decimal } from "@prisma/client/runtime/library";

export type CategoryStatus = "safe" | "warning" | "danger" | null;

/**
 * Returns the budget status for a category.
 *
 * @param spent       - Total spent in the category this month (always >= 0)
 * @param limit       - Category budget limit. NULL means no limit defined → return null.
 * @param alertThreshold - Percentage at which "warning" fires (default 80)
 * @returns "danger" if spent >= limit, "warning" if spent >= threshold%, "safe" otherwise.
 *          Returns null if no limit is defined (limitAmount IS NULL in DB).
 */
export function getCategoryStatus(
  spent: Decimal | number,
  limit: Decimal | number | null,
  alertThreshold: number = 80
): CategoryStatus {
  // Guard clause: no limit → no status (shown as "Defina um limite")
  if (limit === null || limit === undefined) return null;

  const spentNum = Number(spent);
  const limitNum = Number(limit);

  // Guard clause: limit <= 0 is invalid data — treat as no limit
  if (limitNum <= 0) return null;

  const pct = (spentNum / limitNum) * 100;

  if (pct >= 100) return "danger";
  if (pct >= alertThreshold) return "warning";
  return "safe";
}

export type CategoryBudgetSummary = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number;
  limit: number | null;
  usagePct: number | null;
  status: CategoryStatus;
  remaining: number | null;
};

/**
 * Builds a full budget summary for each category in a MonthlyBudget.
 *
 * @param categoryBudgets - CategoryBudget rows joined with Category
 * @param spentByCategoryId - Map<categoryId, totalSpent> for the month
 * @param alertThreshold - From MonthlyBudget.alertThreshold
 */
export function buildCategoryBudgetSummaries(
  categoryBudgets: Array<{
    categoryId: string;
    limitAmount: Decimal | null;
    category: {
      name: string;
      icon: string;
      color: string;
    };
  }>,
  spentByCategoryId: Map<string, number>,
  alertThreshold: number
): CategoryBudgetSummary[] {
  return categoryBudgets.map((cb) => {
    const spent = spentByCategoryId.get(cb.categoryId) ?? 0;
    const limit = cb.limitAmount !== null ? Number(cb.limitAmount) : null;
    const usagePct = limit !== null && limit > 0 ? (spent / limit) * 100 : null;
    const remaining = limit !== null ? limit - spent : null;

    return {
      categoryId: cb.categoryId,
      categoryName: cb.category.name,
      categoryIcon: cb.category.icon,
      categoryColor: cb.category.color,
      spent,
      limit,
      usagePct,
      status: getCategoryStatus(spent, limit, alertThreshold),
      remaining,
    };
  });
}
