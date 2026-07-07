import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createTransaction,
  createTransactionsBulk,
  deleteImportedTransactionsByUser,
  getTransactionsByUserId,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getCategories
} from "../services/transaction.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { materializeDueRecurringTransactions } from "../services/recurring.service";
import { addMonthsClamped } from "../utils/dates";
import { ok } from "../utils/http";
import { requireUserId } from "../utils/request";

const createTransactionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  isFixed: z.boolean().optional(),
  category: z.string().trim().min(1, "Category is required"),
  method: z.string().trim().min(1, "Method is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  installmentCount: z.number().int().min(1).max(48).optional()
});

const updateTransactionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255).optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  type: z.enum(["income", "expense"]).optional(),
  isFixed: z.boolean().optional(),
  category: z.string().trim().min(1, "Category is required").optional(),
  method: z.string().trim().min(1, "Method is required").optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional()
});

const importTransactionsSchema = z.object({
  transactions: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Title is required").max(255),
        amount: z.number().positive("Amount must be greater than 0"),
        type: z.enum(["income", "expense"]),
        isFixed: z.boolean().optional(),
        category: z.string().trim().min(1, "Category is required"),
        method: z.string().trim().min(1, "Method is required"),
        date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
      })
    )
    .min(1, "At least one transaction is required")
    .max(2000, "CSV import limit is 2000 transactions per request")
});

export const createTransactionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = createTransactionSchema.parse(req.body);
    const installmentCount = payload.installmentCount ?? 1;
    const shouldCreateInstallments = payload.method === "Crédito" && payload.type === "expense" && installmentCount > 1;

    if (shouldCreateInstallments) {
      const transactions = await createInstallmentTransactions({
        userId,
        title: payload.title,
        totalAmount: payload.amount,
        type: payload.type,
        isFixed: payload.isFixed ?? false,
        category: payload.category,
        method: payload.method,
        date: new Date(payload.date),
        installmentCount
      });
      invalidateDashboardCache(userId);
      return res.status(201).json(ok(`${transactions.length} parcelas criadas com sucesso`, {
        transactions,
        count: transactions.length
      }));
    }

    const transaction = await createTransaction({
      userId,
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      isFixed: payload.isFixed ?? false,
      category: payload.category,
      method: payload.method,
      date: new Date(payload.date)
    });

    invalidateDashboardCache(userId);

    return res.status(201).json(ok("Transaction created successfully", transaction));
  } catch (error) {
    return next(error);
  }
};

type CreateInstallmentTransactionsInput = {
  userId: string;
  title: string;
  totalAmount: number;
  type: "income" | "expense";
  isFixed: boolean;
  category: string;
  method: string;
  date: Date;
  installmentCount: number;
};

const splitAmountInCents = (totalAmount: number, installmentCount: number) => {
  const totalCents = Math.round(totalAmount * 100);
  const baseInstallmentCents = Math.floor(totalCents / installmentCount);
  const remainderCents = totalCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => {
    const cents = baseInstallmentCents + (index < remainderCents ? 1 : 0);
    return cents / 100;
  });
};

const createInstallmentTransactions = async (input: CreateInstallmentTransactionsInput) => {
  const installmentAmounts = splitAmountInCents(input.totalAmount, input.installmentCount);
  const created = [];

  for (let installmentIndex = 0; installmentIndex < input.installmentCount; installmentIndex += 1) {
    const transaction = await createTransaction({
      userId: input.userId,
      title: `${input.title} (${installmentIndex + 1}/${input.installmentCount})`,
      amount: installmentAmounts[installmentIndex],
      type: input.type,
      isFixed: input.isFixed,
      category: input.category,
      method: input.method,
      date: addMonthsClamped(input.date, installmentIndex)
    });

    created.push(transaction);
  }

  return created;
};

export const getTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const materialized = await materializeDueRecurringTransactions(userId);
    if (materialized > 0) {
      invalidateDashboardCache(userId);
    }

    const transactions = await getTransactionsByUserId(userId);

    return res.status(200).json(ok("Transactions fetched successfully", { transactions }));
  } catch (error) {
    return next(error);
  }
};

export const clearImportedTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const result = await deleteImportedTransactionsByUser(userId);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Imported CSV transactions deleted successfully", { deleted: result.count }));
  } catch (error) {
    return next(error);
  }
};

export const importTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = importTransactionsSchema.parse(req.body);

    const result = await createTransactionsBulk(
      payload.transactions.map((transaction) => ({
        userId,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        isFixed: transaction.isFixed ?? false,
        category: transaction.category,
        method: transaction.method,
        date: new Date(transaction.date)
      }))
    );

    invalidateDashboardCache(userId);

    return res.status(201).json(ok("Transactions imported successfully", { imported: result.count }));
  } catch (error) {
    return next(error);
  }
};

export const getTransactionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    const transaction = await getTransactionById(id, userId);

    return res.status(200).json(ok("Transaction fetched successfully", transaction));
  } catch (error) {
    return next(error);
  }
};

export const getCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategories();
    return res.status(200).json(ok("Categories fetched successfully", categories));
  } catch (error) {
    return next(error);
  }
};

export const updateTransactionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    const payload = updateTransactionSchema.parse(req.body);
    const data: {
      title?: string;
      amount?: number;
      type?: "income" | "expense";
      isFixed?: boolean;
      category?: string;
      method?: string;
      date?: Date;
    } = {};

    if (payload.title) data.title = payload.title;
    if (payload.amount) data.amount = payload.amount;
    if (payload.type) data.type = payload.type;
    if (typeof payload.isFixed === "boolean") data.isFixed = payload.isFixed;
    if (payload.category) data.category = payload.category;
    if (payload.method) data.method = payload.method;
    if (payload.date) data.date = new Date(payload.date);

    const transaction = await updateTransaction(id, userId, data);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Transaction updated successfully", transaction));
  } catch (error) {
    return next(error);
  }
};

export const deleteTransactionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    await deleteTransaction(id, userId);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Transaction deleted successfully"));
  } catch (error) {
    return next(error);
  }
};
