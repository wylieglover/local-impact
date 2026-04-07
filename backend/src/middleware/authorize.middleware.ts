import { type RequestHandler } from "express";
import { AppError } from "./error.middleware.js";
import type { TokenPayload } from "../util/auth/token.js";

type UserRole = TokenPayload["role"];

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    const user = res.locals.user as TokenPayload | undefined;

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Not authenticated");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action");
    }

    next();
  };
};