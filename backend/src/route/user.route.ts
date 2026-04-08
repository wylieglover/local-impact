import express from "express"
import { validate } from "../middleware/validation.middleware.js"
import { authenticate } from "../middleware/authenticate.middleware.js"
import { authorize } from "../middleware/authorize.middleware.js"
import { updateLocationSchema, nearbyPlayersQuerySchema } from "../schema/user.schema.js"
import { updateLocation, getNearbyPlayers } from "../controller/user.controller.js"

const userRoutes = express.Router()

userRoutes.use(authenticate)

userRoutes.patch(
  "/location",
  validate({ body: updateLocationSchema }),
  authorize("reporter", "moderator", "admin"),
  updateLocation
)

userRoutes.get(
  "/nearby",
  validate({ query: nearbyPlayersQuerySchema }),
  authorize("reporter", "moderator", "admin"),
  getNearbyPlayers
)

export { userRoutes }