import { useEffect } from "react"
import { connectSocket } from "../../../lib/socket"
import type { Issue, IssueStatus } from "../../../api/issues.api"

type Handlers = {
  onNewIssue: (issue: Issue) => void
  onStatusChanged: (id: string, status: IssueStatus) => void
  onDeleted: (id: string) => void
}

type RawSocketIssue = {
  id: string
  description: string
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
  status: IssueStatus
  createdAt: string
  latitude: number
  longitude: number
  username: string
  avatar_url: string | null
  claimedByUserId: string | null
}

export function useIssueSocket({ onNewIssue, onStatusChanged, onDeleted }: Handlers) {
  useEffect(() => {
    const socket = connectSocket()

    const handleNewIssue = (raw: RawSocketIssue) => {
      onNewIssue({
        id: raw.id,
        description: raw.description,
        beforePhotoUrl: raw.beforePhotoUrl,
        afterPhotoUrl: raw.afterPhotoUrl,
        status: raw.status,
        created_at: raw.createdAt,
        latitude: raw.latitude,
        longitude: raw.longitude,
        username: raw.username,
        avatar_url: raw.avatar_url,
        claimedByUserId: raw.claimedByUserId,
      })
    }

    const handleStatusChanged = ({ issueId, status }: { issueId: string; status: IssueStatus }) => {
      onStatusChanged(issueId, status)
    }

    const handleDeleted = ({ issueId }: { issueId: string }) => {
      onDeleted(issueId)
    }

    socket.on("issues:new", handleNewIssue)
    socket.on("issues:status_changed", handleStatusChanged)
    socket.on("issues:deleted", handleDeleted)

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message)
    })

    return () => {
      socket.off("issues:new", handleNewIssue)
      socket.off("issues:status_changed", handleStatusChanged)
      socket.off("issues:deleted", handleDeleted)
    }
  }, [])
}