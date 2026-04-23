import { NextFunction, Request, Response } from "express";
import { getDashboardByUserId } from "../services/dashboard.service";
import { ok } from "../utils/http";

export const getDashboardController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const dashboard = await getDashboardByUserId(userId);

    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");

    return res.status(200).json(ok("Dashboard fetched successfully", { dashboard }));
  } catch (error) {
    return next(error);
  }
};