"use client"

import * as React from "react"

import { AUTH_STORAGE_KEY, AUTH_TOKEN_KEY } from "@/lib/constants"
import { authSessionSchema } from "@/schemas/auth"
import type { AuthSession, User } from "@/types/auth"

interface AuthContextValue {
  session: AuthSession | null
  user: User | null
  token: string | null
  isHydrated: boolean
  isAuthenticated: boolean
  setSession: (session: AuthSession) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = React.useState<AuthSession | null>(null)
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (rawSession) {
        const parsedSession = authSessionSchema.parse(JSON.parse(rawSession))
        setSessionState(parsedSession)
        window.localStorage.setItem(AUTH_TOKEN_KEY, parsedSession.token)
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const setSession = React.useCallback((nextSession: AuthSession) => {
    const parsedSession = authSessionSchema.parse(nextSession)
    setSessionState(parsedSession)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedSession))
    window.localStorage.setItem(AUTH_TOKEN_KEY, parsedSession.token)
  }, [])

  const logout = React.useCallback(() => {
    setSessionState(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.token ?? null,
      isHydrated,
      isAuthenticated: Boolean(session?.token),
      setSession,
      logout,
    }),
    [session, isHydrated, setSession, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.")
  }

  return context
}

