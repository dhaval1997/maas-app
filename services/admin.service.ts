import { subDays } from "date-fns"

import { appEnv } from "@/lib/env"
import {
  adminPassTypesResponseSchema,
  dashboardStatsSchema,
  passTypeMutationResponseSchema,
  upsertPassTypeInputSchema,
} from "@/schemas/admin"
import { getStoredAuthToken } from "@/services/auth-token"
import { ApiError, apiClient } from "@/services/api-client"
import {
  createId,
  getCurrentMockUser,
  mockDelay,
  mockStore,
  syncPassStatuses,
} from "@/services/mock-store"
import type {
  AdminPassTypesResponse,
  DashboardStats,
  PassTypeMutationResponse,
  UpsertPassTypeInput,
} from "@/types/admin"

function requireAdmin() {
  const token = getStoredAuthToken()
  const user = getCurrentMockUser(token)

  if (!user) {
    throw new ApiError("Please login to continue.", 401)
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("Admin access required.", 403)
  }

  return user
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!appEnv.useMockApi) {
    return apiClient.get<DashboardStats>("/api/admin/dashboard", {
      schema: dashboardStatsSchema,
    })
  }

  requireAdmin()
  syncPassStatuses()

  const now = new Date()
  const startDaily = subDays(now, 1).getTime()
  const startWeekly = subDays(now, 7).getTime()
  const startMonthly = subDays(now, 30).getTime()

  const passesSold = {
    daily: 0,
    weekly: 0,
    monthly: 0,
  }

  mockStore.userPasses.forEach((entry) => {
    const purchaseTime = new Date(entry.purchaseDate).getTime()

    if (purchaseTime >= startDaily) {
      passesSold.daily += 1
    }
    if (purchaseTime >= startWeekly) {
      passesSold.weekly += 1
    }
    if (purchaseTime >= startMonthly) {
      passesSold.monthly += 1
    }
  })

  const modeCounts = {
    BUS: 0,
    METRO: 0,
    FERRY: 0,
  }

  mockStore.trips.forEach((trip) => {
    modeCounts[trip.transportMode] += 1
  })

  const activePasses = mockStore.userPasses.filter(
    (entry) => entry.status === "ACTIVE"
  ).length
  const expiredPasses = mockStore.userPasses.length - activePasses

  const roleCountMap = new Map<
    "COMMUTER" | "VALIDATOR" | "ADMIN" | "SUPER_ADMIN",
    number
  >([
    ["COMMUTER", 0],
    ["VALIDATOR", 0],
    ["ADMIN", 0],
    ["SUPER_ADMIN", 0],
  ])
  mockStore.users.forEach((user) => {
    const currentCount = roleCountMap.get(user.role) ?? 0
    roleCountMap.set(user.role, currentCount + 1)
  })

  const activityTrend = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(new Date(), 6 - index).toISOString().slice(0, 10)
    return {
      date: day,
      passesSold: mockStore.userPasses.filter(
        (pass) => pass.purchaseDate.slice(0, 10) === day
      ).length,
      validations: mockStore.trips.filter(
        (trip) => trip.validatedAt.slice(0, 10) === day
      ).length,
    }
  })

  const stats = dashboardStatsSchema.parse({
    passesSold,
    validationsByMode: [
      { mode: "BUS", count: modeCounts.BUS },
      { mode: "METRO", count: modeCounts.METRO },
      { mode: "FERRY", count: modeCounts.FERRY },
    ],
    activePasses,
    expiredPasses,
    totalUsers: mockStore.users.length,
    usersByRole: Array.from(roleCountMap.entries()).map(([role, count]) => ({
      role,
      count,
    })),
    activityTrend,
  })

  return mockDelay(stats)
}

export async function getAdminPassTypes(): Promise<AdminPassTypesResponse> {
  if (!appEnv.useMockApi) {
    return apiClient.get<AdminPassTypesResponse>("/api/admin/pass-types", {
      schema: adminPassTypesResponseSchema,
    })
  }

  requireAdmin()

  const response = adminPassTypesResponseSchema.parse({
    passTypes: [...mockStore.passTypes].sort(
      (left, right) => left.validityDays - right.validityDays
    ),
  })

  return mockDelay(response)
}

export async function createAdminPassType(
  input: UpsertPassTypeInput
): Promise<PassTypeMutationResponse> {
  const payload = upsertPassTypeInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<PassTypeMutationResponse, UpsertPassTypeInput>(
      "/api/admin/pass-types",
      payload,
      { schema: passTypeMutationResponseSchema }
    )
  }

  requireAdmin()

  const passType = {
    id: createId("ptype"),
    ...payload,
  }

  mockStore.passTypes.push(passType)

  const response = passTypeMutationResponseSchema.parse({ passType })
  return mockDelay(response)
}

export async function updateAdminPassType(
  passTypeId: string,
  input: UpsertPassTypeInput
): Promise<PassTypeMutationResponse> {
  const payload = upsertPassTypeInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.put<PassTypeMutationResponse, UpsertPassTypeInput>(
      `/api/admin/pass-types/${passTypeId}`,
      payload,
      { schema: passTypeMutationResponseSchema }
    )
  }

  requireAdmin()

  const passTypeIndex = mockStore.passTypes.findIndex(
    (entry) => entry.id === passTypeId
  )
  if (passTypeIndex < 0) {
    throw new ApiError("Pass type not found.", 404)
  }

  mockStore.passTypes[passTypeIndex] = {
    ...mockStore.passTypes[passTypeIndex],
    ...payload,
  }

  const response = passTypeMutationResponseSchema.parse({
    passType: mockStore.passTypes[passTypeIndex],
  })

  return mockDelay(response)
}

export async function deleteAdminPassType(passTypeId: string): Promise<void> {
  if (!appEnv.useMockApi) {
    await apiClient.delete<unknown>(`/api/admin/pass-types/${passTypeId}`)
    return
  }

  requireAdmin()

  const usedByPass = mockStore.userPasses.some(
    (entry) => entry.passTypeId === passTypeId
  )
  if (usedByPass) {
    throw new ApiError(
      "This pass type is already used by purchased passes and cannot be deleted.",
      409
    )
  }

  const index = mockStore.passTypes.findIndex((entry) => entry.id === passTypeId)
  if (index < 0) {
    throw new ApiError("Pass type not found.", 404)
  }

  mockStore.passTypes.splice(index, 1)
  await mockDelay(undefined)
}
