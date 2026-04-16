import { Router } from "express";
import {
  createTransactionController,
  importTransactionsController,
  clearImportedTransactionsController,
  getTransactionsController,
  getTransactionController,
  updateTransactionController,
  deleteTransactionController
} from "../controllers/transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const transactionRoutes = Router();

// Apply auth middleware to all transaction routes
transactionRoutes.use(authMiddleware);

transactionRoutes.post("/", createTransactionController);
transactionRoutes.post("/import-csv", importTransactionsController);
transactionRoutes.delete("/import-csv", clearImportedTransactionsController);
transactionRoutes.get("/", getTransactionsController);
transactionRoutes.get("/:id", getTransactionController);
transactionRoutes.put("/:id", updateTransactionController);
transactionRoutes.delete("/:id", deleteTransactionController);

export { transactionRoutes };
