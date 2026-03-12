"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { getDefaultRouteForRole } from "@/lib/constants"
import { getErrorMessage } from "@/lib/errors"
import { useAuth } from "@/hooks/use-auth"
import { registerUser } from "@/services/auth.service"

export default function RegisterPage() {
  const router = useRouter()
  const { isHydrated, isAuthenticated, user, setSession } = useAuth()

  const [formValues, setFormValues] = React.useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  })

  React.useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user) {
      return
    }

    router.replace(getDefaultRouteForRole(user.role))
  }, [isAuthenticated, isHydrated, router, user])

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (session) => {
      setSession(session)
      toast.success("Account created successfully.")
      router.replace(getDefaultRouteForRole(session.user.role))
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
            <UserPlusIcon className="size-4" />
            Register
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Self-registration is for commuter accounts only.
          </p>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              registerMutation.mutate(formValues)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={formValues.mobile}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, mobile: event.target.value }))
                }
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
                  setFormValues((prev) => ({ ...prev, password: event.target.value }))
                }
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Creating account
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="ml-1 font-medium text-foreground underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
