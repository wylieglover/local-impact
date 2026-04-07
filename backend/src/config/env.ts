import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // URLs
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),

  // Secrets
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REFRESH_TOKEN_HMAC_SECRET: z.string().min(32),

  // Supabase
  SUPABASE_BUCKET_URL: z.url(),
  SUPABASE_BUCKET_SECRET_KEY: z.string().min(32),
  SUPABASE_BUCKET_NAME: z.string()
});

// Validate process.env against the schema
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

// Extract the data
const data = parsed.data;

// Computed values
const JWT_ACCESS_EXPIRY = data.NODE_ENV === "development" 
  ? 5 * 60 * 60 
  : 15 * 60;

const JWT_REFRESH_EXPIRY = 7 * 24 * 60 * 60;

export const env = {
  ...data,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
};