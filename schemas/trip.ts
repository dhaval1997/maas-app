import { z } from "zod"

import { transportModeCodeSchema } from "@/schemas/pass"

export const tripSchema = z.object({
  id: z.string().min(1),
  userPassId: z.string().min(1),
  passCode: z.string().min(4),
  validatedBy: z.string().min(1),
  transportMode: transportModeCodeSchema,
  routeInfo: z.string().nullable(),
  validatedAt: z.string().min(1),
})

export const tripHistoryFiltersSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  transportMode: z.union([transportModeCodeSchema, z.literal("ALL")]).optional(),
})

export const tripHistoryResponseSchema = z.object({
  trips: z.array(tripSchema),
})

