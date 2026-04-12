import { useEffect, useState, useRef } from "react"
import { useAuthStore } from "../stores/auth.store"
import { authApi } from "../api/auth.api"

type Props = {
  children: React.ReactNode
}

  export default function AuthInitializer({ children }: Props) {
    const [ready, setReady] = useState(false)
    const hasRun = useRef(false)

    useEffect(() => {
      if (hasRun.current) return
      hasRun.current = true

      const initialize = async () => {
        try {
          await authApi.refreshSession();
        } catch {
          useAuthStore.getState().clearAuth();
        } finally {
          setReady(true)
        }
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