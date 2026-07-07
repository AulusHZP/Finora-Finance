import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

/**
 * Finds the "Outro" fallback category, creating it if missing.
 * The re-find after a failed create handles concurrent requests racing to
 * create it at the same time (the schema cannot enforce uniqueness here
 * because parentId is NULL for root categories).
 */
const findOrCreateOutroCategory = async () => {
  const existing = await prisma.category.findFirst({ where: { name: "Outro", parentId: null } });
  if (existing) return existing;

  try {
    return await prisma.category.create({
      data: { name: "Outro", type: "expense", emoji: "📌" }
    });
  } catch {
    const raced = await prisma.category.findFirst({ where: { name: "Outro", parentId: null } });
    if (raced) return raced;
    throw new Error("Failed to resolve fallback category");
  }
};

/** Resolves a category name to its ID, searching parents and subcategories. */
export const resolveCategoryId = async (name: string): Promise<string | null> => {
  if (!name) return null;

  // Try main category first, then any subcategory
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing.id;

  // Fallback seguro: categoria desconhecida (ou "Outro"/"Outros") cai em "Outro"
  const fallback = await findOrCreateOutroCategory();
  return fallback.id;
};

export const getCategories = async () => {
  const mainCategories = await prisma.category.findMany({
    where: { parentId: null },
    include: { subcategories: true }
  });
  return mainCategories;
};

type CreateTransactionInput = {
  userId: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  isFixed?: boolean;
  category: string;
  method: string;
  date: Date;
};

type UpdateTransactionInput = {
  title?: string;
  amount?: number;
  type?: "income" | "expense";
  isFixed?: boolean;
  category?: string;
  method?: string;
  date?: Date;
};

export const createTransaction = async (input: CreateTransactionInput) => {
  const categoryId = input.category ? await resolveCategoryId(input.category) : null;

  const transaction = await prisma.transaction.create({
    data: {
      userId: input.userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      isFixed: input.isFixed ?? false,
      categoryId,
      method: input.method,
      date: input.date
    },
    include: { category: true }
  });

  return {
    ...transaction,
    category: transaction.category?.name || ""
  };
};

export const createTransactionsBulk = async (inputs: CreateTransactionInput[]) => {
  if (inputs.length === 0) {
    return { count: 0 };
  }

  // Resolve each distinct category name once (instead of once per row),
  // then insert everything in a single createMany.
  const distinctNames = [...new Set(inputs.map((input) => input.category).filter(Boolean))];
  const categoryIdByName = new Map<string, string | null>();

  for (const name of distinctNames) {
    categoryIdByName.set(name, await resolveCategoryId(name));
  }

  const result = await prisma.transaction.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      isFixed: input.isFixed ?? false,
      categoryId: input.category ? categoryIdByName.get(input.category) ?? null : null,
      method: input.method,
      date: input.date
    }))
  });

  return { count: result.count };
};

export const deleteImportedTransactionsByUser = async (userId: string) => {
  const result = await prisma.transaction.deleteMany({
    where: {
      userId,
      method: "Importação CSV"
    }
  });

  return result;
};

export const getTransactionsByUserId = async (userId: string) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { category: true }
  });

  return transactions.map(t => ({
    ...t,
    category: t.category?.name || "Outros"
  }));
};

export const getTransactionById = async (transactionId: string, userId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new HttpError(404, "Transaction not found");
  }

  return transaction;
};

export const updateTransaction = async (transactionId: string, userId: string, data: UpdateTransactionInput) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new HttpError(404, "Transaction not found");
  }

  const { category, ...rest } = data;
  const categoryId = category !== undefined ? await resolveCategoryId(category) : undefined;

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...rest,
      ...(categoryId !== undefined ? { categoryId } : {})
    },
    include: { category: true }
  });

  return {
    ...updated,
    category: updated.category?.name || ""
  };
};

export const deleteTransaction = async (transactionId: string, userId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId
    }
  });

  if (!transaction) {
    throw new HttpError(404, "Transaction not found");
  }

  await prisma.transaction.delete({
    where: { id: transactionId }
  });

  return { success: true };
};
