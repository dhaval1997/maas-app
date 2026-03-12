import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { mapPassTypeRow, type PassTypeRow } from "@/lib/api-mappers"
import { ApiHttpError, handleApiError } from "@/lib/api-response"
import {
  dbQuery,
  dbQueryOne,
  ensureDatabase,
  stringifyTransportModes,
} from "@/lib/db"
import { upsertPassTypeInputSchema } from "@/schemas/admin"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{
    passTypeId: string
  }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureDatabase()
    await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    const { passTypeId } = await context.params
    const payload = upsertPassTypeInputSchema.parse(await request.json())

    const existing = await dbQueryOne<{ id: string }>(
      "SELECT id FROM pass_types WHERE id = $1",
      [passTypeId]
    )
    if (!existing) {
      throw new ApiHttpError("Pass type not found.", 404)
    }

    await dbQuery(
      `UPDATE pass_types
       SET name = $1,
           validity_days = $2,
           price = $3,
           transport_modes = $4::jsonb,
           max_trips_per_day = $5
       WHERE id = $6`,
      [
        payload.name,
        payload.validityDays,
        payload.price,
        stringifyTransportModes(payload.transportModes),
        payload.maxTripsPerDay,
        passTypeId,
      ]
    )

    const row = await dbQueryOne<PassTypeRow>(
      `SELECT id, name, validity_days, price, transport_modes, max_trips_per_day
       FROM pass_types
       WHERE id = $1`,
      [passTypeId]
    )

    if (!row) {
      throw new ApiHttpError("Pass type not found.", 404)
    }

    return NextResponse.json({
      passType: mapPassTypeRow(row),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await ensureDatabase()
    await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    const { passTypeId } = await context.params

    const existing = await dbQueryOne<{ id: string }>(
      "SELECT id FROM pass_types WHERE id = $1",
      [passTypeId]
    )
    if (!existing) {
      throw new ApiHttpError("Pass type not found.", 404)
    }

    const inUse = await dbQueryOne<{ id: string }>(
      "SELECT id FROM user_passes WHERE pass_type_id = $1 LIMIT 1",
      [passTypeId]
    )
    if (inUse) {
      throw new ApiHttpError(
        "This pass type is already used by purchased passes and cannot be deleted.",
        409
      )
    }

    await dbQuery("DELETE FROM pass_types WHERE id = $1", [passTypeId])

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
