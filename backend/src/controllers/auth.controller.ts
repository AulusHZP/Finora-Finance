import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getUserById, loginUser, registerUser, updateUserProfile } from "../services/auth.service";
import { ok } from "../utils/http";

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
    email: z.string().trim().email("Invalid email").optional()
  })
  .refine((value) => Boolean(value.name || value.email), {
    message: "At least one field must be provided"
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const user = await getUserById(userId);

    return res.status(200).json(ok("User profile fetched successfully", { user }));
  } catch (error) {
    return next(error);
  }
};

export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

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

export const logoutController = async (_req: Request, res: Response) => {
  return res.status(200).json(
    ok("Logout successful")
  );
};
