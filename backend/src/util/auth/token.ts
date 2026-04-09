import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";

// Matching the userRole enum from our database schema
export type TokenPayload = {
  userId: string;
  username: string;
  role: "reporter" | "moderator" | "admin";
  points: number;
  experience: number;
  level: number;
};

/**
 * Generates a short-lived JWT for API authorization.
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY, // Number of seconds from Zod
  });
};

/**
 * Generates a long-lived JWT for session refreshing.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};

/**
 * HMAC hashes the Refresh Token for secure database storage.
 */
export const hashRefreshToken = (token: string): string => {
  return crypto
    .createHmac("sha256", env.REFRESH_TOKEN_HMAC_SECRET)
    .update(token)
    .digest("hex");
};

/**
 * Verifies and decodes an Access Token.
 * Throws an error if expired or invalid.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

/**
 * Verifies and decodes a Refresh Token.
 * Throws an error if expired or invalid.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};