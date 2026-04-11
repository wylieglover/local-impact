import ngeohash from "ngeohash"

// Precision 5 = ~4.9km x 4.9km cells
// A user joining their cell + 8 neighbors covers ~15km x 15km
const PRECISION = 5

export function encode(latitude: number, longitude: number): string {
  return ngeohash.encode(latitude, longitude, PRECISION)
}

export function getSubscriptionRooms(latitude: number, longitude: number): string[] {
  const hash = encode(latitude, longitude)
  const neighbors = ngeohash.neighbors(hash)
  // Return own cell + all 8 neighbors — prefixed to avoid collision with other room types
  return [`geo:${hash}`, ...Object.values(neighbors).map((n) => `geo:${n}`)]
}

export function getRoomForCoords(latitude: number, longitude: number): string {
  return `geo:${encode(latitude, longitude)}`
}