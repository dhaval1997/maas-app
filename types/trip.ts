import type { TransportModeCode } from "@/types/pass"

export interface Trip {
  id: string
  userPassId: string
  passCode: string
  validatedBy: string
  transportMode: TransportModeCode
  routeInfo: string | null
  validatedAt: string
}

export interface TripHistoryFilters {
  fromDate?: string
  toDate?: string
  transportMode?: TransportModeCode | "ALL"
}

export interface TripHistoryResponse {
  trips: Trip[]
}

