import { useEffect } from "react"
import { connectSocket } from "../lib/socket"
import type { Friend, FriendRequest } from "../api/friendship.api"

type Handlers = {
  onRequestReceived: (request: FriendRequest) => void
  onRequestAccepted: (friend: Friend) => void
  onFriendRemoved: (userId: string) => void
}

export function useFriendSocket({ onRequestReceived, onRequestAccepted, onFriendRemoved }: Handlers) {
  useEffect(() => {
    const socket = connectSocket()

    const handleRequestReceived = (data: { sender: {
      id: string
      username: string
      avatar_url: string | null
      level: number
    }}) => {
      onRequestReceived({
        id: crypto.randomUUID(), // temp id until next fetch
        created_at: new Date().toISOString(),
        sender_id: data.sender.id,
        username: data.sender.username,
        avatar_url: data.sender.avatar_url,
        level: data.sender.level,
      })
    }

    const handleRequestAccepted = (data: { accepter: {
      id: string
      username: string
      avatar_url: string | null
      level: number
      points: number
    }}) => {
      onRequestAccepted({
        id: data.accepter.id,
        username: data.accepter.username,
        avatar_url: data.accepter.avatar_url,
        level: data.accepter.level,
        points: data.accepter.points ?? 0,
        presence: "online",
        last_seen: new Date().toISOString(),
      })
    }

    const handleFriendRemoved = ({ userId }: { userId: string }) => {
      onFriendRemoved(userId)
    }

    socket.on("friends:request_received", handleRequestReceived)
    socket.on("friends:request_accepted", handleRequestAccepted)
    socket.on("friends:removed", handleFriendRemoved)

    return () => {
      socket.off("friends:request_received", handleRequestReceived)
      socket.off("friends:request_accepted", handleRequestAccepted)
      socket.off("friends:removed", handleFriendRemoved)
    }
  }, [])
}