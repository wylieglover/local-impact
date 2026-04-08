type Location = { latitude: number; longitude: number }

export function getDistanceMeters(a: Location, b: Location): number {
  const R = 6371000
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