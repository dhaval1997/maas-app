import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { mapUserPassRow, type UserPassRow } from "@/lib/api-mappers"
import { handleApiError } from "@/lib/api-response"
import { dbQuery, ensureDatabase, syncExpiredPasses } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await ensureDatabase()
    const user = await requireUser(request, ["COMMUTER"])
    await syncExpiredPasses()

    const rows = await dbQuery<UserPassRow>(
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
      WHERE up.user_id = $1
      ORDER BY up.purchase_date DESC`,
      [user.id]
    )

    return NextResponse.json({
      passes: rows.map(mapUserPassRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
