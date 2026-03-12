import type { UserRole } from "@/types/auth"
import type { TransportModeCode } from "@/types/pass"

export const AUTH_STORAGE_KEY = "maas_session"
export const AUTH_TOKEN_KEY = "maas_token"

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  COMMUTER: "Commuter",
  VALIDATOR: "Validator",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
}

export const TRANSPORT_MODE_LABELS: Record<TransportModeCode, string> = {
  BUS: "Bus",
  METRO: "Metro",
  FERRY: "Ferry",
}

export const TRANSPORT_MODE_OPTIONS = (
  Object.entries(TRANSPORT_MODE_LABELS) as Array<[TransportModeCode, string]>
).map(([value, label]) => ({ value, label }))

export function getDefaultRouteForRole(role: UserRole) {
  if (role === "VALIDATOR") {
    return "/validator"
  }

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/admin/dashboard"
  }

  return "/dashboard"
}
