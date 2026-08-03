import { Router, type Request, type Response } from "express";
import { requireUserId } from "../utils/request";
import {
  getTransactionsByUserId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service";

export const transactionRoutes = Router();

/** GET /transactions?year=&month=&categoryId= */
transactionRoutes.get("/", async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const categoryId = req.query.categoryId as string | undefined;

  const transactions = await getTransactionsByUserId(requireUserId(req), { year, month, categoryId });
  return res.json(transactions);
});

/** POST /transactions */
transactionRoutes.post("/", async (req: Request, res: Response) => {
  const { categoryId, description, amount, date } = req.body;

  if (!categoryId || !description || amount === undefined || !date) {
    return res.status(400).json({ error: "Campos obrigatórios: categoryId, description, amount, date" });
  }

  const tx = await createTransaction(requireUserId(req), { categoryId, description, amount: Number(amount), date });
  return res.status(201).json(tx);
});

/** PATCH /transactions/:id */
transactionRoutes.patch("/:id", async (req: Request, res: Response) => {
  const { categoryId, description, amount, date } = req.body;

  const tx = await updateTransaction(req.params.id as string, requireUserId(req), {
    ...(categoryId ? { categoryId } : {}),
    ...(description ? { description } : {}),
    ...(amount !== undefined ? { amount: Number(amount) } : {}),
    ...(date ? { date } : {}),
  });
  return res.json(tx);
});

/** DELETE /transactions/:id */
transactionRoutes.delete("/:id", async (req: Request, res: Response) => {
  await deleteTransaction(req.params.id as string, requireUserId(req));
  return res.json({ success: true });
});
