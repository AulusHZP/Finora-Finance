import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail } from "../utils/http";

type AppError = Error & {
  statusCode?: number;
};

export const errorMiddleware = (err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error caught by middleware:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });

  if (err instanceof ZodError) {
    console.error("Zod validation error:", err.issues);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  const statusCode = err.statusCode ?? 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message;

  console.error(`Responding with status ${statusCode}: ${message}`);
  return res.status(statusCode).json(fail(message));
};
