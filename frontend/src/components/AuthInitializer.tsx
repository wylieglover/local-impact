import { plainClient } from "../api/plainClient"
import { useEffect, useState, useRef } from "react"
import { useAuthStore } from "../stores/auth.store"

type Props = {
  children: React.ReactNode
}

export default function AuthInitializer({ children }: Props) {
  const [ready, setReady] = useState(false)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const initialize = async () => {
      if (!user) {
        setReady(true)
        return
      }

      if (!accessToken) {
        try {
          const { data } = await plainClient.post("/auth/refresh")
          const newToken = data.data.accessToken
          const refreshedUser = data.data.user

          setAuth(newToken, {
            userId: refreshedUser.id,
            username: refreshedUser.username,
            role: refreshedUser.role,
            points: refreshedUser.points ?? 0,
          })
        } catch {
          clearAuth()
        }
      }

      setReady(true)
    }

    initialize()
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}