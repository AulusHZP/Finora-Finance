import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail } from "../utils/http";

type AppError = Error & {
  statusCode?: number;
};

const SENSITIVE_BODY_FIELDS = ["password", "senha", "token", "currentPassword", "newPassword"];

const redactBody = (body: unknown): unknown => {
  if (!body || typeof body !== "object") return body;

  const redacted: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const field of SENSITIVE_BODY_FIELDS) {
    if (field in redacted) redacted[field] = "<redacted>";
  }
  return redacted;
};

export const errorMiddleware = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  // Log error with useful request context to help debugging in production
  try {
    const safeHeaders = { ...req.headers } as Record<string, unknown>;
    // Redact sensitive headers
    if (safeHeaders.authorization) safeHeaders.authorization = "<redacted>";

    console.error("Error caught by middleware:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
      headers: safeHeaders,
      body: redactBody(req.body),
    });
  } catch (logErr) {
    console.error("Failed to log error context", logErr);
  }

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
  // Return a stable JSON response; avoid leaking stack trace to clients
  return res.status(statusCode).json(fail(message));
};
