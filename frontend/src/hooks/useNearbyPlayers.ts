import { useState, useEffect, useRef, useCallback } from "react"
import { usersApi } from "../api/users.api"
import type { Player } from "../api/users.api"
import { connectSocket } from "../lib/socket"

type UserLocation = { latitude: number; longitude: number }
type UseNearbyPlayersOptions = { radius?: number }
type UseNearbyPlayersReturn = {
  players: Player[]
  loading: boolean
  error: string | null
}

type PlayerMovedPayload = {
  userId: string
  username: string
  latitude: number
  longitude: number
}

export function useNearbyPlayers(
  location: UserLocation | null,
  options: UseNearbyPlayersOptions = {}
): UseNearbyPlayersReturn {
  const { radius = 1609 } = options
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const radiusRef = useRef(radius)
  useEffect(() => { radiusRef.current = radius }, [radius])

  const fetchPlayers = useCallback(async (loc: UserLocation) => {
    try {
      const nearby = await usersApi.getNearbyPlayers({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: radiusRef.current,
      })
      setPlayers(nearby)
      setError(null)
    } catch {
      setError("Failed to load nearby players")
    }
  }, [])

  // Initial fetch only — no polling interval
  useEffect(() => {
    if (!location) return
    setLoading(true)
    fetchPlayers(location).finally(() => setLoading(false))
  }, []) // intentionally empty — only runs on mount

  // Socket — update player positions in real time
  useEffect(() => {
    const socket = connectSocket()

    const handlePlayerMoved = ({ userId, username, latitude, longitude }: PlayerMovedPayload) => {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === userId)
        if (exists) {
          // Update position of existing player
          return prev.map((p) =>
            p.id === userId ? { ...p, latitude, longitude } : p
          )
        }
        // New player entered our geohash — add them
        return [...prev, {
          id: userId,
          username,
          avatar_url: null,
          role: "reporter" as const,
          latitude,
          longitude,
          distance_meters: 0,
        }]
      })
    }

    socket.on("players:moved", handlePlayerMoved)
    return () => { socket.off("players:moved", handlePlayerMoved) }
  }, [])

  return { players, loading, error }
}