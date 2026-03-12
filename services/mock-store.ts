import { addDays, subDays, subHours } from "date-fns"

import type { User } from "@/types/auth"
import type { PassType, UserPass } from "@/types/pass"
import type { Trip } from "@/types/trip"

export interface MockUserRecord extends User {
  password: string
}

function createRandomCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let index = 0; index < length; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createPassCode() {
  return `PASS-${createRandomCode(6)}`
}

const seededUsers: MockUserRecord[] = [
  {
    id: "user_super_admin_01",
    name: "System Owner",
    email: "superadmin@test.com",
    mobile: "9990000000",
    password: "password123",
    role: "SUPER_ADMIN",
    createdAt: new Date("2026-02-01T06:00:00.000Z").toISOString(),
  },
  {
    id: "user_commuter_01",
    name: "Riya Patel",
    email: "commuter@test.com",
    mobile: "9990001111",
    password: "password123",
    role: "COMMUTER",
    createdAt: new Date("2026-02-01T08:00:00.000Z").toISOString(),
  },
  {
    id: "user_validator_01",
    name: "Aman Shah",
    email: "validator@test.com",
    mobile: "9990002222",
    password: "password123",
    role: "VALIDATOR",
    createdAt: new Date("2026-02-03T08:00:00.000Z").toISOString(),
  },
  {
    id: "user_admin_01",
    name: "Neha Desai",
    email: "admin@test.com",
    mobile: "9990003333",
    password: "password123",
    role: "ADMIN",
    createdAt: new Date("2026-02-05T08:00:00.000Z").toISOString(),
  },
]

const seededPassTypes: PassType[] = [
  {
    id: "ptype_daily_bus",
    name: "Daily Bus Saver",
    validityDays: 1,
    price: 80,
    transportModes: ["BUS"],
    maxTripsPerDay: 4,
  },
  {
    id: "ptype_weekly_combo",
    name: "Weekly Metro + Bus",
    validityDays: 7,
    price: 350,
    transportModes: ["BUS", "METRO"],
    maxTripsPerDay: 10,
  },
  {
    id: "ptype_monthly_city",
    name: "Monthly City Unlimited",
    validityDays: 30,
    price: 1200,
    transportModes: ["BUS", "METRO", "FERRY"],
    maxTripsPerDay: null,
  },
]

const validatorUser =
  seededUsers.find((user) => user.role === "VALIDATOR") ?? seededUsers[0]

const activePass: UserPass = {
  id: "upass_active_01",
  userId: seededUsers[0].id,
  passTypeId: seededPassTypes[1].id,
  passTypeName: seededPassTypes[1].name,
  passCode: "PASS-WK89QT",
  purchaseDate: subDays(new Date(), 2).toISOString(),
  expiryDate: addDays(new Date(), 5).toISOString(),
  status: "ACTIVE",
  transportModes: seededPassTypes[1].transportModes,
  maxTripsPerDay: seededPassTypes[1].maxTripsPerDay,
}

const expiredPass: UserPass = {
  id: "upass_expired_01",
  userId: seededUsers[0].id,
  passTypeId: seededPassTypes[0].id,
  passTypeName: seededPassTypes[0].name,
  passCode: "PASS-DY44AS",
  purchaseDate: subDays(new Date(), 5).toISOString(),
  expiryDate: subDays(new Date(), 3).toISOString(),
  status: "EXPIRED",
  transportModes: seededPassTypes[0].transportModes,
  maxTripsPerDay: seededPassTypes[0].maxTripsPerDay,
}

const seededTrips: Trip[] = [
  {
    id: "trip_01",
    userPassId: activePass.id,
    passCode: activePass.passCode,
    validatedBy: validatorUser.name,
    transportMode: "METRO",
    routeInfo: "Line-1 Downtown",
    validatedAt: subHours(new Date(), 20).toISOString(),
  },
  {
    id: "trip_02",
    userPassId: activePass.id,
    passCode: activePass.passCode,
    validatedBy: validatorUser.name,
    transportMode: "BUS",
    routeInfo: "Route 102",
    validatedAt: subHours(new Date(), 7).toISOString(),
  },
  {
    id: "trip_03",
    userPassId: expiredPass.id,
    passCode: expiredPass.passCode,
    validatedBy: validatorUser.name,
    transportMode: "BUS",
    routeInfo: "Route 37",
    validatedAt: subDays(new Date(), 4).toISOString(),
  },
]

export const mockStore = {
  users: seededUsers,
  passTypes: seededPassTypes,
  userPasses: [activePass, expiredPass],
  trips: seededTrips,
}

export function syncPassStatuses() {
  const now = Date.now()
  mockStore.userPasses.forEach((userPass) => {
    userPass.status =
      new Date(userPass.expiryDate).getTime() > now ? "ACTIVE" : "EXPIRED"
  })
}

export function toPublicUser(user: MockUserRecord): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    createdAt: user.createdAt,
  }
}

export function buildMockToken(userId: string) {
  return `mock-token-${userId}`
}

export function parseMockToken(token: string | null | undefined) {
  if (!token) {
    return null
  }

  if (!token.startsWith("mock-token-")) {
    return null
  }

  return token.replace("mock-token-", "")
}

export function getCurrentMockUser(token: string | null | undefined) {
  const userId = parseMockToken(token)
  if (!userId) {
    return null
  }

  return mockStore.users.find((user) => user.id === userId) ?? null
}

export function mockDelay<T>(value: T, ms = 300) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms)
  })
}
