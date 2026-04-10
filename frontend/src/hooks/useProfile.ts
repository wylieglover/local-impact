import { useState, useEffect } from "react"
import { usersApi } from "../api/users.api"
import type { UserProfile, OwnProfile } from "../api/users.api"

type UseProfileReturn = {
  profile: UserProfile | OwnProfile | null
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | OwnProfile | null>>
  loading: boolean
  error: string | null
}

export function useProfile(userId: string | "me"): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | OwnProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = userId === "me"
          ? await usersApi.getMe()
          : await usersApi.getUserById(userId)
        setProfile(data)
      } catch {
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [userId])

  return { profile, setProfile, loading, error }
}