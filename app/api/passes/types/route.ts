import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/api-response"
import { requireUser } from "@/lib/api-auth"
import { mapPassTypeRow, type PassTypeRow } from "@/lib/api-mappers"
import { dbQuery, ensureDatabase } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await ensureDatabase()
    await requireUser(request)

    const rows = await dbQuery<PassTypeRow>(
      `SELECT id, name, validity_days, price, transport_modes, max_trips_per_day
       FROM pass_types
       ORDER BY price ASC`
    )

    return NextResponse.json({
      passTypes: rows.map(mapPassTypeRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
