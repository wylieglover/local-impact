import { asyncHandler } from "../util/asyncHandler.js";
import { AppError } from "../middleware/error.middleware.js";
import { hashPassword, verifyPassword } from "../util/auth/password.js";
import { createSessionAndTokens, verifyAndRotateRefreshToken } from "../util/auth/session.js";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { or, eq } from "drizzle-orm";
import type { RegisterInput, LoginInput } from "../schema/auth.schema.js";
import { hashRefreshToken } from "../util/auth/token.js";
import { env } from "../config/env.js";

/**
 * @route   POST /api/auth/register
 * @desc    Creates a new user account and initializes their first session.
 * @access  Public
 * @logic
 * 1. Validate request body against Zod schema (handled by middleware).
 * 2. Check for collisions on unique fields (username, email, or phone).
 * 3. Securely hash password via Argon2.
 * 4. Atomic Insert: Create the user and immediately issue their first 
 * Access Token and HttpOnly Refresh Token.
 */
export const register = asyncHandler(async (req, res) => {
  const body = res.locals.body as RegisterInput;
  
  const existingUser = await db.query.users.findFirst({
    where: or(
      eq(users.username, body.username),
      body.email ? eq(users.email, body.email) : undefined,
      body.phone ? eq(users.phone, body.phone) : undefined
    )
  });

  if (existingUser) {
    const conflict = existingUser.username === body.username ? "Username" : "Email or Phone";
    throw new AppError(409, "USER_EXISTS", `${conflict} is already taken`);
  }

  const hashedPassword = await hashPassword(body.password);

  const [newUser] = await db
    .insert(users)
    .values({
      username: body.username,
      passwordHash: hashedPassword,
      email: body.email,
      phone: body.phone,
      role: "reporter"
    })
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
      points: users.points,
      experience: users.experience,
      level: users.level
    });

  if (!newUser) {
    throw new AppError(500, "INSERT_FAILED", "Failed to create user account");
  }

  const { accessToken } = await createSessionAndTokens(
    {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role as "reporter" | "moderator" | "admin",
      points: newUser.points,
      experience: newUser.experience,
      level: newUser.level
    },
    req,
    res
  );
    
  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
      accessToken,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticates a user via identifier (username/email/phone) and password.
 * @access  Public
 * @logic   
 * 1. Lookup user by multiple identifier types.
 * 2. Verify hashed password using Argon2 (Safe against timing attacks).
 * 3. Create a persistent session in DB and issue a rotated Refresh Token (HttpOnly).
 * 4. Return a short-lived Access Token for API authorization.
 */
export const login = asyncHandler(async (req, res) => {
  const body = res.locals.body as LoginInput;

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.username, body.identifier),
      eq(users.email, body.identifier),
      eq(users.phone, body.identifier)
    ),
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid identifier or password");
  }

  const isPasswordValid = await verifyPassword(body.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid identifier or password");
  }

  const { accessToken } = await createSessionAndTokens(
    {
      userId: user.id,
      username: user.username,
      role: user.role as "reporter" | "moderator" | "admin",
      points: user.points,
      experience: user.experience,
      level: user.level
    },
    req,
    res
  );

  return res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        points: user.points,
        experience: user.experience,
        level: user.level
      },
      accessToken,
    },
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotates the session by exchanging a valid Refresh Token for a new pair.
 * @access  Public (Requires HttpOnly Cookie)
 * @logic
 * 1. Extract Refresh Token from encrypted cookie.
 * 2. Verify JWT signature and check DB for matching active session.
 * 3. Atomic Rotation: Delete the used session and immediately issue a new one.
 * 4. Reuse Detection: If a valid JWT is presented but no session exists, 
 * it's treated as a potential theft/reuse attempt.
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token required")
  }

  let rotationResult;
  try {
    rotationResult = await verifyAndRotateRefreshToken(refreshToken, req, res);
  } catch (error) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session expired or invalid");
  }

  const { accessToken, userId } = rotationResult;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      role: true,
      email: true,
      points: true,
      experience: true,
      level: true
    }
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User no longer exists");
  }

  return res.status(200).json({
    status: "success",
    message: "Token refreshed successfully",
    data: {
      accessToken,
      user,
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Terminates the current user session.
 * @access  Public (Requires HttpOnly Cookie)
 * @logic
 * 1. Extract the Refresh Token from the request cookies.
 * 2. Hash and delete the matching session from the database.
 * 3. Force-clear the 'refreshToken' cookie on the client (Idempotent).
 * 4. Return 204 No Content to signify a successful state change.
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await db.delete(sessions).where(eq(sessions.refreshTokenHash, refreshTokenHash));
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax", 
    path: "/",
  });

  return res.status(204).send();
});