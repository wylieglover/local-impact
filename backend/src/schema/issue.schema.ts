import { z } from "zod";

export const idParamSchema = z.object({ id: z.uuid("Issue ID not specified") })

export const createIssueSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
});

export const updateIssueStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]),
});

export const nearbyIssuesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).default(1000),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;
export type NearbyIssuesQuery = z.infer<typeof nearbyIssuesQuerySchema>;