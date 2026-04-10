import { z } from "zod"

export const friendUserIdParamSchema = z.object({
  userId: z.uuid(),
})

export type FriendUserIdParam = z.infer<typeof friendUserIdParamSchema>