import { z } from "zod"

import { userRoleSchema } from "@/schemas/auth"
import { passTypeSchema, transportModeCodeSchema } from "@/schemas/pass"

export const dashboardStatsSchema = z.object({
  passesSold: z.object({
    daily: z.number().int().nonnegative(),
    weekly: z.number().int().nonnegative(),
    monthly: z.number().int().nonnegative(),
  }),
  validationsByMode: z.array(
    z.object({
      mode: transportModeCodeSchema,
      count: z.number().int().nonnegative(),
    })
  ),
  activePasses: z.number().int().nonnegative(),
  expiredPasses: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  usersByRole: z.array(
    z.object({
      role: userRoleSchema,
      count: z.number().int().nonnegative(),
    })
  ),
  activityTrend: z.array(
    z.object({
      date: z.string(),
      passesSold: z.number().int().nonnegative(),
      validations: z.number().int().nonnegative(),
    })
  ),
  totalRevenue: z.number().nonnegative(),
  revenueByUser: z.array(
    z.object({
      userId: z.string(),
      name: z.string(),
      email: z.string(),
      passCount: z.number().int().nonnegative(),
      revenue: z.number().nonnegative(),
      lastPurchaseAt: z.string().nullable(),
    })
  ),
  purchasedPasses: z.array(
    z.object({
      id: z.string(),
      passCode: z.string(),
      passTypeName: z.string(),
      price: z.number().nonnegative(),
      userName: z.string(),
      userEmail: z.string(),
      purchaseDate: z.string(),
      expiryDate: z.string(),
      status: z.enum(["ACTIVE", "EXPIRED"]),
    })
  ),
})

export const upsertPassTypeInputSchema = z.object({
  name: z.string().trim().min(2),
  validityDays: z.number().int().positive(),
  price: z.number().nonnegative(),
  transportModes: z.array(transportModeCodeSchema).min(1),
  maxTripsPerDay: z.number().int().positive().nullable(),
})

export const passTypeMutationResponseSchema = z.object({
  passType: passTypeSchema,
})

export const adminPassTypesResponseSchema = z.object({
  passTypes: z.array(passTypeSchema),
})
