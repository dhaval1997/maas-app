import { addDays } from "date-fns"

import { appEnv } from "@/lib/env"
import {
  myPassesResponseSchema,
  passTypesResponseSchema,
  purchasePassInputSchema,
  purchasePassResponseSchema,
} from "@/schemas/pass"
import { getStoredAuthToken } from "@/services/auth-token"
import { ApiError, apiClient } from "@/services/api-client"
import {
  createId,
  createPassCode,
  getCurrentMockUser,
  mockDelay,
  mockStore,
  syncPassStatuses,
} from "@/services/mock-store"
import type {
  MyPassesResponse,
  PassTypesResponse,
  PurchasePassInput,
  PurchasePassResponse,
} from "@/types/pass"

function requireMockUserToken() {
  const token = getStoredAuthToken()
  const user = getCurrentMockUser(token)

  if (!user) {
    throw new ApiError("Please login to continue.", 401)
  }

  return user
}

export async function getPassTypes(): Promise<PassTypesResponse> {
  if (!appEnv.useMockApi) {
    return apiClient.get<PassTypesResponse>("/api/passes/types", {
      schema: passTypesResponseSchema,
    })
  }

  const response = passTypesResponseSchema.parse({
    passTypes: [...mockStore.passTypes].sort((left, right) => left.price - right.price),
  })

  return mockDelay(response)
}

export async function purchasePass(
  input: PurchasePassInput
): Promise<PurchasePassResponse> {
  const payload = purchasePassInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<PurchasePassResponse, PurchasePassInput>(
      "/api/passes/purchase",
      payload,
      { schema: purchasePassResponseSchema }
    )
  }

  const user = requireMockUserToken()
  const passType = mockStore.passTypes.find((entry) => entry.id === payload.passTypeId)

  if (!passType) {
    throw new ApiError("Selected pass type was not found.", 404)
  }

  const purchaseDate = new Date()
  const expiryDate = addDays(purchaseDate, passType.validityDays)

  const userPass = {
    id: createId("upass"),
    userId: user.id,
    passTypeId: passType.id,
    passTypeName: passType.name,
    passCode: createPassCode(),
    purchaseDate: purchaseDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    status: "ACTIVE" as const,
    transportModes: passType.transportModes,
    maxTripsPerDay: passType.maxTripsPerDay,
  }

  mockStore.userPasses.push(userPass)

  const response = purchasePassResponseSchema.parse({
    pass: userPass,
  })

  return mockDelay(response)
}

export async function getMyPasses(): Promise<MyPassesResponse> {
  if (!appEnv.useMockApi) {
    return apiClient.get<MyPassesResponse>("/api/passes/my-passes", {
      schema: myPassesResponseSchema,
    })
  }

  syncPassStatuses()
  const user = requireMockUserToken()

  const passes = mockStore.userPasses
    .filter((entry) => entry.userId === user.id)
    .sort(
      (left, right) =>
        new Date(right.purchaseDate).getTime() - new Date(left.purchaseDate).getTime()
    )

  const response = myPassesResponseSchema.parse({ passes })
  return mockDelay(response)
}

