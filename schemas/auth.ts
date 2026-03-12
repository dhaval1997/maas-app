import { z } from "zod"

export const userRoleSchema = z.enum([
  "COMMUTER",
  "VALIDATOR",
  "ADMIN",
  "SUPER_ADMIN",
])

export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(8),
  role: userRoleSchema,
  createdAt: z.string().min(1),
})

export const loginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
})

export const registerInputSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  mobile: z.string().trim().min(8),
  password: z.string().min(6),
})

export const authSessionSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
})

export const authResponseSchema = authSessionSchema
