import { z } from "zod"

import { userSchema } from "@/schemas/auth"

export const createManagedUserInputSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  mobile: z.string().trim().min(8),
  password: z.string().min(6),
  role: z.enum(["VALIDATOR", "ADMIN"]),
})

export const usersResponseSchema = z.object({
  users: z.array(userSchema),
})

export const createManagedUserResponseSchema = z.object({
  user: userSchema,
})

