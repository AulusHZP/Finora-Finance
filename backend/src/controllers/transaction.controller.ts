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
import { ok } from "../utils/http";

const createTransactionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  isFixed: z.boolean().optional(),
  category: z.string().trim().min(1, "Category is required"),
  method: z.string().trim().min(1, "Method is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
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

    console.log("Transaction created:", JSON.stringify(transaction, null, 2));
    return res.status(201).json(ok("Transaction created successfully", transaction));
  } catch (error) {
    console.error("Error in createTransactionController:", error);
    return next(error);
  }
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

    return res.status(200).json(ok("Transaction deleted successfully"));
  } catch (error) {
    return next(error);
  }
};
