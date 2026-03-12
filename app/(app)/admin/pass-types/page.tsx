"use client"

import * as React from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ProtectedRoute } from "@/components/auth/protected-route"
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
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAdminPassTypesQuery,
  useCreateAdminPassTypeMutation,
  useDeleteAdminPassTypeMutation,
  useUpdateAdminPassTypeMutation,
} from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/errors"
import { formatCurrency } from "@/lib/formatters"
import type { PassType, TransportModeCode } from "@/types/pass"

interface PassTypeFormState {
  name: string
  validityDays: string
  price: string
  maxTripsPerDay: string
  transportModes: TransportModeCode[]
}

const defaultFormState: PassTypeFormState = {
  name: "",
  validityDays: "30",
  price: "0",
  maxTripsPerDay: "",
  transportModes: ["BUS"],
}

export default function AdminPassTypesPage() {
  const passTypesQuery = useAdminPassTypesQuery(true)
  const createMutation = useCreateAdminPassTypeMutation()
  const updateMutation = useUpdateAdminPassTypeMutation()
  const deleteMutation = useDeleteAdminPassTypeMutation()

  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [editingPassType, setEditingPassType] = React.useState<PassType | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<PassType | null>(null)
  const [formState, setFormState] = React.useState<PassTypeFormState>(defaultFormState)

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = () => {
    setEditingPassType(null)
    setFormState(defaultFormState)
    setDialogOpen(true)
  }

  const openEditDialog = (passType: PassType) => {
    setEditingPassType(passType)
    setFormState({
      name: passType.name,
      validityDays: String(passType.validityDays),
      price: String(passType.price),
      maxTripsPerDay:
        passType.maxTripsPerDay === null ? "" : String(passType.maxTripsPerDay),
      transportModes: passType.transportModes,
    })
    setDialogOpen(true)
  }

  const toggleTransportMode = (mode: TransportModeCode) => {
    setFormState((prev) => {
      const hasMode = prev.transportModes.includes(mode)

      if (hasMode) {
        const updatedModes = prev.transportModes.filter((item) => item !== mode)
        return {
          ...prev,
          transportModes: updatedModes.length ? updatedModes : prev.transportModes,
        }
      }

      return {
        ...prev,
        transportModes: [...prev.transportModes, mode],
      }
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      name: formState.name.trim(),
      validityDays: Number(formState.validityDays),
      price: Number(formState.price),
      maxTripsPerDay: formState.maxTripsPerDay
        ? Number(formState.maxTripsPerDay)
        : null,
      transportModes: formState.transportModes,
    }

    if (editingPassType) {
      updateMutation.mutate(
        { passTypeId: editingPassType.id, input: payload },
        {
          onSuccess: () => {
            toast.success("Pass type updated.")
            setDialogOpen(false)
          },
          onError: (error) => {
            toast.error(getErrorMessage(error))
          },
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Pass type created.")
        setDialogOpen(false)
      },
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    })
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-5">
        <PageHeader
          title="Pass Type Management"
          description="Create, update, and delete pass templates for commuters."
          actions={
            <Button onClick={openCreateDialog}>
              <PlusIcon className="size-4" />
              Add Pass Type
            </Button>
          }
        />

        {passTypesQuery.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : null}

        {!passTypesQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Modes</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passTypesQuery.data?.passTypes.map((passType) => (
                    <TableRow key={passType.id}>
                      <TableCell>{passType.name}</TableCell>
                      <TableCell>{passType.validityDays} day(s)</TableCell>
                      <TableCell>{formatCurrency(passType.price)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {passType.transportModes.map((mode) => (
                            <Badge key={mode} variant="outline">
                              {TRANSPORT_MODE_LABELS[mode]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {passType.maxTripsPerDay === null
                          ? "Unlimited"
                          : passType.maxTripsPerDay}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(passType)}
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(passType)}
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPassType ? "Edit Pass Type" : "Create Pass Type"}
              </DialogTitle>
              <DialogDescription>
                Configure validity, pricing, transport coverage, and limits.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="validityDays">Validity Days</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min={1}
                    value={formState.validityDays}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        validityDays: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={formState.price}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, price: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxTripsPerDay">Max Trips/Day (optional)</Label>
                <Input
                  id="maxTripsPerDay"
                  type="number"
                  min={1}
                  value={formState.maxTripsPerDay}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxTripsPerDay: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Transport Modes</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(Object.keys(TRANSPORT_MODE_LABELS) as TransportModeCode[]).map(
                    (mode) => (
                      <label
                        key={mode}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                      >
                        <Checkbox
                          checked={formState.transportModes.includes(mode)}
                          onCheckedChange={() => toggleTransportMode(mode)}
                        />
                        {TRANSPORT_MODE_LABELS[mode]}
                      </label>
                    )
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="size-4" />
                      Saving
                    </>
                  ) : editingPassType ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pass Type</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget ? (
                  <>
                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (!deleteTarget) {
                    return
                  }

                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => {
                      toast.success("Pass type deleted.")
                      setDeleteTarget(null)
                    },
                    onError: (error) => {
                      toast.error(getErrorMessage(error))
                    },
                  })
                }}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Deleting
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
