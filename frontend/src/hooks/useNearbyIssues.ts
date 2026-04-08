import { useState, useEffect, useRef, useCallback } from 'react'
import { issuesApi } from '../api/issues.api'
import type { Issue } from '../api/issues.api'

type Location = {
  latitude: number
  longitude: number
}

type UseNearbyIssuesOptions = {
  radius?: number
  debounceMs?: number
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
  const { radius = 2000, debounceMs = 600 } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFetchedRef = useRef(onFetched)

  useEffect(() => {
    onFetchedRef.current = onFetched
  }, [onFetched])

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
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load nearby issues')
    } finally {
      setLoading(false)
    }
  }, [radius])

  useEffect(() => {
    if (!location) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchIssues(location)
    }, debounceMs)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [location?.latitude, location?.longitude, fetchIssues, debounceMs])

  const refresh = useCallback(() => {
    if (location) fetchIssues(location)
  }, [location, fetchIssues])

  return { loading, error, refresh }
}