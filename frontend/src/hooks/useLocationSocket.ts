import { useEffect, useRef } from "react"
import { connectSocket } from "../lib/socket"

const MIN_DISTANCE_METERS = 10

type Location = { latitude: number; longitude: number }

function getDistanceMeters(a: Location, b: Location): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const a2 = sinDLat * sinDLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2))
}

export function useLocationSocket(location: Location | null) {
  const lastSent = useRef<Location | null>(null)

  useEffect(() => {
    if (!location) return

    const socket = connectSocket()
    const last = lastSent.current
    const shouldSend = !last || getDistanceMeters(last, location) >= MIN_DISTANCE_METERS

    if (!shouldSend) return

    socket.emit("location:update", {
      latitude: location.latitude,
      longitude: location.longitude,
    })

    lastSent.current = location
  }, [location?.latitude, location?.longitude])
}