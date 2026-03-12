"use client"

import { Clock3Icon, QrCodeIcon, TicketIcon } from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useMyPassesQuery } from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/formatters"
import type { UserPass } from "@/types/pass"

function UserPassCard({ pass }: { pass: UserPass }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{pass.passTypeName}</CardTitle>
          <Badge variant={pass.status === "ACTIVE" ? "default" : "secondary"}>
            {pass.status}
          </Badge>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <QrCodeIcon className="size-3.5" />
          {pass.passCode}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="flex items-center gap-1 text-muted-foreground">
          <Clock3Icon className="size-3.5" />
          Valid till {formatDate(pass.expiryDate)}
        </p>
        <div className="flex flex-wrap gap-1">
          {pass.transportModes.map((mode) => (
            <Badge key={mode} variant="outline">
              {TRANSPORT_MODE_LABELS[mode]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyPassesPage() {
  const myPassesQuery = useMyPassesQuery(true)

  if (myPassesQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  const passes = myPassesQuery.data?.passes ?? []
  const activePasses = passes.filter((entry) => entry.status === "ACTIVE")
  const expiredPasses = passes.filter((entry) => entry.status === "EXPIRED")

  return (
    <ProtectedRoute allowedRoles={["COMMUTER"]}>
      <div className="space-y-5">
        <PageHeader
          title="My Passes"
          description="View active and expired transit passes."
        />

        {passes.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No passes purchased</EmptyTitle>
              <EmptyDescription>
                Buy your first pass from the pass catalog to start travelling.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {activePasses.length > 0 ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <TicketIcon className="size-4" />
              Active Passes
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activePasses.map((pass) => (
                <UserPassCard key={pass.id} pass={pass} />
              ))}
            </div>
          </section>
        ) : null}

        {expiredPasses.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Expired Passes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {expiredPasses.map((pass) => (
                <UserPassCard key={pass.id} pass={pass} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}

