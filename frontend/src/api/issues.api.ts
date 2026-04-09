import { apiClient } from "./client"

export type IssueStatus = "open" | "in_progress" | "resolved"

export type Issue = {
  id: string
  description: string
  photoUrl: string | null
  status: IssueStatus
  created_at: string
  username: string
  avatar_url: string | null
  latitude: number
  longitude: number
  distance_meters?: number
}

type CreateIssueResponse = {
  issue: Issue
  newTotalPoints: number
  newExperience: number
  newLevel: number
}

// Raw shape returned by the backend before mapping
type RawIssue = {
  id: string
  description: string
  photoUrl?: string | null
  photo_url?: string | null
  status: IssueStatus
  created_at: string
  username: string
  avatar_url: string | null
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  distance_meters?: number
}

function mapRawIssue(raw: RawIssue): Issue {
  return {
    id: raw.id,
    description: raw.description,
    photoUrl: raw.photoUrl ?? raw.photo_url ?? null,
    status: raw.status,
    created_at: raw.created_at,
    username: raw.username,
    avatar_url: raw.avatar_url,
    latitude: raw.location.coordinates[1],
    longitude: raw.location.coordinates[0],
    distance_meters: raw.distance_meters,
  }
}

export const issuesApi = {
  create: async (data: {
    description: string
    latitude: number
    longitude: number
    photo?: File
  }): Promise<CreateIssueResponse> => {
    const formData = new FormData()
    formData.append("description", data.description)
    formData.append("latitude", String(data.latitude))
    formData.append("longitude", String(data.longitude))
    if (data.photo) formData.append("photo", data.photo)

    const res = await apiClient.post("/issues", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return {
      issue: mapRawIssue(res.data.data.issue),
      newTotalPoints: res.data.data.newTotalPoints,
      newExperience: res.data.data.newExperience,
      newLevel: res.data.data.newLevel, 
    }
  },

  getNearby: async (params: {
    latitude: number
    longitude: number
    radius?: number
  }): Promise<Issue[]> => {
    const res = await apiClient.get<{ data: { issues: RawIssue[] } }>(
      "/issues/nearby",
      { params }
    )
    return res.data.data.issues.map(mapRawIssue)
  },

  getById: async (id: string): Promise<Issue> => {
    const res = await apiClient.get<{ data: { issue: RawIssue } }>(
      `/issues/${id}`
    )
    return mapRawIssue(res.data.data.issue)
  },

  updateStatus: async (id: string, status: IssueStatus): Promise<Issue> => {
    const res = await apiClient.patch<{ data: { issue: RawIssue } }>(
      `/issues/${id}/status`,
      { status }
    )
    return mapRawIssue(res.data.data.issue)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`)
  },
}