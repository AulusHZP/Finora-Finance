import { Router } from "express";
import {
  createGoalController,
  getGoalsController,
  getGoalController,
  updateGoalController,
  contributeGoalController,
  deleteGoalController,
} from "../controllers/goal.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createGoalController);
router.get("/", getGoalsController);
router.get("/:id", getGoalController);
router.put("/:id", updateGoalController);
router.post("/:id/contribute", contributeGoalController);
router.delete("/:id", deleteGoalController);

export default router;
