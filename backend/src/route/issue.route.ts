import express from "express";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createIssueSchema,
  updateIssueStatusSchema,
  nearbyIssuesQuerySchema,
  idParamSchema
} from "../schema/issue.schema.js";
import {
  createIssue,
  deleteIssue,
  getIssueById,
  getNearbyIssues,
  updateIssueStatus,
} from "../controller/issue.controller.js";

const issuesRoutes = express.Router();

issuesRoutes.use(authenticate);

issuesRoutes.get(
  "/nearby",
  validate({ query: nearbyIssuesQuerySchema }),
  authorize("reporter", "moderator", "admin"),
  getNearbyIssues
);

issuesRoutes.get(
  "/:id",
  validate({ params: idParamSchema }),
  authorize("reporter", "moderator", "admin"),
  getIssueById
);

issuesRoutes.post(
  "/",
  upload.single("photo"),
  validate({ body: createIssueSchema }),
  authorize("reporter", "moderator", "admin"),
  createIssue
);

issuesRoutes.patch(
  "/:id/status",
  validate({ params: idParamSchema, body: updateIssueStatusSchema }),
  authorize("moderator", "admin"),
  updateIssueStatus
);

issuesRoutes.delete(
  "/:id",
  validate({ params: idParamSchema }),
  authorize("reporter", "moderator", "admin"),
  deleteIssue
);

export { issuesRoutes };