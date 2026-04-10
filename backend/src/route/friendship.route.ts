import express from "express"
import { validate } from "../middleware/validation.middleware.js"
import { authenticate } from "../middleware/authenticate.middleware.js"
import { authorize } from "../middleware/authorize.middleware.js"
import { friendUserIdParamSchema } from "../schema/friendship.schema.js"
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getSentRequests,
} from "../controller/friendship.controller.js"

const friendshipRoutes = express.Router();

friendshipRoutes.use(authenticate);

// Static routes first
friendshipRoutes.get(
  "/",
  authorize("reporter", "moderator", "admin"),
  getFriends
);

friendshipRoutes.get(
  "/requests",
  authorize("reporter", "moderator", "admin"),
  getFriendRequests
);

friendshipRoutes.get(
  "/sent",
  authorize("reporter", "moderator", "admin"),
  getSentRequests
);

// Param routes after
friendshipRoutes.post(
  "/request/:userId",
  validate({ params: friendUserIdParamSchema }),
  authorize("reporter", "moderator", "admin"),
  sendFriendRequest
);

friendshipRoutes.patch(
  "/accept/:userId",
  validate({ params: friendUserIdParamSchema }),
  authorize("reporter", "moderator", "admin"),
  acceptFriendRequest
);

friendshipRoutes.delete(
  "/:userId",
  validate({ params: friendUserIdParamSchema }),
  authorize("reporter", "moderator", "admin"),
  removeFriend
);

export { friendshipRoutes };