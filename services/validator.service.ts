import { appEnv } from "@/lib/env"
import { getStoredAuthToken } from "@/services/auth-token"
import { ApiError, apiClient } from "@/services/api-client"
import {
  createId,
  getCurrentMockUser,
  mockDelay,
  mockStore,
  syncPassStatuses,
} from "@/services/mock-store"
import {
  validatePassInputSchema,
  validatePassResultSchema,
} from "@/schemas/validator"
import type { ValidatePassInput, ValidatePassResult } from "@/types/validator"

const FIVE_MINUTES = 5 * 60 * 1000

function requireValidatorUser() {
  const token = getStoredAuthToken()
  const user = getCurrentMockUser(token)

  if (!user) {
    throw new ApiError("Please login to continue.", 401)
  }

  if (
    user.role !== "VALIDATOR" &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN"
  ) {
    throw new ApiError("Only validators can validate a pass.", 403)
  }

  return user
}

function buildInvalidValidation(reason: string): ValidatePassResult {
  return {
    isValid: false,
    reason,
    validatedAt: new Date().toISOString(),
  }
}

export async function validatePass(
  input: ValidatePassInput
): Promise<ValidatePassResult> {
  const payload = validatePassInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<ValidatePassResult, ValidatePassInput>(
      "/api/validate",
      payload,
      { schema: validatePassResultSchema }
    )
  }

  const validator = requireValidatorUser()
  syncPassStatuses()

  const passCode = payload.passCode.trim().toUpperCase()
  const userPass = mockStore.userPasses.find((entry) => entry.passCode === passCode)

  if (!userPass) {
    return mockDelay(validatePassResultSchema.parse(buildInvalidValidation("Pass not found.")))
  }

  if (userPass.status === "EXPIRED") {
    return mockDelay(validatePassResultSchema.parse(buildInvalidValidation("Pass expired.")))
  }

  if (!userPass.transportModes.includes(payload.transportMode)) {
    return mockDelay(
      validatePassResultSchema.parse(
        buildInvalidValidation("Transport mode not covered by this pass.")
      )
    )
  }

  const sameDayTrips = mockStore.trips.filter((trip) => {
    if (trip.userPassId !== userPass.id) {
      return false
    }

    const validated = new Date(trip.validatedAt)
    const now = new Date()

    return (
      validated.getFullYear() === now.getFullYear() &&
      validated.getMonth() === now.getMonth() &&
      validated.getDate() === now.getDate()
    )
  })

  if (
    userPass.maxTripsPerDay !== null &&
    sameDayTrips.length >= userPass.maxTripsPerDay
  ) {
    return mockDelay(
      validatePassResultSchema.parse(buildInvalidValidation("Daily trip limit reached."))
    )
  }

  const lastValidation = mockStore.trips
    .filter((trip) => trip.userPassId === userPass.id)
    .sort(
      (left, right) =>
        new Date(right.validatedAt).getTime() - new Date(left.validatedAt).getTime()
    )[0]

  if (
    lastValidation &&
    Date.now() - new Date(lastValidation.validatedAt).getTime() < FIVE_MINUTES
  ) {
    return mockDelay(
      validatePassResultSchema.parse(
        buildInvalidValidation("Please wait before next validation.")
      )
    )
  }

  const tripId = createId("trip")
  const trip = {
    id: tripId,
    userPassId: userPass.id,
    passCode: userPass.passCode,
    validatedBy: validator.name,
    transportMode: payload.transportMode,
    routeInfo: payload.routeInfo?.trim() || null,
    validatedAt: new Date().toISOString(),
  }

  mockStore.trips.push(trip)

  const result = validatePassResultSchema.parse({
    isValid: true,
    reason: "Pass validated successfully.",
    validatedAt: trip.validatedAt,
    tripId,
  })

  return mockDelay(result)
}
