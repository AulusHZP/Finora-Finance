import { Router, type Request, type Response } from "express";
import { requireUserId } from "../utils/request";
import { getDashboardData } from "../services/dashboard.service";

export const dashboardRoutes = Router();

/**
 * GET /dashboard?year=2026&month=7
 * Returns aggregated dashboard data for the given month.
 */
dashboardRoutes.get("/", async (req: Request, res: Response) => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "Parâmetros year/month inválidos" });
  }

  const data = await getDashboardData(requireUserId(req), year, month);
  return res.json(data);
});