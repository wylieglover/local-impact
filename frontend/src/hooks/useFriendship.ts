import { useState, useEffect, useCallback } from "react"
import { friendshipApi } from "../api/friendship.api"
import type { Friend, FriendRequest, SentRequest } from "../api/friendship.api"

type FriendshipState = "none" | "pending_sent" | "pending_received" | "accepted" | "loading"

type UseFriendshipReturn = {
  state: FriendshipState
  sendRequest: () => Promise<void>
  acceptRequest: () => Promise<void>
  removeFriend: () => Promise<void>
  error: string | null
}

export function useFriendship(
  targetUserId: string,
  friends: Friend[],
  requests: FriendRequest[],
  sentRequests: SentRequest[]
): UseFriendshipReturn {
  const [state, setState] = useState<FriendshipState>("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!targetUserId) return

    const isFriend = friends.some((f) => f.id === targetUserId)
    if (isFriend) { setState("accepted"); return }

    const hasPendingReceived = requests.some((r) => r.sender_id === targetUserId)
    if (hasPendingReceived) { setState("pending_received"); return }

    const hasPendingSent = sentRequests.some((r) => r.receiver_id === targetUserId)
    if (hasPendingSent) { setState("pending_sent"); return }

    setState("none")
  }, [targetUserId, friends, requests, sentRequests])

  const sendRequest = useCallback(async () => {
    setState("pending_sent")
    try {
      await friendshipApi.sendRequest(targetUserId)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to send request")
      setState("none")
    }
  }, [targetUserId])

  const acceptRequest = useCallback(async () => {
    try {
      await friendshipApi.acceptRequest(targetUserId)
      setState("accepted")
      setError(null)
    } catch {
      setError("Failed to accept request")
    }
  }, [targetUserId])

  const removeFriend = useCallback(async () => {
    try {
      await friendshipApi.removeFriend(targetUserId)
      setState("none")
      setError(null)
    } catch {
      setError("Failed to remove friend")
    }
  }, [targetUserId])

  return { state, sendRequest, acceptRequest, removeFriend, error }
}