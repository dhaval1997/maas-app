import { NextResponse } from "next/server"

import { ApiHttpError, handleApiError } from "@/lib/api-response"
import { createSession, createUser, getUserByEmail, mapUserRow } from "@/lib/api-auth"
import { dbQueryOne, ensureDatabase } from "@/lib/db"
import { registerInputSchema } from "@/schemas/auth"
import { hashPassword } from "@/lib/server-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await ensureDatabase()
    const payload = registerInputSchema.parse(await request.json())

    const existingEmail = await getUserByEmail(payload.email)
    if (existingEmail) {
      throw new ApiHttpError("An account with this email already exists.", 409)
    }

    const existingMobile = await dbQueryOne<{ id: string }>(
      "SELECT id FROM users WHERE mobile = $1",
      [payload.mobile]
    )
    if (existingMobile) {
      throw new ApiHttpError("An account with this mobile already exists.", 409)
    }

    const userRow = await createUser({
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      passwordHash: hashPassword(payload.password),
      role: "COMMUTER",
    })

    const token = await createSession(userRow.id)

    return NextResponse.json({
      token,
      user: mapUserRow(userRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
