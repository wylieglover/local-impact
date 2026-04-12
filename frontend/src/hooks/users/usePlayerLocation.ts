import { useState, useEffect, useRef } from "react"

type UserLocation = {
  latitude: number
  longitude: number
  accuracy: number
  heading: number | null
}

type LastPosition = {
  lat: number
  lng: number
  time: number
}

function getDistanceMeters(a: LastPosition, b: LastPosition) {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const a2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
}

export function usePlayerLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const lastRaw = useRef<LastPosition | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords
        const now = position.timestamp

        let finalLat = latitude
        let finalLng = longitude

        const currentRaw = { lat: latitude, lng: longitude, time: now }

        // 🧠 Speed-based anomaly rejection (NO freezing)
        if (lastRaw.current) {
          const dt = (now - lastRaw.current.time) / 1000

          if (dt > 0) {
            const distance = getDistanceMeters(lastRaw.current, currentRaw)
            const calculatedSpeed = distance / dt
            const actualSpeed = speed ?? calculatedSpeed

            if (distance < 3 && actualSpeed < 0.5) {
              lastRaw.current = { ...lastRaw.current, time: now }
              return // Throw it away, don't update React state
            }
            // If moving faster than ~30 m/s (~67 mph), likely GPS spike
            if (calculatedSpeed > 30) {
              // update time so we don't freeze, but ignore position
              lastRaw.current = { ...lastRaw.current, time: now }
              return
            }

            // 🔮 Light forward prediction (only when moving)
            if (actualSpeed > 1 && heading !== null) {
              const predictionTime = 0.4
              const distanceAhead = actualSpeed * predictionTime

              const R = 6371000
              const toRad = (deg: number) => (deg * Math.PI) / 180
              const toDeg = (rad: number) => (rad * 180) / Math.PI

              const angularDistance = distanceAhead / R
              const bearing = toRad(heading)

              const latRad = toRad(latitude)
              const lngRad = toRad(longitude)

              const newLat = Math.asin(
                Math.sin(latRad) * Math.cos(angularDistance) +
                  Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
              )

              const newLng =
                lngRad +
                Math.atan2(
                  Math.sin(bearing) *
                    Math.sin(angularDistance) *
                    Math.cos(latRad),
                  Math.cos(angularDistance) -
                    Math.sin(latRad) * Math.sin(newLat)
                )

              finalLat = toDeg(newLat)
              finalLng = toDeg(newLng)
            }
          }
        }

        lastRaw.current = currentRaw

        // 🎯 Weighted smoothing (Gemini's idea, but applied safely)
        setUserLocation((prev) => {
          if (!prev) {
            return {
              latitude: finalLat,
              longitude: finalLng,
              accuracy,
              heading,
            }
          }

          const baseAccuracy = 20

          const alpha = Math.max(
            0.1,
            Math.min(0.9, baseAccuracy / accuracy)
          )

          return {
            latitude:
              prev.latitude + alpha * (finalLat - prev.latitude),
            longitude:
              prev.longitude + alpha * (finalLng - prev.longitude),
            accuracy,
            heading,
          }
        })
      },
      (err) => setLocationError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { userLocation, locationError }
}