import { apiClient } from "./client"

export type FriendPresence = "online" | "recently_seen" | "offline"

export type Friend = {
  id: string
  username: string
  avatar_url: string | null
  level: number
  points: number
  presence: FriendPresence
  last_seen: string | null
}

export type FriendRequest = {
  id: string
  created_at: string
  sender_id: string
  username: string
  avatar_url: string | null
  level: number
}

export type SentRequest = {
  id: string
  created_at: string
  receiver_id: string
  username: string
  avatar_url: string | null
  level: number
}

export const friendshipApi = {
  getFriends: async (): Promise<Friend[]> => {
    const res = await apiClient.get<{ data: { friends: Friend[] } }>("/friends")
    return res.data.data.friends
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    const res = await apiClient.get<{ data: { requests: FriendRequest[] } }>("/friends/requests")
    return res.data.data.requests
  },

  getSentRequests: async (): Promise<SentRequest[]> => {
    const res = await apiClient.get<{ data: { sent: SentRequest[] } }>("/friends/sent")
    return res.data.data.sent
  },

  sendRequest: async (userId: string): Promise<void> => {
    await apiClient.post(`/friends/request/${userId}`)
  },

  acceptRequest: async (userId: string): Promise<void> => {
    await apiClient.patch(`/friends/accept/${userId}`)
  },

  removeFriend: async (userId: string): Promise<void> => {
    await apiClient.delete(`/friends/${userId}`)
  },
}