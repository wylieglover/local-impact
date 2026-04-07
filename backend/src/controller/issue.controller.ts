import { asyncHandler } from "../util/asyncHandler.js";
import { AppError } from "../middleware/error.middleware.js";
import { db } from "../db/index.js";
import { issues, users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import type { TokenPayload } from "../util/auth/token.js";
import type {
  CreateIssueInput,
  UpdateIssueStatusInput,
  NearbyIssuesQuery,
} from "../schema/issue.schema.js";
import { uploadIssuePhoto, deleteIssuePhoto } from "../service/storage.service.js";

/**
 * @route   POST /api/issues
 * @desc    Creates a new issue at the given coordinates.
 * @access  Reporter, Moderator, Admin
 */
export const createIssue = asyncHandler(async (req, res) => {
  const body = res.locals.body as CreateIssueInput;
  const user = res.locals.user as TokenPayload;

  let photoUrl: string | null = null;
  if (req.file) {
    photoUrl = await uploadIssuePhoto(req.file, user.userId);
  }

  // Define the reward: 15 for photo, 10 without
  const pointsEarned = photoUrl ? 15 : 10;

  // Use a transaction to ensure both operations succeed or fail together
  const result = await db.transaction(async (tx) => {
    // 1. Insert the issue
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
      });

    if (!newIssue) {
      tx.rollback(); // Manually rollback if insert fails
      return null;
    }

    // 2. Update the user's points
    const [updatedUser] = await tx
      .update(users)
      .set({ 
        points: sql`${users.points} + ${pointsEarned}` 
      })
      .where(eq(users.id, user.userId))
      .returning({ 
        points: users.points 
      });
    
    if (!updatedUser) {
      tx.rollback(); 
      throw new AppError(404, "USER_NOT_FOUND", "Could not update points: User not found");
    }
    return { 
      newIssue, 
      newTotalPoints: updatedUser.points 
    };
  });

  if (!result) {
    if (photoUrl) await deleteIssuePhoto(photoUrl);
    throw new AppError(500, "INSERT_FAILED", "Failed to create issue");
  }

  // Return BOTH the issue and the NEW point total to the frontend
  return res.status(201).json({
    status: "success",
    data: {
      issue: {
        ...result.newIssue,
        username: user.username,
        avatar_url: null,
      },
      newTotalPoints: result.newTotalPoints,
    },
  });
});

/**
 * @route   GET /api/issues/nearby
 * @desc    Returns issues within a given radius (meters) of a coordinate.
 * @access  Reporter, Moderator, Admin
 */
export const getNearbyIssues = asyncHandler(async (req, res) => {
  const query = res.locals.query as NearbyIssuesQuery;
  
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
  `);

  return res.status(200).json({
    status: "success",
    data: { issues: nearbyIssues },
  });
});

/**
 * @route   GET /api/issues/:id
 * @desc    Returns a single issue by ID.
 * @access  Reporter, Moderator, Admin
 */
export const getIssueById = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string };

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
  `);

  if (!issue) {
    throw new AppError(404, "NOT_FOUND", "Issue not found");
  }

  return res.status(200).json({
    status: "success",
    data: { issue },
  });
});

/**
 * @route   PATCH /api/issues/:id/status
 * @desc    Updates the status of an issue.
 * @access  Moderator, Admin
 */
export const updateIssueStatus = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string };
  const body = res.locals.body as UpdateIssueStatusInput;

  const [updated] = await db
    .update(issues)
    .set({ status: body.status })
    .where(eq(issues.id, id))
    .returning({
      id: issues.id,
      status: issues.status,
    });

  if (!updated) {
    throw new AppError(404, "NOT_FOUND", "Issue not found");
  }

  return res.status(200).json({
    status: "success",
    data: { issue: updated },
  });
});

/**
 * @route   DELETE /api/issues/:id
 * @desc    Deletes an issue.
 * @access  Admin only
 */
export const deleteIssue = asyncHandler(async (req, res) => {
  const { id } = res.locals.params as { id: string };

  const [deleted] = await db
    .delete(issues)
    .where(eq(issues.id, id))
    .returning({ id: issues.id });

  if (!deleted) {
    throw new AppError(404, "NOT_FOUND", "Issue not found");
  }

  return res.status(204).send();
});