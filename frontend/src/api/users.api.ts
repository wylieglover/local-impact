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

type RawPlayer = {
  id: string
  username: string
  avatar_url: string | null
  role: "reporter" | "moderator" | "admin"
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
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
  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.patch("/users/location", { latitude, longitude })
  },

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
}