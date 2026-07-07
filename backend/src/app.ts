import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { router } from "./routes";

const app = express();

// Behind a single reverse proxy (e.g. Render) — required so req.ip reflects the
// real client IP and express-rate-limit doesn't throttle all users as one.
app.set("trust proxy", 1);

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow non-browser clients (curl, mobile apps, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow localhost in development
    if (
      env.NODE_ENV === "development" &&
      origin.startsWith("http://localhost")
    ) {
      callback(null, true);
      return;
    }

    // In production, check against allowed origins list
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (env.NODE_ENV === "production" && allowedOrigins.length === 0) {
      console.warn(
        `[CORS] No CORS_ORIGIN configured in production — denying request from: ${origin}. ` +
          "Set CORS_ORIGIN to the frontend URL(s), comma-separated."
      );
    } else {
      console.warn(`[CORS] Origin ${origin} not allowed by CORS`);
    }
    // Do not throw an error here — returning an error causes Express to send
    // a 500 and no CORS headers. Instead, deny the CORS check so the browser
    // will block the request client-side while the server responds normally.
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

app.use(router);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
