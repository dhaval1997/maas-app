import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { mapPassTypeRow, type PassTypeRow } from "@/lib/api-mappers"
import { handleApiError } from "@/lib/api-response"
import {
  createId,
  dbQuery,
  dbQueryOne,
  ensureDatabase,
  stringifyTransportModes,
} from "@/lib/db"
import { upsertPassTypeInputSchema } from "@/schemas/admin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await ensureDatabase()
    await requireUser(request, ["ADMIN", "SUPER_ADMIN"])

    const rows = await dbQuery<PassTypeRow>(
      `SELECT id, name, validity_days, price, transport_modes, max_trips_per_day
       FROM pass_types
       ORDER BY validity_days ASC, price ASC`
    )

    return NextResponse.json({
      passTypes: rows.map(mapPassTypeRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase()
    await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    const payload = upsertPassTypeInputSchema.parse(await request.json())

    const id = createId("ptype")

    await dbQuery(
      `INSERT INTO pass_types (
        id,
        name,
        validity_days,
        price,
        transport_modes,
        max_trips_per_day
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        id,
        payload.name,
        payload.validityDays,
        payload.price,
        stringifyTransportModes(payload.transportModes),
        payload.maxTripsPerDay,
      ]
    )

    const row = await dbQueryOne<PassTypeRow>(
      `SELECT id, name, validity_days, price, transport_modes, max_trips_per_day
       FROM pass_types
       WHERE id = $1`,
      [id]
    )

    if (!row) {
      throw new Error("Failed to create pass type.")
    }

    return NextResponse.json({
      passType: mapPassTypeRow(row),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
