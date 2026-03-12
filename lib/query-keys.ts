import type { TripHistoryFilters } from "@/types/trip"

export const queryKeys = {
  passTypes: ["passes", "types"] as const,
  myPasses: ["passes", "mine"] as const,
  tripsHistory: (filters: TripHistoryFilters) =>
    ["trips", "history", filters] as const,
  adminDashboard: ["admin", "dashboard"] as const,
  adminPassTypes: ["admin", "pass-types"] as const,
  users: ["users"] as const,
}
