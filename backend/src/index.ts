import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./util/logger.js";

import { authRoutes } from "./route/auth.route.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { issuesRoutes } from "./route/issue.route.js";

const app = express();

// Logging (Put this first to catch everything)
app.use(pinoHttp({ logger }));

// Security & Parsing
app.use(cors({
  origin: env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json()); 

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "up", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issuesRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Local Impact API is live on ${env.BACKEND_URL}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
});