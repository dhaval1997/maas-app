import { AUTH_TOKEN_KEY } from "@/lib/constants"

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

