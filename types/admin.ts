import type { PassType, TransportModeCode } from "@/types/pass"
import type { UserRole } from "@/types/auth"

export interface DashboardStats {
  passesSold: {
    daily: number
    weekly: number
    monthly: number
  }
  validationsByMode: Array<{
    mode: TransportModeCode
    count: number
  }>
  activePasses: number
  expiredPasses: number
  totalUsers: number
  usersByRole: Array<{
    role: UserRole
    count: number
  }>
  activityTrend: Array<{
    date: string
    passesSold: number
    validations: number
  }>
  totalRevenue: number
  revenueByUser: Array<{
    userId: string
    name: string
    email: string
    passCount: number
    revenue: number
    lastPurchaseAt: string | null
  }>
  purchasedPasses: Array<{
    id: string
    passCode: string
    passTypeName: string
    price: number
    userName: string
    userEmail: string
    purchaseDate: string
    expiryDate: string
    status: "ACTIVE" | "EXPIRED"
  }>
}

export interface UpsertPassTypeInput {
  name: string
  validityDays: number
  price: number
  transportModes: TransportModeCode[]
  maxTripsPerDay: number | null
}

export interface PassTypeMutationResponse {
  passType: PassType
}

export interface AdminPassTypesResponse {
  passTypes: PassType[]
}
