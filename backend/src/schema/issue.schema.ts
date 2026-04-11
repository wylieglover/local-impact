import { z } from "zod"

export const createIssueSchema = z.object({
  description: z.string().min(1).max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export const claimIssueSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

// Status update is now only for moderators/admins moving to in_progress
export const updateIssueStatusSchema = z.object({
  status: z.enum(["in_progress", "resolved"]),
})

export const nearbyIssuesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(1609),
})

export const idParamSchema = z.object({
  id: z.uuid(),
})

export type CreateIssueInput = z.infer<typeof createIssueSchema>
export type ClaimIssueInput = z.infer<typeof claimIssueSchema>
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>
export type NearbyIssuesQuery = z.infer<typeof nearbyIssuesQuerySchema>