import { Router } from "express";
import {
  createRecurringController,
  getRecurringController,
  setRecurringActiveController,
  deleteRecurringController
} from "../controllers/recurring.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const recurringRoutes = Router();

recurringRoutes.use(authMiddleware);

recurringRoutes.get("/", getRecurringController);
recurringRoutes.post("/", createRecurringController);
recurringRoutes.patch("/:id", setRecurringActiveController);
recurringRoutes.delete("/:id", deleteRecurringController);

export { recurringRoutes };
