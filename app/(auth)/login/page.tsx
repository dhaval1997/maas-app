"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { LogInIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/errors"
import { getDefaultRouteForRole } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import { loginUser } from "@/services/auth.service"

export default function LoginPage() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user, setSession } = useAuth()
  const [nextPath, setNextPath] = React.useState<string | null>(null)

  const [formValues, setFormValues] = React.useState({
    email: "commuter@test.com",
    password: "password123",
  })

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const params = new URLSearchParams(window.location.search)
    setNextPath(params.get("next"))
  }, [])

  React.useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user) {
      return
    }

    router.replace(getDefaultRouteForRole(user.role))
  }, [isAuthenticated, isHydrated, router, user])

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (session) => {
      setSession(session)
      toast.success("Logged in successfully.")

      router.replace(nextPath || getDefaultRouteForRole(session.user.role))
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  if (!isHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LogInIcon className="size-4" />
            Login
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Seeded credentials are available for commuter, validator, and admin.
          </p>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              loginMutation.mutate(formValues)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formValues.password}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Logging in
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
          <p>
            Need an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline"
            >
              Register
            </Link>
          </p>
          <p>
            Seeded users: commuter / validator / admin / superadmin with
            `password123`.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
