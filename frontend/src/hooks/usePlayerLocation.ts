import { useState, useEffect, useRef, useCallback } from "react"
import { usersApi } from "../api/users.api"
import { getDistanceMeters } from '../utils/geo'

// Only push a location update when the user has moved at least this far
const MIN_DISTANCE_METERS = 10
const SMOOTHING = 0.3

type UserLocation = { latitude: number; longitude: number }

type UsePlayerLocationReturn = {
  userLocation: UserLocation | null
  locationError: string | null
}

function smooth(previous: UserLocation, next: UserLocation): UserLocation {
  return {
    latitude: previous.latitude + SMOOTHING * (next.latitude - previous.latitude),
    longitude: previous.longitude + SMOOTHING * (next.longitude - previous.longitude),
  }
}

export function usePlayerLocation(): UsePlayerLocationReturn {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Tracks the last position we actually sent to the backend
  const lastSentLocation = useRef<UserLocation | null>(null)

  const pushLocation = useCallback(async (location: UserLocation) => {
    try {
      await usersApi.updateLocation(location.latitude, location.longitude)
      lastSentLocation.current = location
    } catch {
      // Non-fatal — local position still updates, we just skip this push
      console.warn("Failed to push location to server")
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        // Always accept the first reading so we get past the loading screen.
        // After that, filter out inaccurate readings — desktop/WiFi geolocation
        // typically returns 100-1000m accuracy which we don't want moving the marker
        const isFirstReading = lastSentLocation.current === null
        if (!isFirstReading && position.coords.accuracy > 30) return

        setUserLocation((prev) => prev ? smooth(prev, next) : next)

        const last = lastSentLocation.current
        const shouldPush =
          !last || getDistanceMeters(last, next) >= MIN_DISTANCE_METERS

        if (shouldPush) {
          pushLocation(next)
        }
      },
      () => setLocationError('Unable to retrieve your location'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [pushLocation])

  return { userLocation, locationError }
}