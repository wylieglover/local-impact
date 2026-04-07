export type Issue = {
  id: string
  latitude: number
  longitude: number
  description: string
  photoUrl: string | null
  status: 'open' | 'in_progress' | 'resolved'
}