import { asyncHandler } from "../util/asyncHandler.js"
import { AppError } from "../middleware/error.middleware.js"
import { db } from "../db/index.js"
import { friendships, users, userLocations } from "../db/schema.js"
import { eq, or, and, sql } from "drizzle-orm"
import type { TokenPayload } from "../util/auth/token.js"
import type { FriendUserIdParam } from "../schema/friendship.schema.js"

/**
 * @route   POST /api/friends/request/:userId
 * @desc    Send a friend request to another user.
 * @access  Reporter, Moderator, Admin
 */
export const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId: receiverId } = res.locals.params as FriendUserIdParam
  const sender = res.locals.user as TokenPayload

  if (sender.userId === receiverId) {
    throw new AppError(400, "INVALID_REQUEST", "You cannot add yourself as a friend")
  }

  // Check target user exists
  const [targetUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, receiverId))

  if (!targetUser) {
    throw new AppError(404, "NOT_FOUND", "User not found")
  }

  // Check if any relationship already exists in either direction
  const [existing] = await db
    .select({ id: friendships.id, status: friendships.status })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.senderId, sender.userId), eq(friendships.receiverId, receiverId)),
        and(eq(friendships.senderId, receiverId), eq(friendships.receiverId, sender.userId))
      )
    )

  if (existing) {
    const messages: Record<string, string> = {
      pending: "A friend request already exists between you two",
      accepted: "You are already friends",
      blocked: "Unable to send friend request",
    }
    throw new AppError(409, "ALREADY_EXISTS", messages[existing.status] || "Already exists");
  }

  const [request] = await db
    .insert(friendships)
    .values({ senderId: sender.userId, receiverId })
    .returning({
      id: friendships.id,
      status: friendships.status,
      createdAt: friendships.createdAt,
    })

  return res.status(201).json({
    status: "success",
    data: { request },
  })
})

/**
 * @route   PATCH /api/friends/accept/:userId
 * @desc    Accept a pending friend request from a user.
 * @access  Reporter, Moderator, Admin
 */
export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { userId: senderId } = res.locals.params as FriendUserIdParam
  const receiver = res.locals.user as TokenPayload

  const [request] = await db
    .select({ id: friendships.id, status: friendships.status })
    .from(friendships)
    .where(
      and(
        eq(friendships.senderId, senderId),
        eq(friendships.receiverId, receiver.userId),
        eq(friendships.status, "pending")
      )
    )

  if (!request) {
    throw new AppError(404, "NOT_FOUND", "No pending friend request found from this user")
  }

  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted", updatedAt: sql`now()` })
    .where(eq(friendships.id, request.id))
    .returning({
      id: friendships.id,
      status: friendships.status,
      updatedAt: friendships.updatedAt,
    })

  return res.status(200).json({
    status: "success",
    data: { friendship: updated },
  })
})

/**
 * @route   DELETE /api/friends/:userId
 * @desc    Remove a friend, decline a request, or cancel a sent request.
 * @access  Reporter, Moderator, Admin
 */
export const removeFriend = asyncHandler(async (req, res) => {
  const { userId: targetId } = res.locals.params as FriendUserIdParam
  const user = res.locals.user as TokenPayload

  const [existing] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.senderId, user.userId), eq(friendships.receiverId, targetId)),
        and(eq(friendships.senderId, targetId), eq(friendships.receiverId, user.userId))
      )
    )

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "No friendship found with this user")
  }

  await db.delete(friendships).where(eq(friendships.id, existing.id))

  return res.status(204).send()
})

/**
 * @route   GET /api/friends
 * @desc    Returns the user's accepted friends list with presence derived from location.
 * @access  Reporter, Moderator, Admin
 */
export const getFriends = asyncHandler(async (req, res) => {
  const user = res.locals.user as TokenPayload

  const friends = await db.execute(sql`
    SELECT
      u.id,
      u.username,
      u.avatar_url,
      u.level,
      u.points,
      CASE
        WHEN ul.updated_at > now() - interval '2 minutes'  THEN 'online'
        WHEN ul.updated_at > now() - interval '30 minutes' THEN 'recently_seen'
        ELSE 'offline'
      END AS presence,
      ul.updated_at AS last_seen
    FROM friendships f
    JOIN users u ON u.id = (
      CASE WHEN f.sender_id = ${user.userId} THEN f.receiver_id ELSE f.sender_id END
    )
    LEFT JOIN user_locations ul ON ul.user_id = u.id
    WHERE
      (f.sender_id = ${user.userId} OR f.receiver_id = ${user.userId})
      AND f.status = 'accepted'
    ORDER BY
      CASE
        WHEN ul.updated_at > now() - interval '2 minutes'  THEN 0
        WHEN ul.updated_at > now() - interval '30 minutes' THEN 1
        ELSE 2
      END,
      u.username ASC
  `)

  return res.status(200).json({
    status: "success",
    data: { friends },
  })
})

/**
 * @route   GET /api/friends/requests
 * @desc    Returns pending incoming friend requests.
 * @access  Reporter, Moderator, Admin
 */
export const getFriendRequests = asyncHandler(async (req, res) => {
  const user = res.locals.user as TokenPayload

  const requests = await db.execute(sql`
    SELECT
      f.id,
      f.created_at,
      u.id AS sender_id,
      u.username,
      u.avatar_url,
      u.level
    FROM friendships f
    JOIN users u ON u.id = f.sender_id
    WHERE
      f.receiver_id = ${user.userId}
      AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `)

  return res.status(200).json({
    status: "success",
    data: { requests },
  })
});

/**
 * @route   GET /api/friends/sent
 * @desc    Returns pending outgoing friend requests.
 * @access  Reporter, Moderator, Admin
 */
export const getSentRequests = asyncHandler(async (req, res) => {
  const user = res.locals.user as TokenPayload

  const sent = await db.execute(sql`
    SELECT
      f.id,
      f.created_at,
      u.id AS receiver_id,
      u.username,
      u.avatar_url,
      u.level
    FROM friendships f
    JOIN users u ON u.id = f.receiver_id
    WHERE
      f.sender_id = ${user.userId}
      AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `)

  return res.status(200).json({
    status: "success",
    data: { sent },
  })
});