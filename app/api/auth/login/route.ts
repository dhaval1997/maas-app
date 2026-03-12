import { NextResponse } from "next/server"

import { ApiHttpError, handleApiError } from "@/lib/api-response"
import { createSession, getUserByEmail, mapUserRow } from "@/lib/api-auth"
import { ensureDatabase } from "@/lib/db"
import { loginInputSchema } from "@/schemas/auth"
import { verifyPassword } from "@/lib/server-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await ensureDatabase()
    const payload = loginInputSchema.parse(await request.json())

    const userRow = await getUserByEmail(payload.email)
    if (!userRow || !verifyPassword(payload.password, userRow.password_hash)) {
      throw new ApiHttpError("Invalid credentials.", 401)
    }

    const token = await createSession(userRow.id)

    return NextResponse.json({
      token,
      user: mapUserRow(userRow),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
