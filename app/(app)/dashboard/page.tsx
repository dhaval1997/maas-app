"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  BusIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
  TicketIcon,
} from "lucide-react"

import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import {
  useAdminDashboardQuery,
  useMyPassesQuery,
  useTripHistoryQuery,
} from "@/hooks/use-maas-api"
import { USER_ROLE_LABELS } from "@/lib/constants"

export default function DashboardPage() {
  const { user } = useAuth()

  const isCommuter = user?.role === "COMMUTER"
  const isValidator = user?.role === "VALIDATOR"
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  const myPassesQuery = useMyPassesQuery(isCommuter)
  const tripsQuery = useTripHistoryQuery({ transportMode: "ALL" }, isCommuter)
  const adminStatsQuery = useAdminDashboardQuery(isAdmin)

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  const activePasses = myPassesQuery.data?.passes.filter((entry) => entry.status === "ACTIVE").length ?? 0
  const expiredPasses = myPassesQuery.data?.passes.filter((entry) => entry.status === "EXPIRED").length ?? 0
  const recentTrips = tripsQuery.data?.trips.length ?? 0

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${USER_ROLE_LABELS[user.role]} Dashboard`}
        description="Role-aware summary modules using reusable service hooks and TanStack Query."
      />

      {isCommuter ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Active Passes"
              value={activePasses}
              description="Currently valid passes"
              icon={TicketIcon}
            />
            <StatCard
              title="Expired Passes"
              value={expiredPasses}
              description="Need renewal"
              icon={CheckCircle2Icon}
            />
            <StatCard
              title="Trip Entries"
              value={recentTrips}
              description="Total recorded validations"
              icon={BusIcon}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>
                Purchase passes, track usage, and review your journey history.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/passes">
                  Browse Passes
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-passes">View My Passes</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/trips">Trip History</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}

      {isValidator ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validator Workspace</CardTitle>
            <CardDescription>
              Validate commuter passes and log trip entries in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Validation checks include expiry, transport mode coverage, daily limits, and anti-passback (5 minutes).
            </p>
            <Button asChild>
              <Link href="/validator">
                Open Validator Screen
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Passes Sold Today"
              value={adminStatsQuery.data?.passesSold.daily ?? 0}
              icon={TicketIcon}
            />
            <StatCard
              title="Passes Sold This Week"
              value={adminStatsQuery.data?.passesSold.weekly ?? 0}
              icon={CheckCircle2Icon}
            />
            <StatCard
              title="Active Passes"
              value={adminStatsQuery.data?.activePasses ?? 0}
              icon={ShieldCheckIcon}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Controls</CardTitle>
              <CardDescription>
                Manage pass types and inspect validation analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admin/dashboard">Open Analytics</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/pass-types">Manage Pass Types</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/users">Manage Users</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
