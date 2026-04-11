import { asyncHandler } from "../util/asyncHandler.js"
import { AppError } from "../middleware/error.middleware.js"
import { db } from "../db/index.js"
import { issues, users } from "../db/schema.js"
import { eq, sql } from "drizzle-orm"
import type { TokenPayload } from "../util/auth/token.js"
import type {
  CreateIssueInput,
  UpdateIssueStatusInput,
  NearbyIssuesQuery,
} from "../schema/issue.schema.js"
import { uploadIssuePhoto, deleteIssuePhoto } from "../service/storage.service.js"
import { XP_REWARDS } from "../util/xp.js"
import { getIO } from "../socket/index.js"
import {
  broadcastNewIssue,
  broadcastIssueStatusUpdate,
  broadcastIssueDeleted,
} from "../socket/handlers/issues.handler.js"

/**
 * @route   POST /api/issues
 * @desc    Creates a new issue at the given coordinates.
 * @access  Reporter, Moderator, Admin
 */
export const createIssue = asyncHandler(async (req, res) => {
  const body = res.locals.body as CreateIssueInput
  const user = res.locals.user as TokenPayload

  let photoUrl: string | null = null
  if (req.file) {
    photoUrl = await uploadIssuePhoto(req.file, user.userId)
  }

  const pointsEarned = photoUrl ? 15 : 10
  const xpEarned = photoUrl ? XP_REWARDS.REPORT_WITH_PHOTO : XP_REWARDS.REPORT_WITHOUT_PHOTO

  const result = await db.transaction(async (tx) => {
    const [newIssue] = await tx
      .insert(issues)
      .values({
        userId: user.userId,
        description: body.description,
        photoUrl,
        location: {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        },
      })
      .returning({
        id: issues.id,
        description: issues.description,
        photoUrl: issues.photoUrl,
        status: issues.status,
        createdAt: issues.createdAt,
        location: sql`ST_AsGeoJSON(${issues.location})`.mapWith(JSON.parse),
      })

    if (!newIssue) {
      tx.rollback()
      return null
    }

    const [updatedUser] = await tx
      .update(users)
      .set({
        points: sql`${users.points} + ${pointsEarned}`,
        experience: sql`${users.experience} + ${xpEarned}`,
      })
      .where(eq(users.id, user.userId))
      .returning({
        points: users.points,
        experience: users.experience,
        level: users.level,
      })

    if (!updatedUser) {
      tx.rollback()
      throw new AppError(404, "USER_NOT_FOUND", "Could not update points: User not found")
    }

    return {
      newIssue,
      newTotalPoints: updatedUser.points,
      newExperience: updatedUser.experience,
      newLevel: updatedUser.level,
    }
  })

  if (!result) {
    if (photoUrl) await deleteIssuePhoto(photoUrl)
    throw new AppError(500, "INSERT_FAILED", "Failed to create issue")
  }

  // Broadcast to nearby clients via WebSocket — non-fatal if it fails
  try {
    broadcastNewIssue(getIO(), {
      id: result.newIssue.id,
      description: result.newIssue.description,
      photoUrl: result.newIssue.photoUrl,
      status: result.newIssue.status,
      createdAt: result.newIssue.createdAt.toISOString(),
      latitude: body.latitude,
      longitude: body.longitude,
      username: user.username,
      avatar_url: null,
    })
  } catch {}

  return res.status(201).json({
    status: "success",
    data: {
      issue: {
        ...result.newIssue,
        username: user.username,
        avatar_url: null,
      },
      newTotalPoints: result.newTotalPoints,
      newExperience: result.newExperience,
      newLevel: result.newLevel,
    },
  })
})

/**
 * @route   GET /api/issues/nearby
 * @desc    Returns issues within a given radius (meters) of a coordinate.
 * @access  Reporter, Moderator, Admin
 */
