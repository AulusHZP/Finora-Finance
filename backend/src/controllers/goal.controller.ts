import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createGoal,
  getGoalsByUserId,
  getOwnedGoalById,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} from "../services/goal.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { ok } from "../utils/http";
import { requireUserId } from "../utils/request";

const createGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  current: z.number().min(0, "Current must be >= 0"),
  target: z.number().positive("Target must be greater than 0"),
  emoji: z.string().min(1, "Emoji is required"),
  targetDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date format"
  ),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const updateGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255).optional(),
  current: z.number().min(0, "Current must be >= 0").optional(),
  target: z.number().positive("Target must be greater than 0").optional(),
  emoji: z.string().min(1, "Emoji is required").optional(),
  targetDate: z.string().nullable().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date format"
  ),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
});

const contributeGoalSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
});

export const createGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);

    const payload = createGoalSchema.parse(req.body);

    const goal = await createGoal({
      userId,
      title: payload.title,
      current: payload.current,
      target: payload.target,
      emoji: payload.emoji,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : undefined,
      priority: payload.priority,
    });

    invalidateDashboardCache(userId);

    return res.status(201).json(ok("Goal created successfully", goal));
  } catch (error) {
    return next(error);
  }
};

export const getGoalsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);

    const goals = await getGoalsByUserId(userId);
    return res.status(200).json(ok("Goals fetched successfully", { goals }));
  } catch (error) {
    return next(error);
  }
};

export const getGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    const goal = await getOwnedGoalById(id, userId);

    return res.status(200).json(ok("Goal fetched successfully", goal));
  } catch (error) {
    return next(error);
  }
};

export const updateGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    await getOwnedGoalById(id, userId);

    const payload = updateGoalSchema.parse(req.body);

    const updatedGoal = await updateGoal(id, {
      title: payload.title,
      current: payload.current,
      target: payload.target,
      emoji: payload.emoji,
      targetDate: payload.targetDate
        ? new Date(payload.targetDate)
        : payload.targetDate === null
          ? null
          : undefined,
      priority: payload.priority,
    });

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Goal updated successfully", updatedGoal));
  } catch (error) {
    return next(error);
  }
};

export const contributeGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    const payload = contributeGoalSchema.parse(req.body);

    const updatedGoal = await contributeToGoal(id, userId, payload.amount);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Contribution added successfully", updatedGoal));
  } catch (error) {
    return next(error);
  }
};

export const deleteGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params as { id: string };

    await getOwnedGoalById(id, userId);

    await deleteGoal(id);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Goal deleted successfully", { id }));
  } catch (error) {
    return next(error);
  }
};
