"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3Icon,
  CheckCircle2Icon,
  ClockIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"
import { useAdminDashboardQuery } from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS, USER_ROLE_LABELS } from "@/lib/constants"

const validationChartConfig = {
  count: {
    label: "Validations",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const activityChartConfig = {
  passesSold: {
    label: "Passes Sold",
    color: "var(--chart-3)",
  },
  validations: {
    label: "Validations",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const roleChartConfig = {
  count: {
    label: "Users",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "var(--chart-5)",
  ADMIN: "var(--chart-4)",
  VALIDATOR: "var(--chart-3)",
  COMMUTER: "var(--chart-2)",
}

export default function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboardQuery(true)

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-5" />
      </div>
    )
  }

  const stats = dashboardQuery.data

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-5">
        <PageHeader
          title="Admin Analytics"
          description="Sales, usage, and user distribution insights."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Passes Sold Today"
            value={stats?.passesSold.daily ?? 0}
            icon={TicketIcon}
          />
          <StatCard
            title="Passes Sold Weekly"
            value={stats?.passesSold.weekly ?? 0}
            icon={ClockIcon}
          />
          <StatCard
            title="Active Passes"
            value={stats?.activePasses ?? 0}
            icon={CheckCircle2Icon}
          />
          <StatCard
            title="Expired Passes"
            value={stats?.expiredPasses ?? 0}
            icon={BarChart3Icon}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={UsersIcon}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validations by Transport Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={validationChartConfig} className="h-72 w-full">
                <BarChart
                  data={(stats?.validationsByMode ?? []).map((entry) => ({
                    mode: TRANSPORT_MODE_LABELS[entry.mode],
                    count: entry.count,
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mode" tickLine={false} tickMargin={8} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={roleChartConfig} className="h-72 w-full">
                <PieChart>
                  <Pie
                    data={(stats?.usersByRole ?? []).map((entry) => ({
                      name: USER_ROLE_LABELS[entry.role],
                      key: entry.role,
                      count: entry.count,
                    }))}
                    dataKey="count"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={55}
                  >
                    {(stats?.usersByRole ?? []).map((entry) => (
                      <Cell key={entry.role} fill={roleColors[entry.role]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7-Day Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityChartConfig} className="h-80 w-full">
              <LineChart
                data={(stats?.activityTrend ?? []).map((entry) => ({
                  ...entry,
                  day: entry.date.slice(5),
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} tickMargin={8} axisLine={false} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="passesSold"
                  stroke="var(--color-passesSold)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="validations"
                  stroke="var(--color-validations)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

