import { z } from "zod"

import { transportModeCodeSchema } from "@/schemas/pass"

export const validatePassInputSchema = z.object({
  passCode: z.string().trim().min(4),
  transportMode: transportModeCodeSchema,
  routeInfo: z.string().trim().max(120).optional(),
})

export const validatePassResultSchema = z.object({
  isValid: z.boolean(),
  reason: z.string(),
  validatedAt: z.string(),
  tripId: z.string().optional(),
})