export const getNearbyIssues = asyncHandler(async (req, res) => {
  const query = res.locals.query as NearbyIssuesQuery

  const nearbyIssues = await db.execute(sql`
    SELECT
      i.id,
      i.description,
      i.photo_url AS "photoUrl",
      i.status,
      i.created_at,
      ST_AsGeoJSON(i.location)::json AS location,
      ST_Distance(
        i.location,
        ST_MakePoint(${query.longitude}, ${query.latitude})::geography
      ) AS distance_meters,
      u.username,
      u.avatar_url
    FROM issues i
    JOIN users u ON u.id = i.user_id
    WHERE ST_DWithin(
      i.location,
      ST_MakePoint(${query.longitude}, ${query.latitude})::geography,
      ${query.radius}
    )
    ORDER BY distance_meters ASC
  `)

  return res.status(200).json({
    status: "success",
    data: { issues: nearbyIssues },
  })
})

/**
 * @route   GET /api/issues/:id
 * @desc    Returns a single issue by ID.
 * @access  Reporter, Moderator, Admin
 */
export const getIssueById = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string }

  const [issue] = await db.execute(sql`
    SELECT
      i.id,
      i.description,
      i.photo_url AS "photoUrl",
      i.status,
      i.created_at,
      ST_AsGeoJSON(i.location)::json AS location,
      u.id AS user_id,
      u.username,
      u.avatar_url
    FROM issues i
    JOIN users u ON u.id = i.user_id
    WHERE i.id = ${id}
  `)

  if (!issue) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  return res.status(200).json({
    status: "success",
    data: { issue },
  })
})

/**
 * @route   PATCH /api/issues/:id/status
 * @desc    Updates the status of an issue.
 * @access  Moderator, Admin
 */
export const updateIssueStatus = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string }
  const body = res.locals.body as UpdateIssueStatusInput

  // Fetch issue first so we have location + userId for broadcasting
  const [existing] = await db.execute(sql`
    SELECT
      i.user_id,
      ST_AsGeoJSON(i.location)::json AS location
    FROM issues i
    WHERE i.id = ${id}
  `) as any[]

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(issues)
      .set({ status: body.status })
      .where(eq(issues.id, id))
      .returning({
        id: issues.id,
        status: issues.status,
        userId: issues.userId,
      })

    if (!updated) {
      throw new AppError(404, "NOT_FOUND", "Issue not found")
    }

    if (body.status === "resolved") {
      await tx
        .update(users)
        .set({ experience: sql`${users.experience} + ${XP_REWARDS.ISSUE_RESOLVED}` })
        .where(eq(users.id, updated.userId))
    }

    return { id: updated.id, status: updated.status }
  })

  // Broadcast status change to nearby clients and the reporter
  try {
    const [lng, lat] = existing.location.coordinates
    broadcastIssueStatusUpdate(
      getIO(),
      result.id,
      result.status,
      existing.user_id,
      lat,
      lng
    )
  } catch {}

  return res.status(200).json({
    status: "success",
    data: { issue: result },
  })
})

/**
 * @route   DELETE /api/issues/:id
 * @desc    Deletes an issue.
 * @access  Reporter, Moderator, Admin
 */
export const deleteIssue = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string }
  const user = res.locals.user as TokenPayload

  // Fetch first so we have location for broadcasting
  const [existing] = await db.execute(sql`
    SELECT
      i.user_id,
      ST_AsGeoJSON(i.location)::json AS location
    FROM issues i
    WHERE i.id = ${id}
  `) as any[]

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  if (user.role === "reporter" && existing.user_id !== user.userId) {
    throw new AppError(403, "FORBIDDEN", "You can only delete your own issues")
  }

  await db.delete(issues).where(eq(issues.id, id))

  // Broadcast deletion to nearby clients
  try {
    const [lng, lat] = existing.location.coordinates
    broadcastIssueDeleted(getIO(), id, lat, lng)
  } catch {}

  return res.status(204).send()
})