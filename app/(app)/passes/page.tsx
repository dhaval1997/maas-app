"use client"

import * as React from "react"
import { CheckIcon, TicketIcon } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import {
  usePassTypesQuery,
  usePurchasePassMutation,
} from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/errors"
import { formatCurrency } from "@/lib/formatters"
import type { PassType } from "@/types/pass"

export default function PassesPage() {
  const { user } = useAuth()
  const passTypesQuery = usePassTypesQuery(true)
  const purchaseMutation = usePurchasePassMutation()

  const [selectedPass, setSelectedPass] = React.useState<PassType | null>(null)

  const canPurchase = user?.role === "COMMUTER"

  const handlePurchase = () => {
    if (!selectedPass) {
      return
    }

    purchaseMutation.mutate(
      { passTypeId: selectedPass.id },
      {
        onSuccess: ({ pass }) => {
          toast.success(`Pass purchased successfully: ${pass.passCode}`)
          setSelectedPass(null)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error))
        },
      }
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pass Catalog"
        description="Browse available pass types and simulate purchase flow."
      />

      {passTypesQuery.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : null}

      {!passTypesQuery.isLoading &&
      passTypesQuery.data?.passTypes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No pass types available</EmptyTitle>
            <EmptyDescription>
              Admin can configure pass types from the management module.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {passTypesQuery.data?.passTypes.map((passType) => (
          <Card key={passType.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{passType.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="text-2xl font-semibold tracking-tight">
                {formatCurrency(passType.price)}
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p>Validity: {passType.validityDays} day(s)</p>
                <p>
                  Max trips/day:{" "}
                  {passType.maxTripsPerDay === null
                    ? "Unlimited"
                    : passType.maxTripsPerDay}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {passType.transportModes.map((mode) => (
                  <Badge key={mode} variant="outline">
                    {TRANSPORT_MODE_LABELS[mode]}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                onClick={() => setSelectedPass(passType)}
                disabled={!canPurchase || purchaseMutation.isPending}
              >
                {purchaseMutation.isPending &&
                selectedPass?.id === passType.id ? (
                  <>
                    <Spinner className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TicketIcon className="size-4" />
                    {canPurchase ? "Purchase Pass" : "Commuter only"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={Boolean(selectedPass)}
        onOpenChange={(open) => !open && setSelectedPass(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPass ? (
                <>
                  Purchase <strong>{selectedPass.name}</strong> for{" "}
                  <strong>{formatCurrency(selectedPass.price)}</strong>?
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchaseMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Purchasing
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
