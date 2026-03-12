"use client"

import * as React from "react"
import { PlusIcon, ShieldIcon } from "lucide-react"
import { toast } from "sonner"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import {
  useCreateManagedUserMutation,
  useUsersQuery,
} from "@/hooks/use-maas-api"
import { USER_ROLE_LABELS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/errors"
import { formatDateTime } from "@/lib/formatters"
import type { CreateManagedUserInput } from "@/types/user-management"

const defaultFormValues: CreateManagedUserInput = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  role: "VALIDATOR",
}

export default function UsersPage() {
  const { user } = useAuth()
  const usersQuery = useUsersQuery(
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
  )
  const createUserMutation = useCreateManagedUserMutation()

  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [formValues, setFormValues] =
    React.useState<CreateManagedUserInput>(defaultFormValues)

  const creatableRoles = React.useMemo<
    Array<CreateManagedUserInput["role"]>
  >(() => {
    if (user?.role === "SUPER_ADMIN") {
      return ["VALIDATOR", "ADMIN"]
    }

    return ["VALIDATOR"]
  }, [user?.role])

  React.useEffect(() => {
    if (!creatableRoles.includes(formValues.role)) {
      setFormValues((prev) => ({ ...prev, role: creatableRoles[0] }))
    }
  }, [creatableRoles, formValues.role])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    createUserMutation.mutate(formValues, {
      onSuccess: () => {
        toast.success("User created successfully.")
        setDialogOpen(false)
        setFormValues(defaultFormValues)
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
          title="User Management"
          description="Admin can create validators. Super admin can create admins and validators."
          actions={
            <Button
              onClick={() => {
                setFormValues((prev) => ({
                  ...prev,
                  role: creatableRoles[0],
                }))
                setDialogOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              Add User
            </Button>
          }
        />

        {usersQuery.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : null}

        {!usersQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data?.users.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.mobile}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.role === "SUPER_ADMIN"
                              ? "default"
                              : item.role === "ADMIN"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          <ShieldIcon className="size-3.5" />
                          {USER_ROLE_LABELS[item.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Managed User</DialogTitle>
              <DialogDescription>
                Add internal users according to your role permissions.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
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
                    setFormValues((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
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
                    setFormValues((prev) => ({
                      ...prev,
                      mobile: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Temporary Password</Label>
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
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formValues.role}
                  onValueChange={(value: CreateManagedUserInput["role"]) =>
                    setFormValues((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {USER_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Creating
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
