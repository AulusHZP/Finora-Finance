import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { upsertBudget, deleteBudget, getBudgetsByUserId } from "../services/budget.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { ok } from "../utils/http";
import { requireUserId } from "../utils/request";

const upsertBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  monthlyLimit: z.number().positive("Monthly limit must be greater than 0")
});

export const getBudgetsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const budgets = await getBudgetsByUserId(userId);

    return res.status(200).json(ok("Budgets fetched successfully", { budgets }));
  } catch (error) {
    return next(error);
  }
};

export const upsertBudgetController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = upsertBudgetSchema.parse(req.body);
    const budget = await upsertBudget(userId, payload.categoryId, payload.monthlyLimit);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Budget saved successfully", budget));
  } catch (error) {
    return next(error);
  }
};

export const deleteBudgetController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    await deleteBudget(userId, id);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Budget deleted successfully", { id }));
  } catch (error) {
    return next(error);
  }
};
