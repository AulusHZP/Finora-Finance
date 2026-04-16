import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { transactionRoutes } from "./transaction.routes";
import goalRoutes from "./goal.routes";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Finora auth backend is running"
  });
});

router.use("/auth", authRoutes);
router.use("/transactions", transactionRoutes);
router.use("/goals", goalRoutes);

export { router };
