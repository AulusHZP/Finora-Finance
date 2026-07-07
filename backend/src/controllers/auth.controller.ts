import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getUserById, loginUser, registerUser, updateUserProfile, setBalanceOffset } from "../services/auth.service";
import { rotateRefreshToken, revokeRefreshToken } from "../services/refresh-token.service";
import { invalidateDashboardCache } from "../services/dashboard.service";
import { ok } from "../utils/http";
import { requireUserId } from "../utils/request";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
    email: z.string().trim().email("Invalid email").optional(),
    creditCardClosingDay: z.number().int().min(1).max(31).nullable().optional()
  })
  .refine(
    (value) => Boolean(value.name || value.email) || value.creditCardClosingDay !== undefined,
    { message: "At least one field must be provided" }
  );

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

const logoutSchema = z.object({
  refreshToken: z.string().optional()
});

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);

    return res.status(201).json(ok("User registered successfully", result));
  } catch (error) {
    return next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);

    return res.status(200).json(ok("Login successful", result));
  } catch (error) {
    return next(error);
  }
};

export const meController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const user = await getUserById(userId);

    return res.status(200).json(ok("User profile fetched successfully", { user }));
  } catch (error) {
    return next(error);
  }
};

export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = updateProfileSchema.parse(req.body);
    const user = await updateUserProfile({
      userId,
      ...payload
    });

    return res.status(200).json(ok("Profile updated successfully", { user }));
  } catch (error) {
    return next(error);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = refreshSchema.parse(req.body);
    const result = await rotateRefreshToken(payload.refreshToken);

    return res.status(200).json(ok("Token refreshed successfully", result));
  } catch (error) {
    return next(error);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = logoutSchema.parse(req.body ?? {});

    if (payload.refreshToken) {
      await revokeRefreshToken(payload.refreshToken);
    }

    return res.status(200).json(ok("Logout successful"));
  } catch (error) {
    return next(error);
  }
};

const balanceOffsetSchema = z.object({
  offset: z.number({ required_error: "Offset is required" })
});

export const balanceOffsetController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const payload = balanceOffsetSchema.parse(req.body);
    const offset = await setBalanceOffset(userId, payload.offset);

    invalidateDashboardCache(userId);

    return res.status(200).json(ok("Balance offset updated successfully", { balanceOffset: offset }));
  } catch (error) {
    return next(error);
  }
};
