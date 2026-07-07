import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createRecurringTransaction,
  getRecurringByUserId,
  setRecurringActive,
  deleteRecurringTransaction,
  materializeDueRecurringTransactions
} from "../services/recurring.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { ok } from "../utils/http";
import { requireUserId } from "../utils/request";

const createRecurringSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  isFixed: z.boolean().optional(),
  category: z.string().trim().min(1, "Category is required"),
  method: z.string().trim().min(1, "Method is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format")
});

const setActiveSchema = z.object({
  active: z.boolean()
});

export const createRecurringController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = createRecurringSchema.parse(req.body);

    const recurring = await createRecurringTransaction({
      userId,
      title: payload.title,
      amount: payload.amount,
      type: payload.type,
      isFixed: payload.isFixed,
      category: payload.category,
      method: payload.method,
      firstDate: new Date(payload.date),
      endDate: payload.endDate ? new Date(payload.endDate) : undefined
    });

    // If the first occurrence is today or in the past, create it right away.
    const materialized = await materializeDueRecurringTransactions(userId);
    if (materialized > 0) {
      invalidateDashboardCache(userId);
    }

    return res.status(201).json(ok("Recurring transaction created successfully", { recurring, materialized }));
  } catch (error) {
    return next(error);
  }
};

export const getRecurringController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const recurring = await getRecurringByUserId(userId);

    return res.status(200).json(ok("Recurring transactions fetched successfully", { recurring }));
  } catch (error) {
    return next(error);
  }
};

export const setRecurringActiveController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    const payload = setActiveSchema.parse(req.body);
    const recurring = await setRecurringActive(id, userId, payload.active);

    return res.status(200).json(ok("Recurring transaction updated successfully", recurring));
  } catch (error) {
    return next(error);
  }
};

export const deleteRecurringController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    await deleteRecurringTransaction(id, userId);

    return res.status(200).json(ok("Recurring transaction deleted successfully", { id }));
  } catch (error) {
    return next(error);
  }
};
