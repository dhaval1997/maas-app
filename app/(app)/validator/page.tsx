"use client"

import * as React from "react"
import { CheckCircle2Icon, CircleXIcon, ScanLineIcon } from "lucide-react"
import { toast } from "sonner"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useValidatePassMutation } from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime } from "@/lib/formatters"
import type { TransportModeCode } from "@/types/pass"
import type { ValidatePassResult } from "@/types/validator"

export default function ValidatorPage() {
  const validatePassMutation = useValidatePassMutation()
  const [result, setResult] = React.useState<ValidatePassResult | null>(null)
  const [formValues, setFormValues] = React.useState({
    passCode: "",
    transportMode: "BUS" as TransportModeCode,
    routeInfo: "",
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    validatePassMutation.mutate(formValues, {
      onSuccess: (validationResult) => {
        setResult(validationResult)
        if (validationResult.isValid) {
          toast.success(validationResult.reason)
        } else {
          toast.warning(validationResult.reason)
        }
      },
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    })
  }

  return (
    <ProtectedRoute allowedRoles={["VALIDATOR", "ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-5">
        <PageHeader
          title="Pass Validation Terminal"
          description="Validate pass code against expiry, mode, daily limit, and anti-passback rules."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validate Pass</CardTitle>
            <CardDescription>
              Enter pass details and submit validation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="passCode">Pass Code</Label>
                <Input
                  id="passCode"
                  placeholder="PASS-XXXXXX"
                  value={formValues.passCode}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      passCode: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transportMode">Transport Mode</Label>
                <Select
                  value={formValues.transportMode}
                  onValueChange={(value: TransportModeCode) =>
                    setFormValues((prev) => ({
                      ...prev,
                      transportMode: value,
                    }))
                  }
                >
                  <SelectTrigger id="transportMode" className="w-full">
                    <SelectValue placeholder="Select a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSPORT_MODE_LABELS).map(
                      ([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="routeInfo">Route (optional)</Label>
                <Input
                  id="routeInfo"
                  placeholder="Route / station details"
                  value={formValues.routeInfo}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      routeInfo: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={validatePassMutation.isPending}>
                  {validatePassMutation.isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Validating
                    </>
                  ) : (
                    <>
                      <ScanLineIcon className="size-4" />
                      Validate Pass
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result ? (
          <Card variant={result.isValid ? "success" : "destructive"}>
            <CardHeader>
              <CardTitle className="text-base">Validation Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Badge variant={result.isValid ? "default" : "secondary"}>
                {result.isValid ? (
                  <CheckCircle2Icon className="size-3.5" />
                ) : (
                  <CircleXIcon className="size-3.5" />
                )}
                {result.isValid ? "VALID" : "INVALID"}
              </Badge>
              <p className="text-sm font-medium">{result.reason}</p>
              <p className="text-muted-foreground">
                Timestamp: {formatDateTime(result.validatedAt)}
              </p>
              {result.tripId ? (
                <p className="text-muted-foreground">
                  Trip ID: {result.tripId}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
