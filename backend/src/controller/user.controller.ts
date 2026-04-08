import { asyncHandler } from "../util/asyncHandler.js"
import { AppError } from "../middleware/error.middleware.js"
import { db } from "../db/index.js"
import { userLocations } from "../db/schema.js"
import { sql, eq } from "drizzle-orm"
import type { TokenPayload } from "../util/auth/token.js"
import type { UpdateLocationInput, NearbyPlayersQuery } from "../schema/user.schema.js"

/**
 * @route   PATCH /api/users/location
 * @desc    Upserts the authenticated user's current location.
 * @access  Reporter, Moderator, Admin
 */
export const updateLocation = asyncHandler(async (req, res) => {
  const body = res.locals.body as UpdateLocationInput
  const user = res.locals.user as TokenPayload

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
    })

  return res.status(200).json({
    status: "success",
    data: null,
  })
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
  `)

  return res.status(200).json({
    status: "success",
    data: { players },
  })
})