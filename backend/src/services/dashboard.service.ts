/**
 * dashboard.service.ts
 *
 * Rebuilt for new schema:
 * - No method, no isFixed, no recurringTransactions
 * - income/expense determined by category.isIncome
 * - date is YYYY-MM-DD string (no UTC drift)
 * - amount is Decimal(12,2), cast to Number for aggregation
 */

import { prisma } from "../config/prisma";
import { buildCategoryBudgetSummaries, type CategoryBudgetSummary } from "./alert.service";
import { getSpentByCategoryForMonth, getCumulativeDailySpending } from "./transaction.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    isIncome: boolean;
  };
};

export type DashboardSummary = {
  totalSpent: number;
  totalIncome: number;
  available: number | null; // null if no totalLimit set
  totalLimit: number | null;
};

export type DashboardData = {
  summary: DashboardSummary;
  alertCategories: CategoryBudgetSummary[]; // only warning/danger
  categoryBudgets: CategoryBudgetSummary[]; // all categories with limit
  donutData: { categoryId: string; name: string; color: string; amount: number }[];
  lineData: { day: number; cumulative: number }[];
  recentTransactions: DashboardTransaction[];
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const getDashboardData = async (
  userId: string,
  year: number,
  month: number
): Promise<DashboardData> => {
  const y = year;
  const m = String(month).padStart(2, "0");
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? y + 1 : y;
  const nm = String(nextMonth).padStart(2, "0");

  const dateRange = { gte: `${y}-${m}-01`, lt: `${nextYear}-${nm}-01` };

  // Parallel data fetching
  const [transactions, budget, spentMap, lineData] = await Promise.all([
    // All transactions for the month with full category info
    prisma.transaction.findMany({
      where: { userId, date: dateRange },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, isIncome: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),

    // Monthly budget with category budgets
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { categoryBudgets: { include: { category: true } } },
    }),

    // Pre-aggregated spending by category
    getSpentByCategoryForMonth(userId, year, month),

    // Cumulative daily spending for line chart
    getCumulativeDailySpending(userId, year, month),
  ]);

  // ── Summary ──────────────────────────────────────────────────────────────────
  let totalSpent = 0;
  let totalIncome = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.category.isIncome) {
      totalIncome += amount;
    } else {
      totalSpent += amount;
    }
  }

  const totalLimit = budget?.totalLimit !== undefined && budget?.totalLimit !== null
    ? Number(budget.totalLimit)
    : null;
  const available = totalLimit !== null ? totalLimit - totalSpent : null;

  // ── Category Budgets ─────────────────────────────────────────────────────────
  const alertThreshold = budget?.alertThreshold ?? 80;
  const categoryBudgets = budget
    ? buildCategoryBudgetSummaries(budget.categoryBudgets, spentMap, alertThreshold)
    : [];

  const alertCategories = categoryBudgets.filter(
    (cb) => cb.status === "warning" || cb.status === "danger"
  );

  // ── Donut Chart (expenses only, sorted by amount desc) ───────────────────────
  const donutData = Array.from(spentMap.entries())
    .map(([categoryId, amount]) => {
      const tx = transactions.find((t) => t.categoryId === categoryId);
      return {
        categoryId,
        name: tx?.category.name ?? "—",
        color: tx?.category.color ?? "#6B7280",
        amount,
      };
    })
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // ── Recent Transactions (last 6) ─────────────────────────────────────────────
  const recentTransactions: DashboardTransaction[] = transactions.slice(0, 6).map((tx) => ({
    id: tx.id,
    description: tx.description,
    amount: Number(tx.amount),
    date: tx.date,
    category: tx.category,
  }));

  return {
    summary: { totalSpent, totalIncome, available, totalLimit },
    alertCategories,
    categoryBudgets,
    donutData,
    lineData,
    recentTransactions,
  };
};
