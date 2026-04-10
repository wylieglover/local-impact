import { asyncHandler } from "../util/asyncHandler.js"
import { AppError } from "../middleware/error.middleware.js"
import { db } from "../db/index.js"
import { users, userLocations } from "../db/schema.js"
import { sql, eq } from "drizzle-orm"
import type { TokenPayload } from "../util/auth/token.js"
import type { UpdateLocationInput, NearbyPlayersQuery, UserIdParam, UpdateMeInput } from "../schema/user.schema.js"
import { uploadAvatarPhoto } from "../service/storage.service.js"

/**
 * @route   PATCH /api/users/location
 * @desc    Upserts the authenticated user's current location.
 * @access  Reporter, Moderator, Admin
 */
export const updateLocation = asyncHandler(async (req, res) => {
  const body = res.locals.body as UpdateLocationInput;
  const user = res.locals.user as TokenPayload;

  await db
    .insert(userLocations)
    .values({
      userId: user.userId,
      location: {
        type: "Point",
        coordinates: [body.longitude, body.latitude],
      },
    })
    .onConflictDoUpdate({
      target: userLocations.userId,
      set: {
        location: sql`excluded.location`,
        updatedAt: sql`now()`,
      },
    });

  return res.status(200).json({
    status: "success",
    data: null,
  });
})

/**
 * @route   GET /api/users/nearby
 * @desc    Returns players within a given radius, excluding the requester.
 * @access  Reporter, Moderator, Admin
 */
export const getNearbyPlayers = asyncHandler(async (req, res) => {
  const query = res.locals.query as NearbyPlayersQuery
  const user = res.locals.user as TokenPayload

  const players = await db.execute(sql`
    SELECT
      u.id,
      u.username,
      u.avatar_url,
      u.role,
      ST_AsGeoJSON(ul.location)::json AS location,
      ST_Distance(
        ul.location,
        ST_MakePoint(${query.longitude}, ${query.latitude})::geography
      ) AS distance_meters
    FROM user_locations ul
    JOIN users u ON u.id = ul.user_id
    WHERE
      ul.user_id != ${user.userId}
      AND ST_DWithin(
        ul.location,
        ST_MakePoint(${query.longitude}, ${query.latitude})::geography,
        ${query.radius}
      )
      AND ul.updated_at > now() - interval '2 minutes'
    ORDER BY distance_meters ASC
  `);

  return res.status(200).json({
    status: "success",
    data: { players },
  });
});

/**
 * @route   GET /api/users/me
 * @desc    Returns the authenticated user's own profile.
 * @access  Reporter, Moderator, Admin
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = res.locals.user as TokenPayload;

  const [profile] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      level: users.level,
      experience: users.experience,
      points: users.points,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.userId));

  if (!profile) {
    throw new AppError(404, "NOT_FOUND", "User not found")
  }

  return res.status(200).json({
    status: "success",
    data: { user: profile },
  });
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = res.locals.user as TokenPayload
  const body = res.locals.body as UpdateMeInput

  let avatarUrl: string | undefined = undefined
  if (req.file) {
    avatarUrl = await uploadAvatarPhoto(req.file, user.userId)
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    })
    .where(eq(users.id, user.userId))
    .returning({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      level: users.level,
      points: users.points,
      role: users.role,
      createdAt: users.createdAt,
    })

  if (!updated) {
    throw new AppError(404, "NOT_FOUND", "User not found")
  }

  return res.status(200).json({
    status: "success",
    data: { user: updated },
  })
})

/**
 * @route   GET /api/users/:userId
 * @desc    Returns a public profile for any user by ID.
 * @access  Reporter, Moderator, Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = res.locals.params as UserIdParam;

  const [profile] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      level: users.level,
      points: users.points,
      role: users.role,
      createdAt: users.createdAt,
      // Note: experience is intentionally omitted from public profiles
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!profile) {
    throw new AppError(404, "NOT_FOUND", "User not found")
  }

  return res.status(200).json({
    status: "success",
    data: { user: profile },
  });
});
