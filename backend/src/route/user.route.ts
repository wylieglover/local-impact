import express from "express"
import { upload } from "../middleware/upload.middleware.js"
import { validate } from "../middleware/validation.middleware.js"
import { authenticate } from "../middleware/authenticate.middleware.js"
import { authorize } from "../middleware/authorize.middleware.js"
import {
  updateLocationSchema,
  nearbyPlayersQuerySchema,
  userIdParamSchema,
  updateMeSchema,
} from "../schema/user.schema.js"
import {
  updateLocation,
  getNearbyPlayers,
  getMe,  
  getUserById,
  updateMe,
} from "../controller/user.controller.js"

const userRoutes = express.Router();

userRoutes.use(authenticate);

userRoutes.get(
  "/me",
  authorize("reporter", "moderator", "admin"),
  getMe
);

userRoutes.get(
  "/nearby",
  validate({ query: nearbyPlayersQuerySchema }),
  authorize("reporter", "moderator", "admin"),
  getNearbyPlayers
);

userRoutes.patch(
  "/location",
  validate({ body: updateLocationSchema }),
  authorize("reporter", "moderator", "admin"),
  updateLocation
);

userRoutes.patch(
  "/me",
  upload.single("avatar"),
  validate({ body: updateMeSchema }),
  authorize("reporter", "moderator", "admin"),
  updateMe
);

// Dynamic param route last — catches anything that didn't match above
userRoutes.get(
  "/:userId",
  validate({ params: userIdParamSchema }),
  authorize("reporter", "moderator", "admin"),
  getUserById
);

export { userRoutes };