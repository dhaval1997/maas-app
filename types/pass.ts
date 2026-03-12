export type TransportModeCode = "BUS" | "METRO" | "FERRY"

export interface PassType {
  id: string
  name: string
  validityDays: number
  price: number
  transportModes: TransportModeCode[]
  maxTripsPerDay: number | null
}

export type UserPassStatus = "ACTIVE" | "EXPIRED"

export interface UserPass {
  id: string
  userId: string
  passTypeId: string
  passTypeName: string
  passCode: string
  purchaseDate: string
  expiryDate: string
  status: UserPassStatus
  transportModes: TransportModeCode[]
  maxTripsPerDay: number | null
}

export interface PurchasePassInput {
  passTypeId: string
}

export interface PassTypesResponse {
  passTypes: PassType[]
}

export interface PurchasePassResponse {
  pass: UserPass
}

export interface MyPassesResponse {
  passes: UserPass[]
}

