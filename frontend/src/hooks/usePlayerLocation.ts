import { useState, useEffect } from "react"
import { getDistanceMeters } from '../utils/geo'

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    let isFirst = true

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isFirst && position.coords.accuracy > 30) return

        isFirst = false

        const next: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setUserLocation((prev) => prev ? smooth(prev, next) : next)
      },
      () => setLocationError('Unable to retrieve your location'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { userLocation, locationError }
}