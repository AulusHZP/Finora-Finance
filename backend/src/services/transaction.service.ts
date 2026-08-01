/**
 * transaction.service.ts
 *
 * Rebuilt for new schema:
 * - amount: Decimal(12,2) — no float
 * - categoryId: always required (Receitas = a category with isIncome=true)
 * - date: YYYY-MM-DD string (no timezone drift)
 * - no method, no isFixed, no recurringTransactionId
 */

import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateTransactionInput = {
  categoryId: string;
  description: string;
  amount: number; // always positive
  date: string;   // YYYY-MM-DD
};

type UpdateTransactionInput = Partial<CreateTransactionInput>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validates that the category exists and belongs to the user. */
const validateCategory = async (categoryId: string, userId: string) => {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new HttpError(404, "Categoria não encontrada");
  return cat;
};

/** Validates YYYY-MM-DD format. */
const validateDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, "Data inválida. Use o formato YYYY-MM-DD");
  }
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getTransactionsByUserId = async (
  userId: string,
  filters?: { year?: number; month?: number; categoryId?: string }
) => {
  let dateFilter: { gte?: string; lt?: string } | undefined;

  if (filters?.year && filters?.month) {
    const y = filters.year;
    const m = String(filters.month).padStart(2, "0");
    const nextMonth = filters.month === 12 ? 1 : filters.month + 1;
    const nextYear = filters.month === 12 ? y + 1 : y;
    const nm = String(nextMonth).padStart(2, "0");
    dateFilter = {
      gte: `${y}-${m}-01`,
      lt: `${nextYear}-${nm}-01`,
    };
  }

  return prisma.transaction.findMany({
    where: {
      userId,
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true, isIncome: true },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
};

export const getTransactionById = async (id: string, userId: string) => {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true, isIncome: true } },
    },
  });
  if (!tx) throw new HttpError(404, "Transação não encontrada");
  return tx;
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createTransaction = async (userId: string, input: CreateTransactionInput) => {
  validateDate(input.date);
  if (input.amount <= 0) throw new HttpError(400, "O valor deve ser positivo");
  await validateCategory(input.categoryId, userId);

  return prisma.transaction.create({
    data: {
      userId,
      categoryId: input.categoryId,
      description: input.description.trim(),
      amount: input.amount,
      date: input.date,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true, isIncome: true } },
    },
  });
};

export const updateTransaction = async (
  id: string,
  userId: string,
  input: UpdateTransactionInput
) => {
  const tx = await getTransactionById(id, userId);

  if (input.date) validateDate(input.date);
  if (input.amount !== undefined && input.amount <= 0) {
    throw new HttpError(400, "O valor deve ser positivo");
  }
  if (input.categoryId && input.categoryId !== tx.categoryId) {
    await validateCategory(input.categoryId, userId);
  }

  return prisma.transaction.update({
    where: { id },
    data: {
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.date ? { date: input.date } : {}),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true, isIncome: true } },
    },
  });
};

export const deleteTransaction = async (id: string, userId: string) => {
  await getTransactionById(id, userId);
  await prisma.transaction.delete({ where: { id } });
  return { success: true };
};

// ─── Aggregations ─────────────────────────────────────────────────────────────

/**
 * Returns a map of categoryId → totalSpent for expense transactions in a month.
 * Excludes income categories (isIncome=true).
 */
export const getSpentByCategoryForMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<Map<string, number>> => {
  const y = year;
  const m = String(month).padStart(2, "0");
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? y + 1 : y;
  const nm = String(nextMonth).padStart(2, "0");

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: `${y}-${m}-01`, lt: `${nextYear}-${nm}-01` },
      category: { isIncome: false },
    },
    select: { categoryId: true, amount: true },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const prev = map.get(row.categoryId) ?? 0;
    map.set(row.categoryId, prev + Number(row.amount));
  }
  return map;
};

/**
 * Returns cumulative daily spending for a month (for the LineChart).
 * Returns an array of { day: number, cumulative: number } for days 1..daysInMonth.
 */
export const getCumulativeDailySpending = async (
  userId: string,
  year: number,
  month: number
): Promise<{ day: number; cumulative: number }[]> => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const y = year;
  const m = String(month).padStart(2, "0");
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? y + 1 : y;
  const nm = String(nextMonth).padStart(2, "0");

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: `${y}-${m}-01`, lt: `${nextYear}-${nm}-01` },
      category: { isIncome: false },
    },
    select: { date: true, amount: true },
    orderBy: { date: "asc" },
  });

  // Group by day number
  const byDay = new Map<number, number>();
  for (const row of rows) {
    const day = parseInt(row.date.split("-")[2], 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.amount));
  }

  // Build cumulative array
  const result: { day: number; cumulative: number }[] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    cumulative += byDay.get(day) ?? 0;
    result.push({ day, cumulative });
  }
  return result;
};
