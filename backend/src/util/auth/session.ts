import type { Request, Response } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sessions } from "../../db/schema.js";
import { env } from "../../config/env.js";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashRefreshToken, 
  verifyRefreshToken, 
  type TokenPayload 
} from "./token.js";

export const createSessionAndTokens = async (
  tokenPayload: TokenPayload,
  req: Request,
  res: Response
) => {
  // Strip any JWT metadata fields (exp, iat, etc.) that come from
  // decoding an existing token — prevents "payload already has exp" error
  const cleanPayload: TokenPayload = {
    userId: tokenPayload.userId,
    username: tokenPayload.username,
    role: tokenPayload.role,
    points: tokenPayload.points
  }

  const accessToken = generateAccessToken(cleanPayload)
  const refreshToken = generateRefreshToken(cleanPayload)
  const refreshTokenHash = hashRefreshToken(refreshToken)

  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY * 1000)

  await db.insert(sessions).values({
    userId: cleanPayload.userId,
    refreshTokenHash,
    userAgent: req.headers["user-agent"] || null,
    ipAddress: req.ip || null,
    expiresAt,
  })

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.JWT_REFRESH_EXPIRY * 1000,
    path: "/",
  })

  return { accessToken, refreshToken }
}

export const verifyAndRotateRefreshToken = async (
  refreshToken: string,
  req: Request,
  res: Response
) => {
  const payload = verifyRefreshToken(refreshToken)
  const refreshTokenHash = hashRefreshToken(refreshToken)

  const [deletedSession] = await db
    .delete(sessions)
    .where(
      and(
        eq(sessions.userId, payload.userId),
        eq(sessions.refreshTokenHash, refreshTokenHash),
        gt(sessions.expiresAt, new Date())
      )
    )
    .returning()

  if (!deletedSession) {
    throw new Error("Invalid or expired session")
  }

  const result = await createSessionAndTokens(payload, req, res)

  return {
    ...result,
    userId: payload.userId,
  }
}