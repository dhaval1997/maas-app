import { randomUUID } from "node:crypto"

import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

import { ApiHttpError } from "@/lib/api-response"
import { hashPassword } from "@/lib/server-auth"
import type { TransportModeCode } from "@/types/pass"

type QueryResultRow = Record<string, unknown>

let sqlClient: NeonQueryFunction<false, false> | null = null
let initPromise: Promise<void> | null = null

function getConnectionString() {
  const value =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL

  if (!value) {
    throw new ApiHttpError(
      "Database is not configured. Set DATABASE_URL in environment variables.",
      500
    )
  }

  return value
}

function getSql() {
  if (!sqlClient) {
    sqlClient = neon(getConnectionString())
  }

  return sqlClient
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  query: string,
  params: unknown[] = []
) {
  const rows = await getSql().query(query, params)
  return rows as T[]
}

export async function dbQueryOne<T extends QueryResultRow = QueryResultRow>(
  query: string,
  params: unknown[] = []
) {
  const rows = await dbQuery<T>(query, params)
  return rows[0] ?? null
}

const transportModesSeed: Array<{ id: string; name: string; code: TransportModeCode }> = [
  { id: "tm_bus", name: "Bus", code: "BUS" },
  { id: "tm_metro", name: "Metro", code: "METRO" },
  { id: "tm_ferry", name: "Ferry", code: "FERRY" },
]

const passTypeSeed = [
  {
    id: "ptype_daily_bus",
    name: "Daily Bus Saver",
    validityDays: 1,
    price: 80,
    transportModes: ["BUS"] as TransportModeCode[],
    maxTripsPerDay: 4,
  },
  {
    id: "ptype_weekly_combo",
    name: "Weekly Metro + Bus",
    validityDays: 7,
    price: 350,
    transportModes: ["BUS", "METRO"] as TransportModeCode[],
    maxTripsPerDay: 10,
  },
  {
    id: "ptype_monthly_city",
    name: "Monthly City Unlimited",
    validityDays: 30,
    price: 1200,
    transportModes: ["BUS", "METRO", "FERRY"] as TransportModeCode[],
    maxTripsPerDay: null,
  },
]

const seedUsers = [
  {
    id: "user_super_admin_01",
    name: "System Owner",
    email: "superadmin@test.com",
    mobile: "9990000000",
    role: "ADMIN",
    isSuperAdmin: true,
    password: "password123",
  },
  {
    id: "user_commuter_01",
    name: "Riya Patel",
    email: "commuter@test.com",
    mobile: "9990001111",
    role: "COMMUTER",
    isSuperAdmin: false,
    password: "password123",
  },
  {
    id: "user_validator_01",
    name: "Aman Shah",
    email: "validator@test.com",
    mobile: "9990002222",
    role: "VALIDATOR",
    isSuperAdmin: false,
    password: "password123",
  },
  {
    id: "user_admin_01",
    name: "Neha Desai",
    email: "admin@test.com",
    mobile: "9990003333",
    role: "ADMIN",
    isSuperAdmin: false,
    password: "password123",
  },
]

async function createTables() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('COMMUTER', 'VALIDATOR', 'ADMIN')),
      is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS transport_modes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE CHECK (code IN ('BUS', 'METRO', 'FERRY'))
    );
  `)

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS pass_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      validity_days INTEGER NOT NULL CHECK (validity_days > 0),
      price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
      transport_modes JSONB NOT NULL,
      max_trips_per_day INTEGER
    );
  `)

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS user_passes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pass_type_id TEXT NOT NULL REFERENCES pass_types(id),
      pass_code TEXT NOT NULL UNIQUE,
      purchase_date TIMESTAMPTZ NOT NULL,
      expiry_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED'))
    );
  `)

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      user_pass_id TEXT NOT NULL REFERENCES user_passes(id) ON DELETE CASCADE,
      validated_by TEXT NOT NULL REFERENCES users(id),
      transport_mode TEXT NOT NULL CHECK (transport_mode IN ('BUS', 'METRO', 'FERRY')),
      route_info TEXT,
      validated_at TIMESTAMPTZ NOT NULL
    );
  `)

  await dbQuery(
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);"
  )
  await dbQuery(
    "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);"
  )
  await dbQuery(
    "CREATE INDEX IF NOT EXISTS idx_user_passes_user_id ON user_passes(user_id);"
  )
  await dbQuery(
    "CREATE INDEX IF NOT EXISTS idx_user_passes_expiry_date ON user_passes(expiry_date);"
  )
  await dbQuery(
    "CREATE INDEX IF NOT EXISTS idx_trips_user_pass_validated ON trips(user_pass_id, validated_at);"
  )
}

async function seedDatabase() {
  for (const mode of transportModesSeed) {
    await dbQuery(
      `INSERT INTO transport_modes (id, name, code)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [mode.id, mode.name, mode.code]
    )
  }

  for (const passType of passTypeSeed) {
    await dbQuery(
      `INSERT INTO pass_types (
        id,
        name,
        validity_days,
        price,
        transport_modes,
        max_trips_per_day
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      ON CONFLICT (id) DO NOTHING`,
      [
        passType.id,
        passType.name,
        passType.validityDays,
        passType.price,
        JSON.stringify(passType.transportModes),
        passType.maxTripsPerDay,
      ]
    )
  }

  for (const user of seedUsers) {
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        user.name,
        user.mobile,
        user.email,
        hashPassword(user.password),
        user.role,
        user.isSuperAdmin,
      ]
    )
  }
}

export async function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await createTables()
      await seedDatabase()
    })().catch((error) => {
      initPromise = null
      throw error
    })
  }

  return initPromise
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`
}

export function createPassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "PASS-"

  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
}

export async function syncExpiredPasses() {
  await dbQuery(
    `UPDATE user_passes
     SET status = 'EXPIRED'
     WHERE status = 'ACTIVE' AND expiry_date <= NOW()`
  )
}

export function parseTransportModes(value: unknown): TransportModeCode[] {
  try {
    const parsed =
      typeof value === "string"
        ? (JSON.parse(value) as unknown)
        : (value as unknown)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((mode) =>
      ["BUS", "METRO", "FERRY"].includes(String(mode))
    ) as TransportModeCode[]
  } catch {
    return []
  }
}

export function stringifyTransportModes(modes: TransportModeCode[]) {
  return JSON.stringify(modes)
}
