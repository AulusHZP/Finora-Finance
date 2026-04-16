import { Router } from "express";
import {
	loginController,
	logoutController,
	meController,
	registerController,
	updateProfileController
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.get("/me", authMiddleware, meController);
authRoutes.put("/profile", authMiddleware, updateProfileController);
authRoutes.post("/logout", authMiddleware, logoutController);

export { authRoutes };
