import { Router } from "express";
import {
  getBudgetsController,
  upsertBudgetController,
  deleteBudgetController
} from "../controllers/budget.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const budgetRoutes = Router();

budgetRoutes.use(authMiddleware);

budgetRoutes.get("/", getBudgetsController);
budgetRoutes.put("/", upsertBudgetController);
budgetRoutes.delete("/:id", deleteBudgetController);

export { budgetRoutes };
