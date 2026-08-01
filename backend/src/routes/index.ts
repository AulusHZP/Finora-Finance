import { Router } from "express";
import { dashboardRoutes } from "./dashboard.routes";
import { transactionRoutes } from "./transaction.routes";
import { budgetRoutes } from "./budget.routes";
import goalRoutes from "./goal.routes";
import { categoryRoutes } from "./category.routes";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Finora backend is running",
  });
});

router.use("/dashboard", dashboardRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/goals", goalRoutes);
router.use("/categories", categoryRoutes);

export { router };
