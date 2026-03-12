import { addDays } from "date-fns"
import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { mapPassTypeRow, mapUserPassRow, type PassTypeRow, type UserPassRow } from "@/lib/api-mappers"
import { ApiHttpError, handleApiError } from "@/lib/api-response"
import {
  createId,
  createPassCode,
  dbQuery,
  dbQueryOne,
  ensureDatabase,
  syncExpiredPasses,
} from "@/lib/db"
import { purchasePassInputSchema } from "@/schemas/pass"

export const runtime = "nodejs"

async function createUniquePassCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createPassCode()
    const existing = await dbQueryOne<{ id: string }>(
      "SELECT id FROM user_passes WHERE pass_code = $1",
      [code]
    )

    if (!existing) {
      return code
    }
  }

  throw new ApiHttpError("Unable to generate unique pass code.", 500)
}

export async function POST(request: Request) {
  try {
    await ensureDatabase()
    const user = await requireUser(request, ["COMMUTER"])
    const payload = purchasePassInputSchema.parse(await request.json())

    await syncExpiredPasses()

    const passTypeRow = await dbQueryOne<PassTypeRow>(
      `SELECT id, name, validity_days, price, transport_modes, max_trips_per_day
       FROM pass_types
       WHERE id = $1`,
      [payload.passTypeId]
    )

    if (!passTypeRow) {
      throw new ApiHttpError("Selected pass type was not found.", 404)
    }

    const passType = mapPassTypeRow(passTypeRow)
    const now = new Date()
    const purchaseDate = now.toISOString()
    const expiryDate = addDays(now, passType.validityDays).toISOString()
    const passId = createId("upass")
    const passCode = await createUniquePassCode()

    await dbQuery(
      `INSERT INTO user_passes (
        id,
        user_id,
        pass_type_id,
        pass_code,
        purchase_date,
        expiry_date,
        status
      ) VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, 'ACTIVE')`,
      [passId, user.id, passType.id, passCode, purchaseDate, expiryDate]
    )

    const userPassRow = await dbQueryOne<UserPassRow>(
      `SELECT
        up.id,
        up.user_id,
        up.pass_type_id,
        up.pass_code,
        up.purchase_date,
        up.expiry_date,
        up.status,
        pt.name AS pass_type_name,
        pt.transport_modes,
        pt.max_trips_per_day
      FROM user_passes up
      INNER JOIN pass_types pt ON pt.id = up.pass_type_id
      WHERE up.id = $1`,
      [passId]
    )

    if (!userPassRow) {
      throw new ApiHttpError("Failed to create pass.", 500)
    }

    return NextResponse.json({
      pass: mapUserPassRow(userPassRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
