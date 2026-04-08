import { useState, useEffect, useRef, useCallback } from "react"
import { usersApi } from "../api/users.api"
import type { Player } from "../api/users.api"

const POLL_INTERVAL_MS = 5000

type UserLocation = { latitude: number; longitude: number }

type UseNearbyPlayersOptions = {
  radius?: number
}

type UseNearbyPlayersReturn = {
  players: Player[]
  loading: boolean
  error: string | null
}

export function useNearbyPlayers(
  location: UserLocation | null,
  options: UseNearbyPlayersOptions = {}
): UseNearbyPlayersReturn {
  const { radius = 1609 } = options

  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep radius stable in a ref so the interval doesn't need to re-register
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

  useEffect(() => {
    if (!location) return

    // Fetch immediately on mount / location becoming available
    setLoading(true)
    fetchPlayers(location).finally(() => setLoading(false))

    const intervalId = setInterval(() => {
      fetchPlayers(location)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [location, fetchPlayers])

  return { players, loading, error }
}