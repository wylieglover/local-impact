import { z } from "zod";

// Reusable password requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

// Registration Schema
export const registerSchema = z.strictObject({
  username: z.string().min(3).max(30).trim(),
  password: passwordSchema,
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().min(10).optional(),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone must be provided",
  path: ["email"],
});

// Login Schema
export const loginSchema = z.strictObject({
  identifier: z.string().min(1, "Username, email, or phone is required"),
  password: z.string().min(1, "Password is required"),
});

// 3. User ID Param (For fetching specific profiles)
export const userIdParamSchema = z.strictObject({
  userId: z.uuid("Invalid User ID format"),
});

/** * TYPE INFERENCE
 * These allow us to 'cast' res.locals.body in the controller
 * so we get full IntelliSense.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;