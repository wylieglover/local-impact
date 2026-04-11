import { Server as SocketServer } from "socket.io"
import { db } from "../../db/index.js"
import { userLocations } from "../../db/schema.js"
import { sql } from "drizzle-orm"
import { getSubscriptionRooms, getRoomForCoords } from "../geohash.js"
import type { AuthenticatedSocket } from "../index.js"

type LocationPayload = {
  latitude: number
  longitude: number
}

export function registerLocationHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  const { userId, username } = socket.data.user

  socket.on("location:update", async (payload: LocationPayload) => {
    const { latitude, longitude } = payload

    // Basic validation
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

    // 2. Update room subscriptions based on new geohash
    const newRooms = getSubscriptionRooms(latitude, longitude)
    const currentRooms = socket.data.currentRooms

    // Leave rooms no longer needed
    for (const room of currentRooms) {
      if (!newRooms.includes(room)) {
        socket.leave(room)
        currentRooms.delete(room)
      }
    }

    // Join new rooms
    for (const room of newRooms) {
      if (!currentRooms.has(room)) {
        socket.join(room)
        currentRooms.add(room)
      }
    }

    // 3. Broadcast position to nearby clients (everyone in this geohash room except sender)
    const currentRoom = getRoomForCoords(latitude, longitude)
    socket.to(currentRoom).emit("players:moved", {
      userId,
      username,
      latitude,
      longitude,
    })
  })
}