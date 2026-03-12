import { NextResponse } from "next/server"

import {
  createUser,
  getUserByEmail,
  mapUserRow,
  requireUser,
} from "@/lib/api-auth"
import { ApiHttpError, handleApiError } from "@/lib/api-response"
import { dbQuery, dbQueryOne, ensureDatabase } from "@/lib/db"
import {
  createManagedUserInputSchema,
  usersResponseSchema,
} from "@/schemas/user-management"
import { hashPassword } from "@/lib/server-auth"
import type { UserRole } from "@/types/auth"

export const runtime = "nodejs"

const ADMIN_CREATABLE_ROLES: UserRole[] = ["VALIDATOR"]
const SUPER_ADMIN_CREATABLE_ROLES: UserRole[] = ["VALIDATOR", "ADMIN"]

function getCreatableRoles(requesterRole: UserRole) {
  console.log("Requester Role:", requesterRole)

  if (requesterRole === "SUPER_ADMIN") {
    console.log(
      "SUPER_ADMIN detected → allowed roles:",
      SUPER_ADMIN_CREATABLE_ROLES
    )
    return SUPER_ADMIN_CREATABLE_ROLES
  }

  console.log("ADMIN detected → allowed roles:", ADMIN_CREATABLE_ROLES)
  return ADMIN_CREATABLE_ROLES
}

export async function GET(request: Request) {
  console.log("GET /api/users called")

  try {
    console.log("Ensuring database...")
    await ensureDatabase()

    console.log("Authenticating user...")
    const requester = await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    console.log("Requester authenticated:", requester)

    console.log("Fetching users from DB...")

    const rows = await dbQuery<{
      id: string
      name: string
      mobile: string
      email: string
      role: "COMMUTER" | "VALIDATOR" | "ADMIN"
      is_super_admin: boolean
      created_at: string
    }>(
      `SELECT
        id,
        name,
        mobile,
        email,
        role,
        is_super_admin,
        created_at
       FROM users
       ORDER BY created_at DESC`
    )

    console.log("Users fetched from DB:", rows.length)

    const response = usersResponseSchema.parse({
      users: rows.map((row) => mapUserRow(row)),
    })

    console.log("Returning users response")

    return NextResponse.json(response)
  } catch (error) {
    console.error("GET /api/users error:", error)
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  console.log("POST /api/users called")

  try {
    console.log("Ensuring database...")
    await ensureDatabase()

    console.log("Authenticating requester...")
    const requester = await requireUser(request, ["ADMIN", "SUPER_ADMIN"])
    console.log("Requester authenticated:", requester)

    console.log("Parsing request body...")
    const payload = createManagedUserInputSchema.parse(await request.json())
    console.log("Payload received:", payload)

    const allowedRoles = getCreatableRoles(requester.role)
    console.log("Allowed roles for requester:", allowedRoles)

    if (!allowedRoles.includes(payload.role)) {
      console.log("Role creation not allowed:", payload.role)
      throw new ApiHttpError("You are not allowed to create this role.", 403)
    }

    console.log("Checking existing email:", payload.email)
    const existingEmail = await getUserByEmail(payload.email)

    if (existingEmail) {
      console.log("Email already exists:", payload.email)
      throw new ApiHttpError("An account with this email already exists.", 409)
    }

    console.log("Checking existing mobile:", payload.mobile)
    const existingMobile = await dbQueryOne<{ id: string }>(
      "SELECT id FROM users WHERE mobile = $1",
      [payload.mobile]
    )

    if (existingMobile) {
      console.log("Mobile already exists:", payload.mobile)
      throw new ApiHttpError("An account with this mobile already exists.", 409)
    }

    console.log("Hashing password...")
    const passwordHash = hashPassword(payload.password)

    console.log("Creating user in DB...")
    const userRow = await createUser({
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      passwordHash,
      role: payload.role,
    })

    console.log("User created successfully:", userRow)

    return NextResponse.json({
      user: mapUserRow(userRow),
    })
  } catch (error) {
    console.error("POST /api/users error:", error)
    return handleApiError(error)
  }
}
