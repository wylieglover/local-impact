import { useState, useEffect, useCallback } from "react"
import { friendshipApi } from "../api/friendship.api"
import type { Friend } from "../api/friendship.api"

const POLL_INTERVAL_MS = 30000

type UseFriendsReturn = {
  friends: Friend[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFriends(): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    try {
      const data = await friendshipApi.getFriends()
      setFriends(data)
      setError(null)
    } catch {
      setError("Failed to load friends")
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchFriends().finally(() => setLoading(false))

    const intervalId = setInterval(fetchFriends, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [fetchFriends])

  return { friends, loading, error, refresh: fetchFriends }
}