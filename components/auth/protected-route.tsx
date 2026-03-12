"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import type { UserRole } from "@/types/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isHydrated, isAuthenticated, user } = useAuth()
  const [isAllowed, setIsAllowed] = React.useState(false)

  React.useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated || !user) {
      const nextPath = pathname ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${nextPath}`)
      setIsAllowed(false)
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const fromPath = pathname ? `?from=${encodeURIComponent(pathname)}` : ""
      router.replace(`/unauthorized${fromPath}`)
      setIsAllowed(false)
      return
    }

    setIsAllowed(true)
  }, [allowedRoles, isAuthenticated, isHydrated, pathname, router, user])

  if (!isHydrated || !isAllowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  return <>{children}</>
}
