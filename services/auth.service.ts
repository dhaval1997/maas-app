import { ApiError, apiClient } from "@/services/api-client"
import {
  buildMockToken,
  createId,
  mockDelay,
  mockStore,
  toPublicUser,
} from "@/services/mock-store"
import { appEnv } from "@/lib/env"
import {
  authResponseSchema,
  loginInputSchema,
  registerInputSchema,
} from "@/schemas/auth"
import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const payload = loginInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<AuthSession, LoginInput>("/api/auth/login", payload, {
      schema: authResponseSchema,
    })
  }

  const user = mockStore.users.find(
    (entry) =>
      normalizeEmail(entry.email) === normalizeEmail(payload.email) &&
      entry.password === payload.password
  )

  if (!user) {
    throw new ApiError(
      "Invalid credentials. Try commuter@test.com / password123.",
      401
    )
  }

  const session = authResponseSchema.parse({
    token: buildMockToken(user.id),
    user: toPublicUser(user),
  })

  return mockDelay(session)
}

export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const payload = registerInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<AuthSession, RegisterInput>(
      "/api/auth/register",
      payload,
      {
        schema: authResponseSchema,
      }
    )
  }

  const emailExists = mockStore.users.some(
    (entry) => normalizeEmail(entry.email) === normalizeEmail(payload.email)
  )
  if (emailExists) {
    throw new ApiError("An account with this email already exists.", 409)
  }

  const mobileExists = mockStore.users.some(
    (entry) => entry.mobile === payload.mobile
  )
  if (mobileExists) {
    throw new ApiError("An account with this mobile already exists.", 409)
  }

  const user = {
    id: createId("user"),
    name: payload.name,
    email: normalizeEmail(payload.email),
    mobile: payload.mobile,
    password: payload.password,
    role: "COMMUTER" as const,
    createdAt: new Date().toISOString(),
  }

  mockStore.users.push(user)

  const session = authResponseSchema.parse({
    token: buildMockToken(user.id),
    user: toPublicUser(user),
  })

  return mockDelay(session)
}
