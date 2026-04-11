import { apiClient } from "./client"

export type IssueStatus = "open" | "claimed" | "in_progress" | "resolved"

export type Issue = {
  id: string
  description: string
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
  status: IssueStatus
  created_at: string
  username: string
  avatar_url: string | null
  latitude: number
  longitude: number
  claimedByUserId: string | null
  distance_meters?: number
}

type CreateIssueResponse = {
  issue: Issue
  newTotalPoints: number
  newExperience: number
  newLevel: number
}

type RawIssue = {
  id: string
  description: string
  beforePhotoUrl?: string | null
  before_photo_url?: string | null
  afterPhotoUrl?: string | null
  after_photo_url?: string | null
  status: IssueStatus
  created_at: string
  username: string
  avatar_url: string | null
  claimed_by_user_id?: string | null
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  distance_meters?: number
}

function mapRawIssue(raw: RawIssue): Issue {
  return {
    id: raw.id,
    description: raw.description,
    beforePhotoUrl: raw.beforePhotoUrl ?? raw.before_photo_url ?? null,
    afterPhotoUrl: raw.afterPhotoUrl ?? raw.after_photo_url ?? null,
    status: raw.status,
    created_at: raw.created_at,
    username: raw.username,
    avatar_url: raw.avatar_url,
    claimedByUserId: raw.claimed_by_user_id ?? null,
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
    photo: File // now required
  }): Promise<CreateIssueResponse> => {
    const formData = new FormData()
    formData.append("description", data.description)
    formData.append("latitude", String(data.latitude))
    formData.append("longitude", String(data.longitude))
    formData.append("photo", data.photo)

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
    const res = await apiClient.get<{ data: { issue: RawIssue } }>(`/issues/${id}`)
    return mapRawIssue(res.data.data.issue)
  },

  claim: async (id: string, latitude: number, longitude: number): Promise<void> => {
    await apiClient.post(`/issues/${id}/claim`, { latitude, longitude })
  },

  resolve: async (id: string, data: {
    latitude: number
    longitude: number
    afterPhoto: File
  }): Promise<void> => {
    const formData = new FormData()
    formData.append("latitude", String(data.latitude))
    formData.append("longitude", String(data.longitude))
    formData.append("after_photo", data.afterPhoto)

    await apiClient.post(`/issues/${id}/resolve`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  updateStatus: async (id: string, status: IssueStatus): Promise<void> => {
    await apiClient.patch(`/issues/${id}/status`, { status })
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`)
  },
}