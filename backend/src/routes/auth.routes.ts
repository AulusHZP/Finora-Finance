import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
	loginController,
	logoutController,
	meController,
	registerController,
	updateProfileController,
	balanceOffsetController
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Muitas tentativas. Aguarde um minuto e tente novamente." }
});

authRoutes.post("/register", authLimiter, registerController);
authRoutes.post("/login", authLimiter, loginController);
authRoutes.get("/me", authMiddleware, meController);
authRoutes.put("/profile", authMiddleware, updateProfileController);
authRoutes.put("/balance-offset", authMiddleware, balanceOffsetController);
authRoutes.post("/logout", authMiddleware, logoutController);

export { authRoutes };
