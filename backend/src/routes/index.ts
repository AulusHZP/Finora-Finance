import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { transactionRoutes } from "./transaction.routes";
import { budgetRoutes } from "./budget.routes";
import goalRoutes from "./goal.routes";
import { categoryRoutes } from "./category.routes";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Finora backend is running",
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", authMiddleware, dashboardRoutes);
router.use("/transactions", authMiddleware, transactionRoutes);
router.use("/budgets", authMiddleware, budgetRoutes);
router.use("/goals", authMiddleware, goalRoutes);
router.use("/categories", authMiddleware, categoryRoutes);

export { router };
