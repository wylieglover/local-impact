import { useState, useEffect, useRef, useCallback } from 'react'
import { issuesApi } from '../api/issues.api'
import type { Issue } from '../api/issues.api'
import { getDistanceMeters } from '../utils/geo'

const MIN_FETCH_DISTANCE_METERS = 100

type Location = {
  latitude: number
  longitude: number
}

type UseNearbyIssuesOptions = {
  radius?: number
}

type UseNearbyIssuesReturn = {
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useNearbyIssues(
  location: Location | null,
  onFetched: (issues: Issue[]) => void,
  options: UseNearbyIssuesOptions = {}
): UseNearbyIssuesReturn {
  const { radius = 2000 } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFetchedRef = useRef(onFetched)
  useEffect(() => { onFetchedRef.current = onFetched }, [onFetched])

  // Last location we actually fetched from — only update when
  // user has moved MIN_FETCH_DISTANCE_METERS from this point
  const lastFetchLocation = useRef<Location | null>(null)

  const fetchIssues = useCallback(async (loc: Location) => {
    setLoading(true)
    setError(null)
    try {
      const nearby = await issuesApi.getNearby({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius,
      })
      onFetchedRef.current(nearby)
      lastFetchLocation.current = loc
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load nearby issues')
    } finally {
      setLoading(false)
    }
  }, [radius])

  useEffect(() => {
    if (!location) return

    const last = lastFetchLocation.current
    const movedFarEnough =
      !last || getDistanceMeters(last, location) >= MIN_FETCH_DISTANCE_METERS

    if (!movedFarEnough) return

    fetchIssues(location)
  }, [location?.latitude, location?.longitude, fetchIssues])

  // Manual refresh bypasses the distance gate — useful for the retry button
  const refresh = useCallback(() => {
    if (location) fetchIssues(location)
  }, [location, fetchIssues])

  return { loading, error, refresh }
}