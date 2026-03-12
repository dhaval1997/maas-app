import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-response"
import {
  createId,
  dbQuery,
  dbQueryOne,
  ensureDatabase,
  parseTransportModes,
  syncExpiredPasses,
} from "@/lib/db"
import { validatePassInputSchema } from "@/schemas/validator"

export const runtime = "nodejs"

const FIVE_MINUTES_MS = 5 * 60 * 1000

function invalidResult(reason: string) {
  return {
    isValid: false,
    reason,
    validatedAt: new Date().toISOString(),
  }
}

type PassLookupRow = {
  id: string
  status: "ACTIVE" | "EXPIRED"
  expiry_date: string
  transport_modes: unknown
  max_trips_per_day: number | null
}

export async function POST(request: Request) {
  try {
    await ensureDatabase()
    const validator = await requireUser(request, [
      "VALIDATOR",
      "ADMIN",
      "SUPER_ADMIN",
    ])
    const payload = validatePassInputSchema.parse(await request.json())

    await syncExpiredPasses()

    const passCode = payload.passCode.trim().toUpperCase()
    const pass = await dbQueryOne<PassLookupRow>(
      `SELECT
        up.id,
        up.status,
        up.expiry_date,
        pt.transport_modes,
        pt.max_trips_per_day
      FROM user_passes up
      INNER JOIN pass_types pt ON pt.id = up.pass_type_id
      WHERE up.pass_code = $1`,
      [passCode]
    )

    if (!pass) {
      return NextResponse.json(invalidResult("Pass not found."))
    }

    const now = new Date()
    const expiryDate = new Date(pass.expiry_date)
    if (pass.status === "EXPIRED" || expiryDate.getTime() <= now.getTime()) {
      await dbQuery("UPDATE user_passes SET status = 'EXPIRED' WHERE id = $1", [
        pass.id,
      ])
      return NextResponse.json(invalidResult("Pass expired."))
    }

    const transportModes = parseTransportModes(pass.transport_modes)
    if (!transportModes.includes(payload.transportMode)) {
      return NextResponse.json(
        invalidResult("Transport mode not covered by this pass.")
      )
    }

    if (pass.max_trips_per_day !== null) {
      const tripCountRow = await dbQueryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM trips
         WHERE user_pass_id = $1
           AND DATE(validated_at) = DATE($2::timestamptz)`,
        [pass.id, now.toISOString()]
      )
      const tripCount = Number(tripCountRow?.count ?? 0)

      if (tripCount >= pass.max_trips_per_day) {
        return NextResponse.json(invalidResult("Daily trip limit reached."))
      }
    }

    const lastTrip = await dbQueryOne<{ validated_at: string }>(
      `SELECT validated_at
       FROM trips
       WHERE user_pass_id = $1
       ORDER BY validated_at DESC
       LIMIT 1`,
      [pass.id]
    )

    if (lastTrip) {
      const lastValidatedAt = new Date(lastTrip.validated_at).getTime()
      if (now.getTime() - lastValidatedAt < FIVE_MINUTES_MS) {
        return NextResponse.json(invalidResult("Please wait before next validation."))
      }
    }

    const tripId = createId("trip")
    const validatedAt = now.toISOString()

    await dbQuery(
      `INSERT INTO trips (
        id,
        user_pass_id,
        validated_by,
        transport_mode,
        route_info,
        validated_at
      ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz)`,
      [
        tripId,
        pass.id,
        validator.id,
        payload.transportMode,
        payload.routeInfo?.trim() || null,
        validatedAt,
      ]
    )

    return NextResponse.json({
      isValid: true,
      reason: "Pass validated successfully.",
      validatedAt,
      tripId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
