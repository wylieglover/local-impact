import { type RequestHandler } from "express";
import { verifyAccessToken } from "../util/auth/token.js";
import { AppError } from "./error.middleware.js";

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check for the Bearer prefix
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
  }

  const token = authHeader.split(" ")[1];

  // 2. Check that a token exists in the header
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Malformed Authorization header");
  }

  try {
    // 3. Verify the token using our JWT utility
    const payload = verifyAccessToken(token);

    // 4. Attach payload to res.locals (or req.user if you prefer)
    res.locals.user = payload;
    
    next();
  } catch (err: any) {
    // 5. Map specific JWT errors to our AppError format
    if (err.name === "TokenExpiredError") {
      throw new AppError(401, "TOKEN_EXPIRED", "Your session has expired. Please refresh.");
    }
    
    throw new AppError(401, "INVALID_TOKEN", "Authentication failed. Please log in again.");
  }
};