import { useState, useCallback } from 'react'
import type { Issue } from '../api/issues.api'

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([])

  const addIssue = useCallback((issue: Issue) => {
    setIssues((prev) => {
      const exists = prev.some((i) => i.id === issue.id)
      if (exists) return prev
      return [...prev, issue]
    })
  }, [])

  const mergeIssues = useCallback((incoming: Issue[]) => {
    setIssues((prev) => {
      const existingIds = new Set(prev.map((i) => i.id))
      const newOnes = incoming.filter((i) => !existingIds.has(i.id))
      return [...prev, ...newOnes]
    })
  }, [])

  const updateIssueStatus = useCallback(
    (id: string, status: Issue['status']) => {
      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      )
    },
    []
  )

  const removeIssue = useCallback((id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { issues, addIssue, mergeIssues, updateIssueStatus, removeIssue }
}