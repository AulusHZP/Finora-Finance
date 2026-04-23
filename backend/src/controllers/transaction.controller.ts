import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createTransaction,
  createTransactionsBulk,
  deleteImportedTransactionsByUser,
  getTransactionsByUserId,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from "../services/transaction.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { ok } from "../utils/http";

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
    console.log("Creating transaction, body:", JSON.stringify(req.body, null, 2));
    
    const userId = req.user?.id;
    console.log("User ID from auth:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const payload = createTransactionSchema.parse(req.body);
    console.log("Validated payload:", JSON.stringify(payload, null, 2));
    const installmentCount = payload.installmentCount ?? 1;
    const shouldCreateInstallments = payload.method === "Crédito" && payload.type === "expense" && installmentCount > 1;

    const transaction = shouldCreateInstallments
      ? await createInstallmentTransactions({
          userId,
          title: payload.title,
          totalAmount: payload.amount,
          type: payload.type,
          isFixed: payload.isFixed ?? false,
          category: payload.category,
          method: payload.method,
          date: new Date(payload.date),
          installmentCount
        })
      : await createTransaction({
          userId,
          title: payload.title,
          amount: payload.amount,
          type: payload.type,
          isFixed: payload.isFixed ?? false,
          category: payload.category,
          method: payload.method,
          date: new Date(payload.date)
        });

    console.log("Transaction created:", JSON.stringify(transaction, null, 2));
    invalidateDashboardCache(userId);
    return res.status(201).json(ok("Transaction created successfully", transaction));
  } catch (error) {
    console.error("Error in createTransactionController:", error);
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

const addMonths = (date: Date, monthsToAdd: number) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
  return nextDate;
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
      date: addMonths(input.date, installmentIndex)
    });

    created.push(transaction);
  }

  return created[0];
};

export const getTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const transactions = await getTransactionsByUserId(userId);

    return res.status(200).json(ok("Transactions fetched successfully", { transactions }));
  } catch (error) {
    return next(error);
  }
};

export const clearImportedTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await deleteImportedTransactionsByUser(userId);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Imported CSV transactions deleted successfully", { deleted: result.count }));
  } catch (error) {
    return next(error);
  }
};

export const importTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

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
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const transaction = await getTransactionById(id, userId);

    return res.status(200).json(ok("Transaction fetched successfully", transaction));
  } catch (error) {
    return next(error);
  }
};

export const updateTransactionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const payload = updateTransactionSchema.parse(req.body);
    const data: any = {};

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
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await deleteTransaction(id, userId);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Transaction deleted successfully"));
  } catch (error) {
    return next(error);
  }
};
