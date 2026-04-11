import { useState, useEffect, useCallback } from "react"
import { friendshipApi } from "../../api/friendship.api"
import type { FriendRequest, SentRequest } from "../../api/friendship.api"

type UseFriendRequestsReturn = {
  requests: FriendRequest[]
  sentRequests: SentRequest[]
  loading: boolean
  error: string | null
  addRequest: (request: FriendRequest) => void
  removeSentRequest: (userId: string) => void
  acceptRequest: (userId: string) => Promise<void>
  declineRequest: (userId: string) => Promise<void>
  refresh: () => void
}

export function useFriendRequests(): UseFriendRequestsReturn {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const [incoming, sent] = await Promise.all([
        friendshipApi.getFriendRequests(),
        friendshipApi.getSentRequests(),
      ])
      setRequests(incoming)
      setSentRequests(sent)
      setError(null)
    } catch {
      setError("Failed to load friend requests")
    }
  }, [])

  // Initial fetch only — no polling
  useEffect(() => {
    setLoading(true)
    fetchRequests().finally(() => setLoading(false))
  }, [fetchRequests])

  const addRequest = useCallback((request: FriendRequest) => {
    setRequests((prev) => {
      const exists = prev.some((r) => r.sender_id === request.sender_id)
      return exists ? prev : [...prev, request]
    })
  }, [])

  const removeSentRequest = useCallback((userId: string) => {
    setSentRequests((prev) => prev.filter((r) => r.receiver_id !== userId))
  }, [])

  const acceptRequest = useCallback(async (userId: string) => {
    await friendshipApi.acceptRequest(userId)
    setRequests((prev) => prev.filter((r) => r.sender_id !== userId))
  }, [])

  const declineRequest = useCallback(async (userId: string) => {
    await friendshipApi.removeFriend(userId)
    setRequests((prev) => prev.filter((r) => r.sender_id !== userId))
  }, [])

  return {
    requests,
    sentRequests,
    loading,
    error,
    addRequest,
    removeSentRequest,
    acceptRequest,
    declineRequest,
    refresh: fetchRequests,
  }
}