import { z } from "zod"

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const nearbyPlayersQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(10000).default(1609),
});

export const userIdParamSchema = z.object({
  userId: z.uuid(),
});

export const updateMeSchema = z.object({
  bio: z.string().max(300).optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type NearbyPlayersQuery = z.infer<typeof nearbyPlayersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>