import { asyncHandler } from "../util/asyncHandler.js"
import { AppError } from "../middleware/error.middleware.js"
import { db } from "../db/index.js"
import { issues, users } from "../db/schema.js"
import { eq, sql } from "drizzle-orm"
import type { TokenPayload } from "../util/auth/token.js"
import type {
  CreateIssueInput,
  ClaimIssueInput,
  UpdateIssueStatusInput,
  NearbyIssuesQuery,
} from "../schema/issue.schema.js"
import { uploadIssueBeforePhoto, uploadAvatarPhoto, deleteIssuePhoto, uploadIssueAfterPhoto } from "../service/storage.service.js"
import { XP_REWARDS } from "../util/xp.js"
import { getIO } from "../socket/index.js"
import {
  broadcastNewIssue,
  broadcastIssueStatusUpdate,
  broadcastIssueDeleted,
} from "../socket/handlers/issues.handler.js"
import { getDistanceMeters } from "../util/geo.js"

/**
 * @route   POST /api/issues
 * @desc    Creates a new issue — before photo now required.
 * @access  Reporter, Moderator, Admin
 */
export const createIssue = asyncHandler(async (req, res) => {
  const body = res.locals.body as CreateIssueInput
  const user = res.locals.user as TokenPayload

  // Before photo is required
  if (!req.file) {
    throw new AppError(400, "PHOTO_REQUIRED", "A before photo is required to report an issue")
  }

  const beforePhotoUrl = await uploadIssueBeforePhoto(req.file, user.userId)
  const pointsEarned = 15 // Always 15 since photo is now required
  const xpEarned = XP_REWARDS.REPORT_WITH_PHOTO

  const result = await db.transaction(async (tx) => {
    const [newIssue] = await tx
      .insert(issues)
      .values({
        userId: user.userId,
        description: body.description,
        beforePhotoUrl,
        location: {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        },
      })
      .returning({
        id: issues.id,
        description: issues.description,
        beforePhotoUrl: issues.beforePhotoUrl,
        afterPhotoUrl: issues.afterPhotoUrl,
        status: issues.status,
        createdAt: issues.createdAt,
        location: sql`ST_AsGeoJSON(${issues.location})`.mapWith(JSON.parse),
      })

    if (!newIssue) { tx.rollback(); return null }

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
      throw new AppError(404, "USER_NOT_FOUND", "Could not update points")
    }

    return { newIssue, newTotalPoints: updatedUser.points, newExperience: updatedUser.experience, newLevel: updatedUser.level }
  })

  if (!result) {
    await deleteIssuePhoto(beforePhotoUrl)
    throw new AppError(500, "INSERT_FAILED", "Failed to create issue")
  }

  try {
    broadcastNewIssue(getIO(), {
      id: result.newIssue.id,
      description: result.newIssue.description,
      beforePhotoUrl: result.newIssue.beforePhotoUrl,
      afterPhotoUrl: null,
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
 * @route   POST /api/issues/:id/claim
 * @desc    Claims an issue — user must be within 3 meters of the location.
 * @access  Reporter, Moderator, Admin
 */
export const claimIssue = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string }
  const body = res.locals.body as ClaimIssueInput
  const user = res.locals.user as TokenPayload

  const [existing] = await db.execute(sql`
    SELECT
      i.id,
      i.user_id,
      i.status,
      i.claimed_by_user_id,
      ST_Y(i.location::geometry) AS latitude,
      ST_X(i.location::geometry) AS longitude
    FROM issues i
    WHERE i.id = ${id}
  `) as any[]

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  if (existing.status !== "open") {
    throw new AppError(409, "ALREADY_CLAIMED", "This issue has already been claimed")
  }

  if (existing.user_id === user.userId) {
    throw new AppError(403, "FORBIDDEN", "You cannot claim your own issue")
  }

  // GPS proximity check — must be within 3 meters
  const distance = getDistanceMeters(
    body.latitude, body.longitude,
    existing.latitude, existing.longitude
  )

  if (distance > 3) {
    throw new AppError(403, "TOO_FAR", `You must be within 3 meters of the issue to claim it. You are ${Math.round(distance)}m away.`)
  }

  const [updated] = await db
    .update(issues)
    .set({
      status: "claimed",
      claimedByUserId: user.userId,
      claimedAt: sql`now()`,
    })
    .where(eq(issues.id, id))
    .returning({ id: issues.id, status: issues.status })

  if (!updated) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  try {
    broadcastIssueStatusUpdate(getIO(), updated.id, updated.status, existing.user_id, existing.latitude, existing.longitude)
  } catch {}
  return res.status(200).json({
    status: "success",
    data: { issue: updated },
  })
})

/**
 * @route   POST /api/issues/:id/resolve
 * @desc    Submits after photo to resolve a claimed issue.
 *          User must be within 3 meters and must be the claimer.
 * @access  Reporter, Moderator, Admin
 */
export const resolveIssue = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string }
  const user = res.locals.user as TokenPayload

  // After photo is required
  if (!req.file) {
    throw new AppError(400, "PHOTO_REQUIRED", "An after photo is required to resolve an issue")
  }

  // Latitude/longitude come from form fields alongside the photo
  const latitude = parseFloat(req.body.latitude)
  const longitude = parseFloat(req.body.longitude)

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new AppError(400, "LOCATION_REQUIRED", "Location is required to resolve an issue")
  }

  const [existing] = await db.execute(sql`
    SELECT
      i.id,
      i.user_id,
      i.claimed_by_user_id,
      i.status,
      ST_Y(i.location::geometry) AS latitude,
      ST_X(i.location::geometry) AS longitude
    FROM issues i
    WHERE i.id = ${id}
  `) as any[]

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Issue not found")
  }

  if (existing.status !== "claimed" && existing.status !== "in_progress") {
    throw new AppError(409, "INVALID_STATUS", "Issue must be claimed before it can be resolved")
  }

  // Only the claimer or a moderator/admin can resolve
  const isClaimer = existing.claimed_by_user_id === user.userId
  const isMod = user.role === "moderator" || user.role === "admin"

  if (!isClaimer && !isMod) {
    throw new AppError(403, "FORBIDDEN", "Only the operative who claimed this issue can resolve it")
  }

  // GPS proximity check for reporters — mods can resolve remotely
  if (!isMod) {
    const distance = getDistanceMeters(
      latitude, longitude,
      existing.latitude, existing.longitude
    )

    if (distance > 3) {
      throw new AppError(403, "TOO_FAR", `You must be within 3 meters of the issue to resolve it. You are ${Math.round(distance)}m away.`)
    }
  }

  const afterPhotoUrl = await uploadIssueAfterPhoto(req.file, id)

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(issues)
      .set({
        status: "resolved",
        afterPhotoUrl,
      })
      .where(eq(issues.id, id))
      .returning({ id: issues.id, status: issues.status, userId: issues.userId })

    if (!updated) throw new AppError(404, "NOT_FOUND", "Issue not found")

    // Grant XP to the claimer
    await tx
      .update(users)
      .set({ experience: sql`${users.experience} + ${XP_REWARDS.ISSUE_RESOLVED}` })
      .where(eq(users.id, existing.claimed_by_user_id ?? user.userId))

    return updated
  })

  try {
    const [lng, lat] = [existing.longitude, existing.latitude]
    broadcastIssueStatusUpdate(getIO(), result.id, result.status, existing.user_id, lat, lng)
  } catch {}

  return res.status(200).json({
    status: "success",
    data: { issue: result },
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
      i.before_photo_url,
      i.after_photo_url,
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
      i.before_photo_url,
      i.after_photo_url,
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