import { type ErrorRequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../util/logger.js";

/**
 * Custom App Error class for manual throws
 * e.g., throw new AppError(401, "AUTH_FAILED", "Invalid credentials");
 */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details: unknown = undefined;

  // 1. Handle Zod Validation Errors
  if (err instanceof z.ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  }

  // 2. Handle Custom App Errors (Manual throws)
  else if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  // 3. Handle Database Errors (Postgres/Drizzle)
  else if (err.code === "23505") {
    status = 409;
    code = "CONFLICT";
    // We can parse the error detail to see WHICH field failed
    message = err.detail?.includes("username") 
      ? "Username already taken" 
      : "A record with this information already exists";
  }

  // 4. Log the error using Pino
  logger.error({
    err,
    requestId: req.id,
    path: req.path,
  }, message);

  // 5. Final Response
  return res.status(status).json({
    code,
    message,
    ...(env.NODE_ENV !== "production" && details ? { details } : {}),
    // Include stack trace only in local dev
    ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};