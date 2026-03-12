import type { TransportModeCode } from "@/types/pass"

export interface ValidatePassInput {
  passCode: string
  transportMode: TransportModeCode
  routeInfo?: string
}

export interface ValidatePassResult {
  isValid: boolean
  reason: string
  validatedAt: string
  tripId?: string
}

