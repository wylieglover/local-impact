import { Server as SocketServer } from "socket.io"
import { db } from "../../db/index.js"
import { userLocations, users } from "../../db/schema.js"
import { sql, ne } from "drizzle-orm"
import { getSubscriptionRooms, getRoomForCoords } from "../geohash.js"
import type { AuthenticatedSocket } from "../index.js"

type LocationPayload = {
  latitude: number
  longitude: number
}

export function registerLocationHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  const { userId, username } = socket.data.user
  let isFirstUpdate = true

  socket.on("location:update", async (payload: LocationPayload) => {
    const { latitude, longitude } = payload

    if (
      typeof latitude !== "number" || typeof longitude !== "number" ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) return

    // 1. Upsert location to DB
    try {
      await db
        .insert(userLocations)
        .values({
          userId,
          location: { type: "Point", coordinates: [longitude, latitude] },
        })
        .onConflictDoUpdate({
          target: userLocations.userId,
          set: {
            location: sql`excluded.location`,
            updatedAt: sql`now()`,
          },
        })
    } catch (err) {
      console.error("[WS] Failed to upsert location:", err)
      return
    }

    // 2. Update room subscriptions
    const newRooms = getSubscriptionRooms(latitude, longitude)
    const currentRooms = socket.data.currentRooms

    for (const room of currentRooms) {
      if (!newRooms.includes(room)) {
        socket.leave(room)
        currentRooms.delete(room)
      }
    }

    for (const room of newRooms) {
      if (!currentRooms.has(room)) {
        socket.join(room)
        currentRooms.add(room)
      }
    }

    // 3. Broadcast own position to nearby clients
    const currentRoom = getRoomForCoords(latitude, longitude)
    socket.to(currentRoom).emit("players:moved", {
      userId,
      username,
      latitude,
      longitude,
    })

    // 4. On first location update, fetch existing nearby players from DB
    // and send their positions back to this client so they appear immediately
    if (isFirstUpdate) {
      isFirstUpdate = false
      try {
        const nearby = await db.execute(sql`
          SELECT
            u.id,
            u.username,
            ST_Y(ul.location::geometry) AS latitude,
            ST_X(ul.location::geometry) AS longitude
          FROM user_locations ul
          JOIN users u ON u.id = ul.user_id
          WHERE
            ul.user_id != ${userId}
            AND ST_DWithin(
              ul.location,
              ST_MakePoint(${longitude}, ${latitude})::geography,
              5000
            )
            AND ul.updated_at > now() - interval '2 minutes'
        `) as any[]

        // Send each nearby player's position directly to the connecting client
        for (const player of nearby) {
          socket.emit("players:moved", {
            userId: player.id,
            username: player.username,
            latitude: player.latitude,
            longitude: player.longitude,
          })
        }
      } catch (err) {
        console.error("[WS] Failed to fetch existing nearby players:", err)
      }
    }
  })
}