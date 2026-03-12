"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { useTripHistoryQuery } from "@/hooks/use-maas-api"
import { TRANSPORT_MODE_LABELS } from "@/lib/constants"
import { formatDateTime } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import type { TripHistoryFilters } from "@/types/trip"

export default function TripsPage() {
  const [filters, setFilters] = React.useState<TripHistoryFilters>({
    transportMode: "ALL",
  })

  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    filters.fromDate ? parseISO(filters.fromDate) : undefined
  )
  const [toDate, setToDate] = React.useState<Date | undefined>(
    filters.toDate ? parseISO(filters.toDate) : undefined
  )

  React.useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
    }))
  }, [fromDate])

  React.useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
    }))
  }, [toDate])

  const tripHistoryQuery = useTripHistoryQuery(filters, true)

  return (
    <ProtectedRoute allowedRoles={["COMMUTER"]}>
      <div className="space-y-5">
        <PageHeader
          title="Journey History"
          description="Filter and review all validations linked to your passes."
        />

        <Card>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-3">
            {/* From Date Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="fromDate">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fromDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? (
                      format(fromDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="toDate">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="toDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Transport Mode Selector (Shadcn UI Dropdown) */}
            <div className="space-y-1.5">
              <Label htmlFor="mode">Transport Mode</Label>
              <Select
                value={filters.transportMode ?? "ALL"}
                onValueChange={(value: string) =>
                  setFilters((prev) => ({
                    ...prev,
                    transportMode: value as TripHistoryFilters["transportMode"],
                  }))
                }
              >
                <SelectTrigger id="mode" className="w-full">
                  <SelectValue placeholder="Select a mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All modes</SelectItem>
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
          </CardContent>
        </Card>

        {tripHistoryQuery.isLoading ? (
          <div className="flex min-h-[25vh] items-center justify-center">
            <Spinner className="size-5" />
          </div>
        ) : null}

        {!tripHistoryQuery.isLoading &&
        (tripHistoryQuery.data?.trips.length ?? 0) === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No trips found</EmptyTitle>
              <EmptyDescription>
                No validation records match your current filters.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {tripHistoryQuery.data?.trips.length ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Pass Code</TableHead>
                    <TableHead>Validated By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripHistoryQuery.data.trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{formatDateTime(trip.validatedAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TRANSPORT_MODE_LABELS[trip.transportMode]}
                        </Badge>
                      </TableCell>
                      <TableCell>{trip.routeInfo ?? "-"}</TableCell>
                      <TableCell>{trip.passCode}</TableCell>
                      <TableCell>{trip.validatedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
