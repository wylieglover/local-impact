import { useState, useEffect, useCallback } from "react"
import { friendshipApi } from "../../api/friendship.api"
import type { Friend } from "../../api/friendship.api"

type UseFriendsReturn = {
  friends: Friend[]
  loading: boolean
  error: string | null
  refresh: () => void
  addFriend: (friend: Friend) => void
  removeFriend: (userId: string) => void
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

  // Initial fetch only — no polling
  useEffect(() => {
    setLoading(true)
    fetchFriends().finally(() => setLoading(false))
  }, [fetchFriends])

  const addFriend = useCallback((friend: Friend) => {
    setFriends((prev) => {
      const exists = prev.some((f) => f.id === friend.id)
      return exists ? prev : [...prev, friend]
    })
  }, [])

  const removeFriend = useCallback((userId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== userId))
  }, [])

  return { friends, loading, error, refresh: fetchFriends, addFriend, removeFriend }
}