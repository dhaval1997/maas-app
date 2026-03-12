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
  WalletIcon,
} from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminDashboardQuery } from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS, USER_ROLE_LABELS } from "@/lib/constants"
import { formatCurrency, formatDateTime } from "@/lib/formatters"

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
  const revenueByUser = stats?.revenueByUser ?? []
  const purchasedPasses = stats?.purchasedPasses ?? []

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="space-y-5">
        <PageHeader
          title="Admin Analytics"
          description="Sales, usage, and user distribution insights."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            icon={WalletIcon}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pass Ownership & Revenue by User</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Top 50 users ranked by total revenue.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Passes Owned</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueByUser.length ? (
                  revenueByUser.map((entry) => (
                    <TableRow key={entry.userId}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.passCount}</TableCell>
                      <TableCell>{formatCurrency(entry.revenue)}</TableCell>
                      <TableCell>
                        {entry.lastPurchaseAt
                          ? formatDateTime(entry.lastPurchaseAt)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No purchases recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchased Passes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Latest 50 purchased passes with expiry details.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Pass Code</TableHead>
                  <TableHead>Pass Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Purchased At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasedPasses.length ? (
                  purchasedPasses.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.passCode}</TableCell>
                      <TableCell>{entry.passTypeName}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.userEmail}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(entry.price)}</TableCell>
                      <TableCell>{formatDateTime(entry.purchaseDate)}</TableCell>
                      <TableCell>{formatDateTime(entry.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.status === "ACTIVE" ? "secondary" : "destructive"}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No passes purchased yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

