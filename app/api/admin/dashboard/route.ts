import { subDays } from "date-fns"
import { NextResponse } from "next/server"

import { requireUser } from "@/lib/api-auth"
import { handleApiError } from "@/lib/api-response"
import { dbQuery, dbQueryOne, ensureDatabase, syncExpiredPasses } from "@/lib/db"
import type { UserRole } from "@/types/auth"
import type { TransportModeCode } from "@/types/pass"

export const runtime = "nodejs"

const transportModes: TransportModeCode[] = ["BUS", "METRO", "FERRY"]
const userRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "VALIDATOR", "COMMUTER"]

async function countPassesSince(date: Date) {
  const row = await dbQueryOne<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM user_passes
     WHERE purchase_date >= $1::timestamptz`,
    [date.toISOString()]
  )

  return Number(row?.count ?? 0)
}

export async function GET(request: Request) {
  try {
    await ensureDatabase()
    await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    await syncExpiredPasses()

    const modeRows = await dbQuery<{
      transport_mode: TransportModeCode
      count: string
    }>(
      `SELECT transport_mode, COUNT(*) AS count
       FROM trips
       GROUP BY transport_mode`
    )

    const countsByMode = new Map<TransportModeCode, number>()
    modeRows.forEach((row) =>
      countsByMode.set(row.transport_mode, Number(row.count))
    )

    const activeRow = await dbQueryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM user_passes WHERE status = 'ACTIVE'"
    )
    const expiredRow = await dbQueryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM user_passes WHERE status = 'EXPIRED'"
    )
    const totalUsersRow = await dbQueryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM users"
    )
    const totalRevenueRow = await dbQueryOne<{ revenue: string }>(
      `SELECT COALESCE(SUM(pt.price), 0) AS revenue
       FROM user_passes up
       JOIN pass_types pt ON pt.id = up.pass_type_id`
    )

    const usersByRoleRows = await dbQuery<{
      role: "COMMUTER" | "VALIDATOR" | "ADMIN"
      is_super_admin: boolean
      count: string
    }>(
      `SELECT role, is_super_admin, COUNT(*) AS count
       FROM users
       GROUP BY role, is_super_admin`
    )

    const revenueByUserRows = await dbQuery<{
      user_id: string
      name: string
      email: string
      pass_count: string
      revenue: string
      last_purchase_at: string | null
    }>(
      `SELECT u.id AS user_id,
              u.name,
              u.email,
              COUNT(up.id) AS pass_count,
              COALESCE(SUM(pt.price), 0) AS revenue,
              MAX(up.purchase_date) AS last_purchase_at
       FROM users u
       JOIN user_passes up ON up.user_id = u.id
       JOIN pass_types pt ON pt.id = up.pass_type_id
       GROUP BY u.id, u.name, u.email
       ORDER BY revenue DESC, pass_count DESC, u.name ASC
       LIMIT 50`
    )

    const purchasedPassRows = await dbQuery<{
      id: string
      pass_code: string
      pass_type_name: string
      price: string
      user_name: string
      user_email: string
      purchase_date: string
      expiry_date: string
      status: "ACTIVE" | "EXPIRED"
    }>(
      `SELECT up.id,
              up.pass_code,
              pt.name AS pass_type_name,
              pt.price,
              u.name AS user_name,
              u.email AS user_email,
              up.purchase_date,
              up.expiry_date,
              up.status
       FROM user_passes up
       JOIN pass_types pt ON pt.id = up.pass_type_id
       JOIN users u ON u.id = up.user_id
       ORDER BY up.purchase_date DESC
       LIMIT 50`
    )

    const userRoleCountMap = new Map<UserRole, number>()
    usersByRoleRows.forEach((row) => {
      const resolvedRole: UserRole =
        row.role === "ADMIN" && row.is_super_admin ? "SUPER_ADMIN" : row.role

      const currentCount = userRoleCountMap.get(resolvedRole) ?? 0
      userRoleCountMap.set(resolvedRole, currentCount + Number(row.count))
    })

    const activityTrend = await Promise.all(
      Array.from({ length: 7 }, async (_, index) => {
        const dateKey = subDays(new Date(), 6 - index).toISOString().slice(0, 10)

        const soldRow = await dbQueryOne<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM user_passes
           WHERE DATE(purchase_date) = $1::date`,
          [dateKey]
        )

        const validationRow = await dbQueryOne<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM trips
           WHERE DATE(validated_at) = $1::date`,
          [dateKey]
        )

        return {
          date: dateKey,
          passesSold: Number(soldRow?.count ?? 0),
          validations: Number(validationRow?.count ?? 0),
        }
      })
    )

    return NextResponse.json({
      passesSold: {
        daily: await countPassesSince(subDays(new Date(), 1)),
        weekly: await countPassesSince(subDays(new Date(), 7)),
        monthly: await countPassesSince(subDays(new Date(), 30)),
      },
      validationsByMode: transportModes.map((mode) => ({
        mode,
        count: countsByMode.get(mode) ?? 0,
      })),
      activePasses: Number(activeRow?.count ?? 0),
      expiredPasses: Number(expiredRow?.count ?? 0),
      totalUsers: Number(totalUsersRow?.count ?? 0),
      usersByRole: userRoles.map((role) => ({
        role,
        count: userRoleCountMap.get(role) ?? 0,
      })),
      activityTrend,
      totalRevenue: Number(totalRevenueRow?.revenue ?? 0),
      revenueByUser: revenueByUserRows.map((row) => ({
        userId: row.user_id,
        name: row.name,
        email: row.email,
        passCount: Number(row.pass_count ?? 0),
        revenue: Number(row.revenue ?? 0),
        lastPurchaseAt: row.last_purchase_at
          ? new Date(row.last_purchase_at).toISOString()
          : null,
      })),
      purchasedPasses: purchasedPassRows.map((row) => ({
        id: row.id,
        passCode: row.pass_code,
        passTypeName: row.pass_type_name,
        price: Number(row.price ?? 0),
        userName: row.user_name,
        userEmail: row.user_email,
        purchaseDate: new Date(row.purchase_date).toISOString(),
        expiryDate: new Date(row.expiry_date).toISOString(),
        status: row.status,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

