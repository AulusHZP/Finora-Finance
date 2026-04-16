import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { router } from "./routes";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser clients (curl, mobile apps, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow localhost in development
    if (env.NODE_ENV === "development" && origin.startsWith("http://localhost")) {
      callback(null, true);
      return;
    }

    // In production, check against allowed origins list
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // If no origins configured and in production, log warning but allow
    // This prevents 500 errors on preflight requests
    if (env.NODE_ENV === "production" && allowedOrigins.length === 0) {
      console.warn(`[CORS] No CORS_ORIGIN configured in production. Allowing request from: ${origin}`);
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  exposedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

app.use(router);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
