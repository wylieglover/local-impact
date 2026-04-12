import { io, type Socket } from "socket.io-client"
import { useAuthStore } from "../stores/auth.store"
import { authApi } from "../api/auth.api"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    // 1. Pulls the newest token from Zustand every time it tries to connect
    auth: (cb) => {
      cb({ token: useAuthStore.getState().accessToken });
    },
  })

  // 2. The "Safety Net"
  socket.on("connect_error", async (err) => {
    if (err.message === "INVALID_TOKEN" || err.message === "UNAUTHORIZED") {
      console.warn("[WS] Token dead. Refreshing...");
      try {
        await authApi.refreshSession(); // Updates Zustand automatically
        socket?.connect();              // Re-attempts with new token
      } catch {
        console.error("[WS] Session lost. User must log in.");
        useAuthStore.getState().clearAuth();
      }
    }
  });

  return socket
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}