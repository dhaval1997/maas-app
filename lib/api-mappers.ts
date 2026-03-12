import { parseTransportModes } from "@/lib/db"
import type { PassType, UserPass } from "@/types/pass"
import type { Trip } from "@/types/trip"

export type PassTypeRow = {
  id: string
  name: string
  validity_days: number
  price: number | string
  transport_modes: unknown
  max_trips_per_day: number | null
}

export function mapPassTypeRow(row: PassTypeRow): PassType {
  return {
    id: row.id,
    name: row.name,
    validityDays: row.validity_days,
    price: Number(row.price),
    transportModes: parseTransportModes(row.transport_modes),
    maxTripsPerDay: row.max_trips_per_day,
  }
}

export type UserPassRow = {
  id: string
  user_id: string
  pass_type_id: string
  pass_code: string
  purchase_date: string
  expiry_date: string
  status: "ACTIVE" | "EXPIRED"
  pass_type_name: string
  transport_modes: unknown
  max_trips_per_day: number | null
}

export function mapUserPassRow(row: UserPassRow): UserPass {
  return {
    id: row.id,
    userId: row.user_id,
    passTypeId: row.pass_type_id,
    passTypeName: row.pass_type_name,
    passCode: row.pass_code,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    status: row.status,
    transportModes: parseTransportModes(row.transport_modes),
    maxTripsPerDay: row.max_trips_per_day,
  }
}

export type TripRow = {
  id: string
  user_pass_id: string
  pass_code: string
  validated_by_name: string
  transport_mode: "BUS" | "METRO" | "FERRY"
  route_info: string | null
  validated_at: string | Date
}

export function mapTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    userPassId: row.user_pass_id,
    passCode: row.pass_code,
    validatedBy: row.validated_by_name,
    transportMode: row.transport_mode,
    routeInfo: row.route_info,
    validatedAt:
      row.validated_at instanceof Date
        ? row.validated_at.toISOString()
        : row.validated_at,
  }
}
