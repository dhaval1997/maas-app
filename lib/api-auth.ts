import { addDays } from "date-fns"

import { ApiHttpError } from "@/lib/api-response"
import { createId, dbQuery, dbQueryOne } from "@/lib/db"
import { generateAuthToken, getBearerToken } from "@/lib/server-auth"
import type { User, UserRole } from "@/types/auth"

type DbRole = "COMMUTER" | "VALIDATOR" | "ADMIN"

type UserRow = {
  id: string
  name: string
  mobile: string
  email: string
  password_hash: string
  role: DbRole
  is_super_admin: boolean
  created_at: string
}

export type AuthenticatedUser = Omit<UserRow, "role" | "password_hash"> & {
  role: UserRole
}

function resolveRole(row: Pick<UserRow, "role" | "is_super_admin">): UserRole {
  if (row.role === "ADMIN" && row.is_super_admin) {
    return "SUPER_ADMIN"
  }

  return row.role
}

export function mapUserRow(
  row: Pick<
    UserRow,
    | "id"
    | "name"
    | "mobile"
    | "email"
    | "role"
    | "is_super_admin"
    | "created_at"
  >
): User {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    role: resolveRole(row),
    createdAt:
      // @ts-expect-error - Type mismatch between string and Date, but we want to ensure it's always a string
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
  }
}
export async function clearExpiredSessions() {
  await dbQuery("DELETE FROM sessions WHERE expires_at <= NOW()")
}

export async function createSession(userId: string) {
  await clearExpiredSessions()
  const token = generateAuthToken()
  const expiresAt = addDays(new Date(), 7).toISOString()

  await dbQuery(
    `INSERT INTO sessions (token, user_id, expires_at, created_at)
     VALUES ($1, $2, $3::timestamptz, NOW())`,
    [token, userId, expiresAt]
  )

  return token
}

export async function getUserByEmail(email: string) {
  const row = await dbQueryOne<UserRow>(
    `SELECT
      id,
      name,
      mobile,
      email,
      password_hash,
      role,
      is_super_admin,
      created_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  )

  return row ?? null
}

export async function getUserByToken(token: string) {
  await clearExpiredSessions()

  const row = await dbQueryOne<UserRow>(
    `SELECT
      u.id,
      u.name,
      u.mobile,
      u.email,
      u.password_hash,
      u.role,
      u.is_super_admin,
      u.created_at
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  )

  return row ?? null
}

export async function requireUser(request: Request, roles?: UserRole[]) {
  const token = getBearerToken(request)
  if (!token) {
    throw new ApiHttpError("Unauthorized", 401)
  }

  const user = await getUserByToken(token)
  if (!user) {
    throw new ApiHttpError("Session expired or invalid token", 401)
  }

  const resolvedRole = resolveRole(user)
  if (roles && !roles.includes(resolvedRole)) {
    throw new ApiHttpError("Forbidden", 403)
  }

  return {
    ...user,
    role: resolvedRole,
  } as AuthenticatedUser
}

export async function createUser(input: {
  name: string
  email: string
  mobile: string
  passwordHash: string
  role: UserRole
}) {
  const id = createId("user")

  const dbRole: DbRole = input.role === "SUPER_ADMIN" ? "ADMIN" : input.role
  const isSuperAdmin = input.role === "SUPER_ADMIN"

  await dbQuery(
    `INSERT INTO users (
      id,
      name,
      mobile,
      email,
      password_hash,
      role,
      is_super_admin,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      id,
      input.name,
      input.mobile,
      input.email.toLowerCase(),
      input.passwordHash,
      dbRole,
      isSuperAdmin,
    ]
  )

  return {
    id,
    name: input.name,
    mobile: input.mobile,
    email: input.email.toLowerCase(),
    role: dbRole,
    is_super_admin: isSuperAdmin,
    created_at: new Date().toISOString(),
  }
}
