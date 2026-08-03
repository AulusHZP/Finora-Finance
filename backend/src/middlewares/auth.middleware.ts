import { NextFunction, Request, Response } from "express";
import { fail } from "../utils/http";
import { verifyAuthToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(fail("Unauthorized"));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAuthToken(token);
    
    // Verify user still exists in the database
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json(fail("User no longer exists"));
    }

    req.user = {
      id: payload.sub,
      email: payload.email
    };

    return next();
  } catch {
    return res.status(401).json(fail("Invalid or expired token"));
  }
};
