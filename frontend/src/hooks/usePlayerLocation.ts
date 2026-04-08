import { useState, useEffect, useRef, useCallback } from "react"
import { usersApi } from "../api/users.api"

// Only push a location update when the user has moved at least this far
const MIN_DISTANCE_METERS = 10
const SMOOTHING = 0.3

type UserLocation = { latitude: number; longitude: number }

type UsePlayerLocationReturn = {
  userLocation: UserLocation | null
  locationError: string | null
}

/**
 * Haversine formula — returns distance in meters between two coordinates.
 */
function getDistanceMeters(a: UserLocation, b: UserLocation): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const a2 =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLng * sinDLng

  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
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
        // Skip readings that are too uncertain — GPS cold start
        // can return positions wildly off until it gets a proper fix
        if (position.coords.accuracy > 30) return

        const next: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

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