import { appEnv } from "@/lib/env"
import { createManagedUserInputSchema, createManagedUserResponseSchema, usersResponseSchema } from "@/schemas/user-management"
import { ApiError, apiClient } from "@/services/api-client"
import { getStoredAuthToken } from "@/services/auth-token"
import {
  createId,
  getCurrentMockUser,
  mockDelay,
  mockStore,
  toPublicUser,
} from "@/services/mock-store"
import type {
  CreateManagedUserInput,
  CreateManagedUserResponse,
  UsersResponse,
} from "@/types/user-management"

export async function getUsers(): Promise<UsersResponse> {
  if (!appEnv.useMockApi) {
    return apiClient.get<UsersResponse>("/api/users", {
      schema: usersResponseSchema,
    })
  }

  const token = getStoredAuthToken()
  const requester = getCurrentMockUser(token)
  if (!requester) {
    throw new ApiError("Please login to continue.", 401)
  }

  if (requester.role !== "ADMIN" && requester.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403)
  }

  const response = usersResponseSchema.parse({
    users: [...mockStore.users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPublicUser),
  })

  return mockDelay(response)
}

export async function createManagedUser(
  input: CreateManagedUserInput
): Promise<CreateManagedUserResponse> {
  const payload = createManagedUserInputSchema.parse(input)

  if (!appEnv.useMockApi) {
    return apiClient.post<CreateManagedUserResponse, CreateManagedUserInput>(
      "/api/users",
      payload,
      { schema: createManagedUserResponseSchema }
    )
  }

  const token = getStoredAuthToken()
  const requester = getCurrentMockUser(token)
  if (!requester) {
    throw new ApiError("Please login to continue.", 401)
  }

  if (requester.role !== "ADMIN" && requester.role !== "SUPER_ADMIN") {
    throw new ApiError("Forbidden", 403)
  }

  if (requester.role === "ADMIN" && payload.role === "ADMIN") {
    throw new ApiError("Only super admin can create admin users.", 403)
  }

  const existingEmail = mockStore.users.some(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase()
  )
  if (existingEmail) {
    throw new ApiError("An account with this email already exists.", 409)
  }

  const existingMobile = mockStore.users.some((user) => user.mobile === payload.mobile)
  if (existingMobile) {
    throw new ApiError("An account with this mobile already exists.", 409)
  }

  const user = {
    id: createId("user"),
    name: payload.name,
    email: payload.email.toLowerCase(),
    mobile: payload.mobile,
    password: payload.password,
    role: payload.role,
    createdAt: new Date().toISOString(),
  }

  mockStore.users.push(user)

  const response = createManagedUserResponseSchema.parse({
    user: toPublicUser(user),
  })

  return mockDelay(response)
}

