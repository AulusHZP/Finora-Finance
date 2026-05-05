import { prisma } from "../config/prisma";

/** Resolves a category name to its ID, searching parents and subcategories. */
const resolveCategoryId = async (name: string): Promise<string | null> => {
  if (!name) return null;
  // Try main category first, then any subcategory
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing.id;
  // Create as a top-level category if not found
  const created = await prisma.category.create({ data: { name } });
  return created.id;
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

  // createMany doesn't support nested relations — create one by one
  const results = await Promise.all(inputs.map((input) => createTransaction(input)));
  return { count: results.length };
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
    const err = new Error("Transaction not found");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
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
    const err = new Error("Transaction not found");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
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
    const err = new Error("Transaction not found");
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  await prisma.transaction.delete({
    where: { id: transactionId }
  });

  return { success: true };
};
