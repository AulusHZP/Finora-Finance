import { Router, type Request, type Response } from "express";
import { requireUserId } from "../utils/request";
import {
  getGoalsByUserId,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  deleteContribution,
} from "../services/goal.service";

const goalRoutes = Router();

/** GET /goals */
goalRoutes.get("/", async (req: Request, res: Response) => {
  const goals = await getGoalsByUserId(requireUserId(req));
  return res.json(goals);
});

/** POST /goals */
goalRoutes.post("/", async (req: Request, res: Response) => {
  const { name, icon, targetAmount, deadline } = req.body;

  if (!name || !icon || targetAmount === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios: name, icon, targetAmount" });
  }

  const goal = await createGoal(requireUserId(req), {
    name,
    icon,
    targetAmount: Number(targetAmount),
    deadline: deadline ?? null,
  });
  return res.status(201).json(goal);
});

/** PATCH /goals/:id */
goalRoutes.patch("/:id", async (req: Request, res: Response) => {
  const { name, icon, targetAmount, deadline } = req.body;

  const goal = await updateGoal(req.params.id as string, requireUserId(req), {
    ...(name ? { name } : {}),
    ...(icon ? { icon } : {}),
    ...(targetAmount !== undefined ? { targetAmount: Number(targetAmount) } : {}),
    ...(deadline !== undefined ? { deadline } : {}),
  });
  return res.json(goal);
});

/** DELETE /goals/:id */
goalRoutes.delete("/:id", async (req: Request, res: Response) => {
  await deleteGoal(req.params.id as string, requireUserId(req));
  return res.json({ success: true });
});

// ─── Contributions ────────────────────────────────────────────────────────────

/** POST /goals/:id/contributions */
goalRoutes.post("/:id/contributions", async (req: Request, res: Response) => {
  const { amount, date, note } = req.body;

  if (amount === undefined || !date) {
    return res.status(400).json({ error: "Campos obrigatórios: amount, date" });
  }

  const contribution = await addContribution(req.params.id as string, requireUserId(req), {
    amount: Number(amount),
    date,
    note,
  });
  return res.status(201).json(contribution);
});

/** DELETE /goals/contributions/:contributionId */
goalRoutes.delete("/contributions/:contributionId", async (req: Request, res: Response) => {
  await deleteContribution(req.params.contributionId as string, requireUserId(req));
  return res.json({ success: true });
});

export default goalRoutes;
