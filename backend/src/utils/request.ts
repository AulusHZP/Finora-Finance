import { Request } from "express";
import { HttpError } from "./http-error";

/**
 * Returns the authenticated user id. Routes behind authMiddleware always have
 * it; throwing here keeps controllers free of repeated null checks.
 */
export const requireUserId = (req: Request): string => {
  const userId = req.user?.id;

  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  return userId;
};
