import { Server as HttpServer } from "http"
import { Server as SocketServer, Socket } from "socket.io"
import { env } from "../config/env.js"
import { verifyAccessToken, type TokenPayload } from "../util/auth/token.js"
import { registerLocationHandlers } from "./handlers/location.handler.js"
import { registerIssuesHandlers } from "./handlers/issues.handler.js"
import { registerFriendsHandlers } from "./handlers/friendship.handler.js"

export type AuthenticatedSocket = Socket & {
  data: {
    user: TokenPayload
    currentRooms: Set<string>
  }
}

let io: SocketServer
const connectedUsers = new Set<string>()

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId)
}

export function getOnlineUserIds(): Set<string> {
  return connectedUsers
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  })

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1]

      if (!token) return next(new Error("UNAUTHORIZED"))

      const payload = verifyAccessToken(token)
      ;(socket as AuthenticatedSocket).data.user = payload
      ;(socket as AuthenticatedSocket).data.currentRooms = new Set()
      next()
    } catch {
      next(new Error("INVALID_TOKEN"))
    }
  })

  io.on("connection", (socket) => {
    const authedSocket = socket as AuthenticatedSocket
    const { userId, username } = authedSocket.data.user

    connectedUsers.add(userId)
    console.log(`[WS] Connected: ${username} (${userId}) — ${connectedUsers.size} online`)

    registerLocationHandlers(io, authedSocket)
    registerIssuesHandlers(io, authedSocket)
    registerFriendsHandlers(io, authedSocket)

    socket.on("disconnect", (reason) => {
      connectedUsers.delete(userId)
      console.log(`[WS] Disconnected: ${username} — ${reason} — ${connectedUsers.size} online`)
    })
  })

  return io
}