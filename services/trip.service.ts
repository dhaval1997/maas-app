import { appEnv } from "@/lib/env"
import { tripHistoryFiltersSchema, tripHistoryResponseSchema } from "@/schemas/trip"
import { getStoredAuthToken } from "@/services/auth-token"
import { ApiError, apiClient } from "@/services/api-client"
import {
  getCurrentMockUser,
  mockDelay,
  mockStore,
} from "@/services/mock-store"
import type { TripHistoryFilters, TripHistoryResponse } from "@/types/trip"

function requireMockUserToken() {
  const token = getStoredAuthToken()
  const user = getCurrentMockUser(token)

  if (!user) {
    throw new ApiError("Please login to continue.", 401)
  }

  return user
}

export async function getTripHistory(
  filters: TripHistoryFilters
): Promise<TripHistoryResponse> {
  const parsedFilters = tripHistoryFiltersSchema.parse(filters)

  if (!appEnv.useMockApi) {
    return apiClient.get<TripHistoryResponse>("/api/trips/history", {
      query: parsedFilters,
      schema: tripHistoryResponseSchema,
    })
  }

  const user = requireMockUserToken()
  const userPassIds = new Set(
    mockStore.userPasses
      .filter((entry) => entry.userId === user.id)
      .map((entry) => entry.id)
  )

  const fromTimestamp = parsedFilters.fromDate
    ? new Date(parsedFilters.fromDate).getTime()
    : null
  const toTimestamp = parsedFilters.toDate
    ? new Date(`${parsedFilters.toDate}T23:59:59.999`).getTime()
    : null

  const filteredTrips = mockStore.trips
    .filter((trip) => userPassIds.has(trip.userPassId))
    .filter((trip) => {
      const tripTimestamp = new Date(trip.validatedAt).getTime()

      if (fromTimestamp && tripTimestamp < fromTimestamp) {
        return false
      }

      if (toTimestamp && tripTimestamp > toTimestamp) {
        return false
      }

      if (
        parsedFilters.transportMode &&
        parsedFilters.transportMode !== "ALL" &&
        trip.transportMode !== parsedFilters.transportMode
      ) {
        return false
      }

      return true
    })
    .sort(
      (left, right) =>
        new Date(right.validatedAt).getTime() - new Date(left.validatedAt).getTime()
    )

  const response = tripHistoryResponseSchema.parse({
    trips: filteredTrips,
  })

  return mockDelay(response)
}

