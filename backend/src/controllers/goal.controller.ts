import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createGoal,
  getGoalsByUserId,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../services/goal.service";
import { ok } from "../utils/http";

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
  targetDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date format"
  ),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
});

export const createGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Creating goal, body:", JSON.stringify(req.body, null, 2));

    const userId = req.user?.id;
    console.log("User ID from auth:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const payload = createGoalSchema.parse(req.body);
    console.log("Validated payload:", JSON.stringify(payload, null, 2));

    const goal = await createGoal({
      userId,
      title: payload.title,
      current: payload.current,
      target: payload.target,
      emoji: payload.emoji,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : undefined,
      priority: payload.priority,
    });

    console.log("Goal created:", JSON.stringify(goal, null, 2));
    return res.status(201).json(ok("Goal created successfully", goal));
  } catch (error) {
    console.error("Error in createGoalController:", error);
    return next(error);
  }
};

export const getGoalsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

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
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const goal = await getGoalById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

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
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const goal = await getGoalById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

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

    return res.status(200).json(ok("Goal updated successfully", updatedGoal));
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
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const goal = await getGoalById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    await deleteGoal(id);

    return res.status(200).json(ok("Goal deleted successfully", { id }));
  } catch (error) {
    return next(error);
  }
};
