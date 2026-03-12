import { z } from "zod"

export const transportModeCodeSchema = z.enum(["BUS", "METRO", "FERRY"])

export const passTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  validityDays: z.number().int().positive(),
  price: z.number().nonnegative(),
  transportModes: z.array(transportModeCodeSchema).min(1),
  maxTripsPerDay: z.number().int().positive().nullable(),
})

export const userPassStatusSchema = z.enum(["ACTIVE", "EXPIRED"])

export const userPassSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  passTypeId: z.string().min(1),
  passTypeName: z.string().min(1),
  passCode: z.string().min(4),
  purchaseDate: z.string().min(1),
  expiryDate: z.string().min(1),
  status: userPassStatusSchema,
  transportModes: z.array(transportModeCodeSchema).min(1),
  maxTripsPerDay: z.number().int().positive().nullable(),
})

export const purchasePassInputSchema = z.object({
  passTypeId: z.string().min(1),
})

export const passTypesResponseSchema = z.object({
  passTypes: z.array(passTypeSchema),
})

export const purchasePassResponseSchema = z.object({
  pass: userPassSchema,
})

export const myPassesResponseSchema = z.object({
  passes: z.array(userPassSchema),
})

