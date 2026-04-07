import express from "express"
import { validate } from "../middleware/validation.middleware.js";

import { loginSchema, registerSchema } from "../schema/auth.schema.js";
import { login, logout, refresh, register } from "../controller/auth.controller.js";

const authRoutes = express.Router();

// Public Routes
authRoutes.post("/register", validate({ body: registerSchema }), register);
authRoutes.post("/login", validate({ body: loginSchema }), login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);

export { authRoutes };