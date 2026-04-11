import { apiClient } from "./client"

export type Player = {
  id: string
  username: string
  avatar_url: string | null
  role: "reporter" | "moderator" | "admin"
  latitude: number
  longitude: number
  distance_meters: number
}

export type UserProfile = {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
  level: number
  points: number
  role: "reporter" | "moderator" | "admin"
  createdAt: string
}

export type OwnProfile = UserProfile & {
  experience: number
}

type RawPlayer = {
  id: string
  username: string
  avatar_url: string | null
  role: "reporter" | "moderator" | "admin"
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  distance_meters: number
}

function mapRawPlayer(raw: RawPlayer): Player {
  return {
    id: raw.id,
    username: raw.username,
    avatar_url: raw.avatar_url,
    role: raw.role,
    latitude: raw.location.coordinates[1],
    longitude: raw.location.coordinates[0],
    distance_meters: raw.distance_meters,
  }
}

export const usersApi = {
  getNearbyPlayers: async (params: {
    latitude: number
    longitude: number
    radius?: number
  }): Promise<Player[]> => {
    const res = await apiClient.get<{ data: { players: RawPlayer[] } }>(
      "/users/nearby",
      { params }
    )
    return res.data.data.players.map(mapRawPlayer)
  },

  getMe: async (): Promise<OwnProfile> => {
    const res = await apiClient.get<{ data: { user: OwnProfile } }>("/users/me")
    return res.data.data.user
  },

  updateMe: async (data: { bio?: string; avatar?: File }): Promise<OwnProfile> => {
    const formData = new FormData()
    if (data.bio !== undefined) formData.append("bio", data.bio)
    if (data.avatar) formData.append("avatar", data.avatar)

    const res = await apiClient.patch<{ data: { user: OwnProfile } }>(
      "/users/me",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    return res.data.data.user
  },

  getUserById: async (userId: string): Promise<UserProfile> => {
    const res = await apiClient.get<{ data: { user: UserProfile } }>(`/users/${userId}`)
    return res.data.data.user
  },
}