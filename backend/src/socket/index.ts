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

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Ping every 25s, disconnect after 60s of no response
    pingInterval: 25000,
    pingTimeout: 60000,
  })

  // Auth middleware — validates JWT on every connection
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        return next(new Error("UNAUTHORIZED"))
      }

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

    console.log(`[WS] Connected: ${username} (${userId})`)

    // Register domain handlers
    registerLocationHandlers(io, authedSocket)
    registerIssuesHandlers(io, authedSocket)
    registerFriendsHandlers(io, authedSocket)

    socket.on("disconnect", (reason) => {
      console.log(`[WS] Disconnected: ${username} — ${reason}`)
    })
  })

  return io
}