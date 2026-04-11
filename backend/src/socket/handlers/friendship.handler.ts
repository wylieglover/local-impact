import { Server as SocketServer } from "socket.io"
import type { AuthenticatedSocket } from "../index.js"

export function registerFriendsHandlers(io: SocketServer, socket: AuthenticatedSocket) {
  const { userId } = socket.data.user
  socket.join(`user:${userId}`)
}

export function broadcastFriendRequest(
  io: SocketServer,
  receiverId: string,
  sender: { id: string; username: string; avatar_url: string | null; level: number }
) {
  io.to(`user:${receiverId}`).emit("friends:request_received", { sender })
}

export function broadcastFriendRequestAccepted(
  io: SocketServer,
  senderId: string,
  accepter: { id: string; username: string; avatar_url: string | null; level: number; points: number }
) {
  io.to(`user:${senderId}`).emit("friends:request_accepted", { accepter })
}

export function broadcastFriendRemoved(
  io: SocketServer,
  userId: string,
  targetId: string
) {
  io.to(`user:${userId}`).emit("friends:removed", { userId: targetId })
  io.to(`user:${targetId}`).emit("friends:removed", { userId })
}