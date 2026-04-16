import { prisma } from "../config/prisma";

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
  const transaction = await prisma.transaction.create({
    data: {
      userId: input.userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      isFixed: input.isFixed ?? false,
      category: input.category,
      method: input.method,
      date: input.date
    }
  });

  return transaction;
};

export const createTransactionsBulk = async (inputs: CreateTransactionInput[]) => {
  if (inputs.length === 0) {
    return { count: 0 };
  }

  const result = await prisma.transaction.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      title: input.title,
      amount: input.amount,
      type: input.type,
      isFixed: input.isFixed ?? false,
      category: input.category,
      method: input.method,
      date: input.date
    }))
  });

  return result;
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
    orderBy: { date: "desc" }
  });

  return transactions;
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

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data
  });

  return updated;
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
