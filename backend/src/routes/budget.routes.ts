import { Router, type Request, type Response } from "express";
import { requireUserId } from "../utils/request";
import { getLimitsData, updateMonthlyBudget, upsertCategoryBudget } from "../services/budget.service";

export const budgetRoutes = Router();

/** GET /budgets?year=&month= — full limits page data */
budgetRoutes.get("/", async (req: Request, res: Response) => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "Parâmetros year/month inválidos" });
  }

  const data = await getLimitsData(requireUserId(req), year, month);
  return res.json(data);
});

/** PATCH /budgets — update totalLimit or alertThreshold */
budgetRoutes.patch("/", async (req: Request, res: Response) => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
  const { totalLimit, alertThreshold } = req.body;

  const updated = await updateMonthlyBudget(requireUserId(req), year, month, {
    totalLimit: totalLimit !== undefined ? (totalLimit === null ? null : Number(totalLimit)) : undefined,
    alertThreshold: alertThreshold !== undefined ? Number(alertThreshold) : undefined,
  });
  return res.json(updated);
});

/** PUT /budgets/categories/:categoryId — upsert category limit */
budgetRoutes.put("/categories/:categoryId", async (req: Request, res: Response) => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
  const { limitAmount } = req.body;

  const cb = await upsertCategoryBudget(
    requireUserId(req),
    year,
    month,
    req.params.categoryId as string,
    limitAmount === null || limitAmount === undefined ? null : Number(limitAmount)
  );
  return res.json(cb);
});
