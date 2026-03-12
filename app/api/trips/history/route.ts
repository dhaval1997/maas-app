import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { mapTripRow, type TripRow } from "@/lib/api-mappers"
import { handleApiError } from "@/lib/api-response"
import { dbQuery, ensureDatabase } from "@/lib/db"
import { tripHistoryFiltersSchema } from "@/schemas/trip"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await ensureDatabase()
    const user = await requireUser(request, ["COMMUTER"])
    const url = new URL(request.url)

    const filters = tripHistoryFiltersSchema.parse({
      fromDate: url.searchParams.get("fromDate") || undefined,
      toDate: url.searchParams.get("toDate") || undefined,
      transportMode: url.searchParams.get("transportMode") || undefined,
    })

    const fromDate = filters.fromDate
      ? new Date(filters.fromDate).toISOString()
      : null
    const toDate = filters.toDate
      ? new Date(`${filters.toDate}T23:59:59.999Z`).toISOString()
      : null
    const transportMode =
      filters.transportMode && filters.transportMode !== "ALL"
        ? filters.transportMode
        : null

    const query = `
      SELECT
        t.id,
        t.user_pass_id,
        up.pass_code,
        validator.name AS validated_by_name,
        t.transport_mode,
        t.route_info,
        t.validated_at
      FROM trips t
      INNER JOIN user_passes up ON up.id = t.user_pass_id
      INNER JOIN users validator ON validator.id = t.validated_by
      WHERE up.user_id = $1
        AND ($2::timestamptz IS NULL OR t.validated_at >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR t.validated_at <= $3::timestamptz)
        AND ($4::text IS NULL OR t.transport_mode = $4)
      ORDER BY t.validated_at DESC
    `

    const rows = await dbQuery<TripRow>(query, [
      user.id,
      fromDate,
      toDate,
      transportMode,
    ])

    return NextResponse.json({
      trips: rows.map(mapTripRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
