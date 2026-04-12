import { apiClient } from "./client"
import { useAuthStore } from "../stores/auth.store"
import { plainClient } from "./plainClient"

/**
 * Matches the actual JSON structure returned by your Express controllers.
 * Note: 'id' comes from the DB/Backend, which we map to 'userId' for Zustand.
 */
type AuthResponse = {
  status: string
  data: {
    user: {
      id: string
      username: string
      role: "reporter" | "moderator" | "admin"
      email?: string
      points?: number
      experience?: number
      level?: number
    }
    accessToken: string
  }
}

export const authApi = {
  register: async (data: {
    username: string
    email?: string
    phone?: string
    password: string
  }) => {
    const res = await apiClient.post<AuthResponse>("/auth/register", data)
    const { accessToken, user } = res.data.data

    // Mapping backend 'id' -> frontend 'userId'
    useAuthStore.getState().setAuth(accessToken, {
      userId: user.id,
      username: user.username,
      role: user.role,
      points: user.points ?? 0,
      experience: user.experience ?? 0,
      level: user.level ?? 1
    })
    
    return res.data.data
  },

  login: async (data: { identifier: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>("/auth/login", data)
    const { accessToken, user } = res.data.data

    useAuthStore.getState().setAuth(accessToken, {
      userId: user.id,
      username: user.username,
      role: user.role,
      points: user.points ?? 0,
      experience: user.experience ?? 0,
      level: user.level ?? 1
    })
    
    return res.data.data
  },
  
  refreshSession: async () => {
    const res = await plainClient.post("/auth/refresh");
    const { accessToken, user } = res.data.data;

    useAuthStore.getState().setAuth(accessToken, {
      userId: user.id,
      username: user.username,
      role: user.role,
      points: user.points ?? 0,
      experience: user.experience ?? 0,
      level: user.level ?? 1
    });

    return accessToken;
  },

  logout: async () => {
    // Clears the backend session and the HttpOnly cookie
    await apiClient.post("/auth/logout")
    // Clears the Zustand store (user and accessToken)
    useAuthStore.getState().clearAuth()
  },
}