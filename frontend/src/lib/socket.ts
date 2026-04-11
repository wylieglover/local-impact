import { io, type Socket } from "socket.io-client"
import { useAuthStore } from "../stores/auth.store"

let socket: Socket | null = null

export function getSocket(): Socket {
  // Return existing socket regardless of connection state —
  // don't create a new one just because it's still connecting
  if (socket) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    auth: {
      token: useAuthStore.getState().accessToken,
    },
  })

  socket.on("connect_error", (err) => {
    console.warn("[WS] Connection error:", err.message)
  })

  socket.on("disconnect", (reason) => {
    console.log("[WS] Disconnected:", reason)
  })

  return socket
}

export function connectSocket(): Socket {
  const s = getSocket()

  // Update token in case it refreshed since socket was created
  s.auth = { token: useAuthStore.getState().accessToken }

  // Only connect if fully disconnected — not if connecting or connected
  if (!s.active) s.connect()

  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null // Reset so next connectSocket() creates fresh
  }
}