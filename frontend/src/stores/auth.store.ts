import { create } from "zustand"
import { persist } from "zustand/middleware"

type UserRole = "reporter" | "moderator" | "admin"

type AuthUser = {
  userId: string
  username: string
  role: UserRole
  points: number
}

type AuthStore = {
  accessToken: string | null
  user: AuthUser | null
  isHydrated: boolean // Add this
  setAuth: (token: string, user: AuthUser) => void
  setHydrated: () => void // Add this
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setHydrated: () => set({ isHydrated: true }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "auth",
      // Only persist user, not the access token
      // Access token is short-lived — refresh cookie handles rehydration
      partialize: (state) => ({ user: state.user }),
    }
  )
)