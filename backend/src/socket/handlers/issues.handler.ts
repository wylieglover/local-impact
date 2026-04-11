import { Server as SocketServer } from "socket.io"
import { getRoomForCoords } from "../geohash.js"
import type { AuthenticatedSocket } from "../index.js"

export function registerIssuesHandlers(_io: SocketServer, _socket: AuthenticatedSocket) {
  // Reserved for future issue-specific socket events from clients
}

export function broadcastNewIssue(
  io: SocketServer,
  issue: {
    id: string
    description: string
    photoUrl: string | null
    status: string
    createdAt: string
    latitude: number
    longitude: number
    username: string
    avatar_url: string | null
  }
) {
  const room = getRoomForCoords(issue.latitude, issue.longitude)
  io.to(room).emit("issues:new", issue)
}

export function broadcastIssueStatusUpdate(
  io: SocketServer,
  issueId: string,
  status: string,
  reporterUserId: string,
  latitude: number,
  longitude: number
) {
  const room = getRoomForCoords(latitude, longitude)

  // Broadcast to everyone in the geohash room so nearby users see status change
  io.to(room).emit("issues:status_changed", { issueId, status })

  // Also notify the reporter directly in case they're not in the same room
  io.to(`user:${reporterUserId}`).emit("issues:status_changed", { issueId, status })
}

export function broadcastIssueDeleted(
  io: SocketServer,
  issueId: string,
  latitude: number,
  longitude: number
) {
  const room = getRoomForCoords(latitude, longitude)
  io.to(room).emit("issues:deleted", { issueId })
}